/**
 * LLM providers behind one small interface, so the model can be swapped by configuration only.
 *
 *   MURPHY_PROVIDER     gemini (default) | openai (any OpenAI-compatible API: Groq, OpenRouter, Cerebras…) | mock
 *   GEMINI_API_KEY      Google AI Studio key (free tier)
 *   MURPHY_MODELS       answer models, tried in order on quota/availability errors
 *   MURPHY_FAST_MODELS  models for the quick "understand the question" step
 *   OPENAI_COMPAT_BASE_URL / OPENAI_COMPAT_API_KEY   for MURPHY_PROVIDER=openai, or as a fallback chain
 *   OPENAI_COMPAT_MODELS                             models for that provider
 */

export interface LlmMessage {
  role: 'user' | 'model';
  text: string;
}

export interface LlmCall {
  system: string;
  messages: LlmMessage[];
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
  /** Use the fast model list. */
  fast?: boolean;
}

export interface LlmStream {
  model: string;
  chunks: AsyncGenerator<string>;
}

export interface LlmProvider {
  name: string;
  complete(c: LlmCall): Promise<{ model: string; text: string }>;
  stream(c: LlmCall): Promise<LlmStream>;
}

export type Env = Record<string, string | undefined>;

const list = (v: string | undefined, d: string) =>
  (v || d)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export class LlmError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

const RETRYABLE = new Set([404, 408, 409, 429, 500, 502, 503, 504]);

async function failure(res: Response, who: string): Promise<LlmError> {
  let detail = '';
  try {
    detail = (await res.text()).slice(0, 300);
  } catch {
    /* ignore */
  }
  return new LlmError(`${who} HTTP ${res.status} ${detail}`, res.status, RETRYABLE.has(res.status));
}

/** Read an SSE body and yield the JSON payload of every `data:` line. */
async function* sseJson(body: ReadableStream<Uint8Array>): AsyncGenerator<unknown> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        yield JSON.parse(data);
      } catch {
        /* partial or keep-alive line */
      }
    }
  }
}

// ---------------------------------------------------------------- Gemini (Google AI Studio)
const GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models';
// Educational medical content (reproductive anatomy, drugs, injuries) must not be blocked by default filters.
const SAFETY = ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT'].map((category) => ({ category, threshold: 'BLOCK_ONLY_HIGH' }));

interface GeminiPart {
  text?: string;
  thought?: boolean;
}
interface GeminiChunk {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

function geminiText(c: GeminiChunk): string {
  const parts = c.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text)
    .join('');
}

class GeminiProvider implements LlmProvider {
  name = 'gemini';
  constructor(
    private key: string,
    private models: string[],
    private fastModels: string[],
  ) {}

  private body(c: LlmCall) {
    return JSON.stringify({
      systemInstruction: { parts: [{ text: c.system }] },
      contents: c.messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      safetySettings: SAFETY,
      generationConfig: {
        temperature: c.temperature ?? 0.3,
        // Budget includes the model's internal reasoning tokens on Gemini 2.5+/3.x, so keep it generous.
        maxOutputTokens: c.maxTokens ?? 4096,
        ...(c.json ? { responseMimeType: 'application/json' } : {}),
      },
    });
  }

  /**
   * Try each model in turn. A model that is overloaded, out of quota, or too slow to start answering
   * (`firstChunkMs`) is abandoned for the next one, so a busy flagship never stalls the student.
   */
  private async attempt<T>(c: LlmCall, stream: boolean, firstChunkMs: number, run: (res: Response, model: string, ac: AbortController) => Promise<T>, only?: string[]): Promise<T> {
    let last: unknown;
    for (const model of only ?? (c.fast ? this.fastModels : this.models)) {
      const ac = new AbortController();
      const onOuter = () => ac.abort();
      c.signal?.addEventListener('abort', onOuter);
      const timer = setTimeout(() => ac.abort(new LlmError(`gemini:${model} too slow`, 504, true)), firstChunkMs);
      let ok = false;
      try {
        const url = `${GEMINI}/${encodeURIComponent(model)}:${stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`;
        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': this.key }, body: this.body(c), signal: ac.signal });
        if (!res.ok) {
          last = await failure(res, `gemini:${model}`);
          if (!(last as LlmError).retryable) throw last;
          continue;
        }
        const out = await run(res, model, ac);
        clearTimeout(timer);
        ok = true; // keep the outer-abort link alive while the caller consumes the stream
        return out;
      } catch (e) {
        if (c.signal?.aborted) throw e;
        if (e instanceof LlmError && !e.retryable) throw e;
        last = e instanceof LlmError ? e : new LlmError(`gemini:${model} ${(e as Error)?.message ?? e}`, 504, true);
      } finally {
        clearTimeout(timer);
        if (!ok) c.signal?.removeEventListener('abort', onOuter);
      }
    }
    throw last ?? new LlmError('no gemini model configured', 500, false);
  }

  async complete(c: LlmCall) {
    const run = async (res: Response, model: string) => ({ model, text: geminiText((await res.json()) as GeminiChunk) });
    if (c.fast && this.fastModels.length > 1) {
      // Quick step: race the first two fast models (separate quotas) — free-tier latency varies a lot with demand.
      const [a, b, ...rest] = this.fastModels;
      try {
        return await Promise.any([a!, b!].map((m) => this.attempt({ ...c, fast: false }, false, 8000, run, [m])));
      } catch {
        if (rest.length) return this.attempt({ ...c, fast: false }, false, 12000, run, rest);
        throw new LlmError('fast models unavailable', 503, true);
      }
    }
    return this.attempt(c, false, c.fast ? 9000 : 30000, run);
  }

  async stream(c: LlmCall): Promise<LlmStream> {
    // Wait for the first visible text (after the model's thinking) before committing to a model.
    return this.attempt(c, true, 16000, async (res, model) => {
      const it = sseJson(res.body!);
      const pre: string[] = [];
      let blocked = '';
      for (;;) {
        const { value, done } = await it.next();
        if (done) break;
        const ch = value as GeminiChunk;
        const t = geminiText(ch);
        const reason = ch.candidates?.[0]?.finishReason ?? ch.promptFeedback?.blockReason;
        if (t) {
          pre.push(t);
          break;
        }
        if (reason && reason !== 'STOP' && reason !== 'MAX_TOKENS') {
          blocked = reason;
          break;
        }
      }
      async function* chunks() {
        if (blocked) {
          yield `_The model declined to answer this request (${blocked}). Try rephrasing it as an educational question._`;
          return;
        }
        yield* pre;
        for (;;) {
          const { value, done } = await it.next();
          if (done) break;
          const t = geminiText(value as GeminiChunk);
          if (t) yield t;
        }
      }
      return { model, chunks: chunks() };
    });
  }
}

// ---------------------------------------------------------------- OpenAI-compatible (Groq, OpenRouter, Cerebras, …)
class OpenAICompatProvider implements LlmProvider {
  name = 'openai-compatible';
  constructor(
    private base: string,
    private key: string,
    private models: string[],
    private fastModels: string[],
  ) {}

  private async open(c: LlmCall, stream: boolean) {
    let last: unknown;
    for (const model of c.fast ? this.fastModels : this.models) {
      const res = await fetch(`${this.base.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${this.key}` },
        signal: c.signal,
        body: JSON.stringify({
          model,
          stream,
          temperature: c.temperature ?? 0.3,
          max_tokens: c.maxTokens ?? 2048,
          ...(c.json ? { response_format: { type: 'json_object' } } : {}),
          messages: [{ role: 'system', content: c.system }, ...c.messages.map((m) => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }))],
        }),
      });
      if (res.ok) return { model, res };
      last = await failure(res, `openai:${model}`);
      if (!(last as LlmError).retryable) throw last;
    }
    throw last ?? new LlmError('no model configured', 500, false);
  }

  async complete(c: LlmCall) {
    const { model, res } = await this.open(c, false);
    const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { model, text: j.choices?.[0]?.message?.content ?? '' };
  }

  async stream(c: LlmCall): Promise<LlmStream> {
    const { model, res } = await this.open(c, true);
    async function* chunks() {
      for await (const j of sseJson(res.body!)) {
        const t = (j as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content;
        if (t) yield t;
      }
    }
    return { model, chunks: chunks() };
  }
}

// ---------------------------------------------------------------- Mock (local UI testing without any key)
class MockProvider implements LlmProvider {
  name = 'mock';
  async complete(c: LlmCall) {
    const q = c.messages[c.messages.length - 1]?.text ?? '';
    const m = /Message:\s*(.+)/.exec(q)?.[1] ?? q;
    return { model: 'mock', text: JSON.stringify({ corrected: m, resolved: m, search: [m.slice(0, 80)], consumer: '', intent: 'anatomy', personal: false, urgent: false, retrieve: true }) };
  }
  async stream(): Promise<LlmStream> {
    async function* chunks() {
      for (const w of 'This is a **test answer** from the mock provider. Sources are listed below [1].\n\n- Point one\n- Point two'.split(' ')) {
        yield w + ' ';
        await new Promise((r) => setTimeout(r, 15));
      }
    }
    return { model: 'mock', chunks: chunks() };
  }
}

/** Tries providers in order (e.g. Gemini, then an OpenAI-compatible backup) on retryable failures. */
class ChainProvider implements LlmProvider {
  name: string;
  constructor(private chain: LlmProvider[]) {
    this.name = chain.map((p) => p.name).join(' → ');
  }
  private async run<T>(f: (p: LlmProvider) => Promise<T>): Promise<T> {
    let last: unknown;
    for (const p of this.chain) {
      try {
        return await f(p);
      } catch (e) {
        last = e;
        if (e instanceof LlmError && !e.retryable) throw e;
      }
    }
    throw last;
  }
  complete(c: LlmCall) {
    return this.run((p) => p.complete(c));
  }
  stream(c: LlmCall) {
    return this.run((p) => p.stream(c));
  }
}

export const DEFAULT_MODELS = 'gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite';
export const DEFAULT_FAST_MODELS = 'gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-3.6-flash';

/** Build the configured provider chain, or null when no credentials are set. */
export function providerFromEnv(env: Env): LlmProvider | null {
  const kind = (env.MURPHY_PROVIDER || 'gemini').toLowerCase();
  if (kind === 'mock') return new MockProvider();
  const chain: LlmProvider[] = [];
  const compat =
    env.OPENAI_COMPAT_BASE_URL && env.OPENAI_COMPAT_API_KEY && env.OPENAI_COMPAT_MODELS
      ? new OpenAICompatProvider(env.OPENAI_COMPAT_BASE_URL, env.OPENAI_COMPAT_API_KEY, list(env.OPENAI_COMPAT_MODELS, ''), list(env.OPENAI_COMPAT_FAST_MODELS, env.OPENAI_COMPAT_MODELS))
      : null;
  if (kind === 'openai') {
    if (compat) chain.push(compat);
  } else {
    if (env.GEMINI_API_KEY) chain.push(new GeminiProvider(env.GEMINI_API_KEY, list(env.MURPHY_MODELS, DEFAULT_MODELS), list(env.MURPHY_FAST_MODELS, DEFAULT_FAST_MODELS)));
    if (compat) chain.push(compat);
  }
  if (!chain.length) return null;
  return chain.length === 1 ? chain[0]! : new ChainProvider(chain);
}
