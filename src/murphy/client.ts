import type { ChatTurn, MurphyContext, MurphyEvent } from '../../server/murphy/types';

declare const __ANDROID__: boolean;

/**
 * Where Doctor Murphy lives. The website calls its own serverless function (/api/murphy); the Android
 * app is served from https://localhost, so it needs the deployed site's absolute URL at build time
 * (VITE_MURPHY_API in .env.android or the shell). No API key is ever part of the app.
 */
export const MURPHY_API: string = (import.meta.env.VITE_MURPHY_API as string | undefined) || (__ANDROID__ ? '' : '/api/murphy');

export type Availability = 'unknown' | 'ready' | 'offline' | 'not-configured' | 'unreachable';

export async function checkAvailability(signal?: AbortSignal): Promise<Availability> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
  if (!MURPHY_API) return 'not-configured';
  try {
    const r = await fetch(MURPHY_API, { method: 'GET', signal, cache: 'no-store' });
    if (!r.ok) return 'unreachable';
    const j = (await r.json()) as { configured?: boolean };
    return j.configured ? 'ready' : 'not-configured';
  } catch {
    return navigator.onLine === false ? 'offline' : 'unreachable';
  }
}

/** POST a question and yield server events as they stream in. */
export async function* ask(message: string, history: ChatTurn[], context: MurphyContext, signal: AbortSignal): AsyncGenerator<MurphyEvent> {
  const res = await fetch(MURPHY_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, history, context }),
    signal,
  });
  if (!res.ok || !res.body) {
    let msg = `Doctor Murphy is unavailable (HTTP ${res.status}).`;
    let code: string | undefined;
    try {
      const j = (await res.json()) as { error?: string; code?: string };
      if (j.error) msg = j.error;
      code = j.code;
    } catch {
      /* not JSON */
    }
    yield { type: 'error', message: msg, code };
    return;
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const block = buf.slice(0, i);
      buf = buf.slice(i + 2);
      for (const line of block.split('\n')) {
        if (!line.startsWith('data:')) continue;
        try {
          yield JSON.parse(line.slice(5).trim()) as MurphyEvent;
        } catch {
          /* ignore malformed */
        }
      }
    }
  }
}
