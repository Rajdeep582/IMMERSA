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
    private thinking: Record<string, string> = {},
  ) {}
  /** Models that rejected our thinking setting (retried without it). */
  private noThinking = new Set<string>();
  /** Models that recently returned 429 (quota) are skipped for a minute instead of wasting a call. */
  private cooldown = new Map<string, number>();
  private available(models: string[]): string[] {
    const now = Date.now();
    const ok = models.filter((m) => (this.cooldown.get(m) ?? 0) < now);
    return ok.length ? ok : models;
  }

  /**
   * Reasoning effort per model: answers think a little ("low"), the quick understand step not at all
   * ("minimal") — this alone cuts answer latency several-fold on Gemini 3.x Flash.
   */
  private thinkingFor(model: string, fast: boolean): Record<string, string> | undefined {
    if (this.noThinking.has(model)) return undefined;
    const level = this.thinking[model] ?? (fast || /lite/.test(model) ? (/3\.8/.test(model) ? 'low' : 'minimal') : 'low');
    return /gemini-(3|4)/.test(model) ? { thinkingLevel: level } : undefined;
  }

  private body(c: LlmCall, model: string) {
    const thinkingConfig = this.thinkingFor(model, !!c.fast);
    return JSON.stringify({
      systemInstruction: { parts: [{ text: c.system }] },
      contents: c.messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      safetySettings: SAFETY,
      generationConfig: {
        temperature: c.temperature ?? 0.3,
        // Budget includes the model's internal reasoning tokens on Gemini 2.5+/3.x, so keep it generous.
        maxOutputTokens: c.maxTokens ?? 4096,
        ...(c.json ? { responseMimeType: 'application/json' } : {}),
        ...(thinkingConfig ? { thinkingConfig } : {}),
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
        let res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': this.key }, body: this.body(c, model), signal: ac.signal });
        if (res.status === 400 && !this.noThinking.has(model)) {
          const txt = await res.clone().text();
          if (/thinking/i.test(txt)) {
            this.noThinking.add(model);
            res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': this.key }, body: this.body(c, model), signal: ac.signal });
          }
        }
        if (!res.ok) {
          if (res.status === 429) this.cooldown.set(model, Date.now() + 60_000);
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
      // Quick step: race the first two fast models (separate quotas); the slower one is cancelled.
      const [a, b, ...rest] = this.fastModels;
      const ctls = [new AbortController(), new AbortController()];
      const link = () => ctls.forEach((x) => x.abort());
      c.signal?.addEventListener('abort', link);
      try {
        return await Promise.any(
          [a!, b!].map((m, i) =>
            this.attempt({ ...c, signal: ctls[i]!.signal }, false, 8000, run, [m]).then((r) => {
              ctls[1 - i]!.abort();
              return r;
            }),
          ),
        );
      } catch {
        if (c.signal?.aborted) throw new LlmError('cancelled', 499, false);
        if (rest.length) return this.attempt(c, false, 12000, run, rest);
        throw new LlmError('fast models unavailable', 503, true);
      } finally {
        c.signal?.removeEventListener('abort', link);
      }
    }
    return this.attempt(c, false, c.fast ? 9000 : 30000, run);
  }

  /** Commit to a streaming response once its first visible text arrives (after the model's thinking). */
  private readStream = async (res: Response, model: string): Promise<LlmStream> => {
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
  };

  /**
   * Staggered hedged streaming: start the best model, and every HEDGE_MS (or immediately when the
   * running ones have failed) start the next one; keep whichever begins answering first and cancel
   * the rest. Free-tier flagships are often overloaded or out of quota, so this keeps answers fast.
   */
  async stream(c: LlmCall): Promise<LlmStream> {
    const HEDGE_MS = 2500;
    const models = this.available(this.models);
    if (!models.length) throw new LlmError('no gemini model configured', 500, false);
    return new Promise<LlmStream>((resolve, reject) => {
      const ctls: AbortController[] = [];
      const errors: unknown[] = [];
      let launched = 0;
      let failed = 0;
      let done = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const finish = () => {
        done = true;
        clearTimeout(timer);
        c.signal?.removeEventListener('abort', cancelAll);
      };
      const cancelAll = () => {
        ctls.forEach((x) => x.abort());
        if (!done) {
          finish();
          reject(new LlmError('cancelled', 499, false));
        }
      };
      c.signal?.addEventListener('abort', cancelAll);
      const launch = () => {
        if (done || launched >= models.length) return;
        const i = launched++;
        const ctl = new AbortController();
        ctls[i] = ctl;
        this.attempt({ ...c, signal: ctl.signal }, true, 12000, this.readStream, [models[i]!]).then(
          (r) => {
            if (done) return ctl.abort();
            finish();
            ctls.forEach((x, j) => j !== i && x.abort());
            // Keep cancellation working for the winning stream.
            c.signal?.addEventListener('abort', () => ctl.abort());
            resolve(r);
          },
          (e) => {
            if (done) return;
            errors.push(e);
            failed++;
            if (failed >= models.length) {
              finish();
              reject(errors.find((x) => x instanceof LlmError && x.status === 429) ?? errors[0]);
            } else if (failed >= launched) launch(); // everyone running has failed → next one now
          },
        );
        clearTimeout(timer);
        timer = setTimeout(launch, HEDGE_MS);
      };
      launch();
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

export const DEFAULT_MODELS = 'gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite';
export const DEFAULT_FAST_MODELS = 'gemini-3.1-flash-lite,gemini-3.5-flash-lite';

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
    // MURPHY_THINKING=gemini-3.8-flash=low,gemini-3.6-flash=minimal  (optional per-model override)
    const thinking = Object.fromEntries(list(env.MURPHY_THINKING, '').map((kv) => kv.split('=').map((x) => x.trim()) as [string, string]));
    if (env.GEMINI_API_KEY) chain.push(new GeminiProvider(env.GEMINI_API_KEY, list(env.MURPHY_MODELS, DEFAULT_MODELS), list(env.MURPHY_FAST_MODELS, DEFAULT_FAST_MODELS), thinking));
    if (compat) chain.push(compat);
  }
  if (!chain.length) return null;
  return chain.length === 1 ? chain[0]! : new ChainProvider(chain);
}
