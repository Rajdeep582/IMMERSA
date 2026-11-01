import { answerPrompt, ANSWER_SYSTEM, parsePlan, planPrompt, PLAN_SYSTEM } from './prompts.js';
import { providerFromEnv, type Env, type LlmMessage, LlmError } from './providers.js';
import { retrieve } from './retrieve.js';
import type { ChatTurn, MurphyEvent, MurphyRequest, Plan, Source } from './types.js';

/**
 * Doctor Murphy endpoint — one Web-standard handler used by the Vercel function (api/murphy.ts),
 * the Netlify function (netlify/functions/murphy.mts) and the Vite dev server.
 *
 *  GET     → { ok, configured, provider }      (availability check)
 *  POST    → text/event-stream of MurphyEvent  (status → meta → delta… → done)
 *  OPTIONS → CORS preflight
 *
 * The model API key lives only in the server environment; the app never sees it.
 */

const MAX_MESSAGE = 2000;
const MAX_TURNS = 12;
const WINDOW_MS = 60_000;
const DEFAULT_PER_MINUTE = 10;

// Best-effort per-instance rate limit (serverless instances are short-lived; the model's own quota is the hard cap).
const hits = new Map<string, number[]>();
function limited(ip: string, perMinute: number): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > perMinute;
}

const DEFAULT_ORIGINS = ['https://localhost', 'capacitor://localhost', 'http://localhost', 'http://localhost:5173', 'http://localhost:4173'];

function cors(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allowed = (env.MURPHY_ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const self = (() => {
    try {
      return new URL(req.url).origin;
    } catch {
      return '';
    }
  })();
  const ok = !origin || origin === self || allowed.includes('*') || allowed.includes(origin) || DEFAULT_ORIGINS.includes(origin);
  return {
    ...(ok && origin ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}),
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
  };
}

const json = (body: unknown, status: number, headers: Record<string, string>) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || 'anon').trim();
}

function sanitize(body: unknown): MurphyRequest | string {
  if (!body || typeof body !== 'object') return 'Invalid request.';
  const b = body as Partial<MurphyRequest>;
  const message = typeof b.message === 'string' ? b.message.trim() : '';
  if (!message) return 'Please type a question.';
  if (message.length > MAX_MESSAGE) return `Please keep questions under ${MAX_MESSAGE} characters.`;
  const history: ChatTurn[] = Array.isArray(b.history)
    ? b.history
        .filter((t): t is ChatTurn => !!t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string')
        .slice(-MAX_TURNS)
        .map((t) => ({ role: t.role, content: t.content.slice(0, 4000) }))
    : [];
  // Context is display data from the app; cap its size (drop note extracts first).
  let context = b.context && typeof b.context === 'object' ? { ...b.context } : undefined;
  if (context && JSON.stringify(context).length > 8000) context = { ...context, local: (context.local ?? []).slice(0, 1).map((l) => ({ title: String(l.title).slice(0, 120), text: String(l.text).slice(0, 1500) })) };
  if (context && JSON.stringify(context).length > 8000) context = undefined;
  return { message, history, context };
}

export async function handleMurphy(req: Request, env: Env = (globalThis as { process?: { env: Env } }).process?.env ?? {}): Promise<Response> {
  const headers = cors(req, env);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  const provider = providerFromEnv(env);
  if (req.method === 'GET') return json({ ok: true, configured: !!provider, provider: provider?.name ?? null }, 200, headers);
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);
  if (!provider) return json({ error: 'Doctor Murphy is not configured on the server (missing GEMINI_API_KEY).', code: 'not_configured' }, 503, headers);
  if (limited(clientIp(req), Number(env.MURPHY_RATE_PER_MINUTE) || DEFAULT_PER_MINUTE)) return json({ error: 'Too many questions in a minute — please wait a moment.', code: 'rate_limited' }, 429, headers);

  let parsed: MurphyRequest | string;
  try {
    parsed = sanitize(JSON.parse(await req.text()));
  } catch {
    parsed = 'Invalid request.';
  }
  if (typeof parsed === 'string') return json({ error: parsed, code: 'bad_request' }, 400, headers);
  const { message, history = [], context } = parsed;

  const enc = new TextEncoder();
  const ac = new AbortController();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: MurphyEvent) => controller.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
      const ping = setInterval(() => controller.enqueue(enc.encode(': ping\n\n')), 10_000);
      try {
        // 1. Understand: fix spelling, resolve follow-ups against the app context, plan searches.
        send({ type: 'status', stage: 'understanding' });
        let plan: Plan;
        try {
          const r = await provider.complete({ system: PLAN_SYSTEM, messages: [{ role: 'user', text: planPrompt(message, history, context) }], json: true, fast: true, temperature: 0, maxTokens: 1024, signal: ac.signal });
          plan = parsePlan(r.text, message);
        } catch {
          plan = parsePlan('', message);
        }

        // 2. Retrieve from PubMed / StatPearls / MedlinePlus and IMMERSA's own notes.
        let sources: Source[] = [];
        if (plan.retrieve) {
          send({ type: 'status', stage: 'searching' });
          const found = await retrieve(plan, env, ac.signal, context?.selected?.name).catch(() => []);
          // Fewer, shorter sources for short answers → smaller prompt → faster first token.
          const keep = plan.depth === 'detailed' ? 6 : plan.depth === 'standard' ? 5 : 4;
          const clipTo = plan.depth === 'detailed' ? 1300 : plan.depth === 'standard' ? 900 : 650;
          sources = found.slice(0, keep).map((s, i) => ({ ...s, n: i + 1, snippet: s.snippet.length > clipTo ? s.snippet.slice(0, clipTo).replace(/\s+\S*$/, '') + '…' : s.snippet }));
        }
        send({ type: 'meta', plan: { corrected: plan.corrected, resolved: plan.resolved, urgent: plan.urgent, personal: plan.personal }, sources });

        // 3. Answer, streamed.
        send({ type: 'status', stage: 'writing' });
        const messages: LlmMessage[] = [...history.slice(-8).map((t) => ({ role: t.role === 'user' ? ('user' as const) : ('model' as const), text: t.content.slice(0, 1500) })), { role: 'user', text: answerPrompt(message, plan, context, sources) }];
        // Gemini requires the conversation to start with a user turn.
        while (messages.length && messages[0]!.role !== 'user') messages.shift();
        const s = await provider.stream({ system: ANSWER_SYSTEM, messages, maxTokens: plan.depth === 'detailed' ? 6000 : plan.depth === 'standard' ? 3000 : 2000, temperature: 0.3, signal: ac.signal });
        for await (const t of s.chunks) send({ type: 'delta', text: t });
        send({ type: 'done', model: s.model });
      } catch (e) {
        const quota = e instanceof LlmError && e.status === 429;
        send({ type: 'error', code: quota ? 'quota' : 'failed', message: quota ? 'Doctor Murphy has reached the free usage limit for now. Please try again in a little while.' : 'Doctor Murphy could not answer right now. Please try again.' });
        console.error('[murphy]', e instanceof Error ? e.message : e);
      } finally {
        clearInterval(ping);
        controller.close();
      }
    },
    cancel() {
      ac.abort();
    },
  });
  return new Response(stream, { status: 200, headers: { ...headers, 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store, no-transform', 'x-accel-buffering': 'no' } });
}
