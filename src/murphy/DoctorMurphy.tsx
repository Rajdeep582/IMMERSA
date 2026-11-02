import { AlertTriangle, ArrowUp, BookOpen, Check, ChevronDown, Copy, ExternalLink, Maximize2, Minimize2, RotateCcw, Square, WifiOff, X } from 'lucide-react';
import { DoctorAvatar } from './DoctorAvatar';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ChatTurn, Source } from '../../server/murphy/types';
import { useRoute } from '../learn/route';
import { useApp } from '../state/store';
import { ask, checkAvailability, type Availability } from './client';
import { buildContext, focusLabel } from './context';
import { Markdown } from './Markdown';

interface Msg {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  stage?: 'understanding' | 'searching' | 'writing' | null;
  error?: string;
  urgent?: boolean;
  interpreted?: string;
  streaming?: boolean;
}

const STORE_KEY = 'immersa.murphy.chat';
const FULL_KEY = 'immersa.murphy.full';
/** One-tap follow-ups shown under the latest answer. */
const FOLLOW_UPS: [string, string][] = [
  ['More detail', 'Explain that in more detail.'],
  ['Simpler', 'Explain that more simply, in 2–3 sentences.'],
  ['Clinical relevance', 'What is the clinical relevance of that?'],
  ['Memory aid', 'Give me a memory aid for that.'],
];
const STAGE_TEXT = { understanding: 'Dr. Murphy is thinking', searching: 'Checking my references', writing: 'Dr. Murphy is typing' } as const;
let seq = Date.now();

function loadChat(): Msg[] {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Msg[]).map((m) => ({ ...m, streaming: false, stage: null })) : [];
  } catch {
    return [];
  }
}
function saveChat(m: Msg[]) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(m.slice(-40)));
  } catch {
    /* storage unavailable */
  }
}

function useOnline() {
  const [on, setOn] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  useEffect(() => {
    const up = () => setOn(true);
    const down = () => setOn(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return on;
}

function suggestions(focus: string | null, view: string): string[] {
  if (focus)
    return [`What is the function of the ${focus.toLowerCase()}?`, `Blood and nerve supply of the ${focus.toLowerCase()}`, `Clinical significance of the ${focus.toLowerCase()}`, `Give me a memory aid for the ${focus.toLowerCase()}`];
  if (view === 'learn') return ['Summarise this topic for quick revision', 'What are the high-yield exam points here?', 'Explain the clinical correlations'];
  return ['Explain the brachial plexus simply', 'Differential diagnosis of acute chest pain', 'How does the loop of Henle concentrate urine?', 'Upper vs lower motor neuron lesion'];
}

function Sources({ sources, open, onToggle }: { sources: Source[]; open: boolean; onToggle: () => void }) {
  if (!sources.length) return null;
  return (
    <div className={`dm-sources ${open ? 'open' : ''}`}>
      <button className="dm-src-toggle" onClick={onToggle} aria-expanded={open}>
        <BookOpen size={13} /> References ({sources.length})
        <ChevronDown size={14} className="chev" />
      </button>
      {open && (
        <ol>
          {sources.map((s) => (
            <li key={s.n} id={`dm-src-${s.n}`}>
              <span className="n">{s.n}</span>
              <a href={s.url} target="_blank" rel="noreferrer noopener">
                <span className="t">{s.title}</span>
                <span className="s">
                  {s.source}
                  {s.year ? ` · ${s.year}` : ''} <ExternalLink size={11} />
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function AssistantMsg({ m, last, onFollow }: { m: Msg; last: boolean; onFollow: (q: string) => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(m.content.replace(/\[(\d+(?:[,\s]+\d+)*)\]/g, '')).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    });
  };
  const ref = useRef<HTMLDivElement>(null);
  const cite = (n: number) => {
    setOpen(true);
    window.setTimeout(() => ref.current?.querySelector(`#dm-src-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 30);
  };
  return (
    <div className="dm-msg bot" ref={ref}>
      <DoctorAvatar size={30} state={m.streaming ? (m.content ? 'talking' : 'thinking') : 'idle'} className="dm-av-sm" />
      <div className="dm-bubble">
        {m.urgent && (
          <div className="dm-urgent" role="alert">
            <AlertTriangle size={15} /> If this is happening now, seek emergency care — dial <b>112</b> (India) or your local emergency number.
          </div>
        )}
        {m.content ? (
          <div className="dm-md">
            <Markdown text={m.content} onCite={cite} />
            {m.streaming && <span className="dm-caret" aria-hidden />}
          </div>
        ) : m.stage ? (
          <div className="dm-stage" role="status">
            <span className="dm-dots" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            {STAGE_TEXT[m.stage]}…
          </div>
        ) : null}
        {m.error && <div className="dm-error">{m.error}</div>}
        {!m.streaming && m.content && (
          <div className="dm-tools">
            {m.sources && <Sources sources={m.sources} open={open} onToggle={() => setOpen((o) => !o)} />}
            <button className="dm-copy" onClick={copy} aria-label="Copy answer" title="Copy answer">
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        )}
        {last && !m.streaming && m.content && !m.error && (
          <div className="dm-follow" role="group" aria-label="Follow-up questions">
            {FOLLOW_UPS.map(([label, q]) => (
              <button key={label} onClick={() => onFollow(q)}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function DoctorMurphy({ placement }: { placement: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(loadChat);
  const [input, setInput] = useState('');
  const [avail, setAvail] = useState<Availability>('unknown');
  const [full, setFull] = useState(() => {
    try {
      return localStorage.getItem(FULL_KEY) === '1';
    } catch {
      return false;
    }
  });
  const toggleFull = () =>
    setFull((f) => {
      try {
        localStorage.setItem(FULL_KEY, f ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !f;
    });
  const online = useOnline();
  const route = useRoute();
  const selectedId = useApp((s) => s.selectedId);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = msgs.some((m) => m.streaming);
  const live = msgs.find((m) => m.streaming);
  const headState = live ? (live.content ? 'talking' : 'thinking') : 'idle';
  const lastBot = [...msgs].reverse().find((m) => m.role === 'assistant')?.id;
  // Re-read the focus label whenever selection or page changes.
  const focus = (void selectedId, void route, focusLabel());

  useEffect(() => saveChat(msgs), [msgs]);

  // Other parts of the app (study card, Learn) can open the chat, optionally with a draft question.
  useEffect(() => {
    const on = (e: Event) => {
      const draft = (e as CustomEvent<{ draft?: string }>).detail?.draft;
      setOpen(true);
      if (draft) setInput(draft);
    };
    window.addEventListener('immersa:murphy', on);
    return () => window.removeEventListener('immersa:murphy', on);
  }, []);

  // Availability: re-check when opened and when connectivity changes.
  useEffect(() => {
    if (!open) return;
    if (!online) return setAvail('offline');
    const ac = new AbortController();
    setAvail((a) => (a === 'ready' ? a : 'unknown'));
    void checkAvailability(ac.signal).then((a) => !ac.signal.aborted && setAvail(a));
    return () => ac.abort();
  }, [open, online]);

  // Keep the newest message in view while streaming.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    if (near || busy) el.scrollTop = el.scrollHeight;
  }, [msgs, busy]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 260);
  }, [open]);

  // Esc closes; Android back closes via the shared back-handler order (panel is a dialog).
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && (e.stopPropagation(), setOpen(false));
    window.addEventListener('keydown', k, true);
    const back = (e: Event) => {
      e.preventDefault();
      setOpen(false);
    };
    window.addEventListener('immersa:back', back);
    return () => {
      window.removeEventListener('keydown', k, true);
      window.removeEventListener('immersa:back', back);
    };
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      if (!navigator.onLine) return setAvail('offline');
      const history: ChatTurn[] = msgs.filter((m) => m.content && !m.error).slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const user: Msg = { id: ++seq, role: 'user', content: q };
      const bot: Msg = { id: ++seq, role: 'assistant', content: '', streaming: true, stage: 'understanding' };
      setMsgs((m) => [...m, user, bot]);
      setInput('');
      const ac = new AbortController();
      abortRef.current = ac;
      const patch = (p: Partial<Msg> | ((m: Msg) => Partial<Msg>)) => setMsgs((all) => all.map((m) => (m.id === bot.id ? { ...m, ...(typeof p === 'function' ? p(m) : p) } : m)));
      try {
        for await (const ev of ask(q, history, buildContext(q), ac.signal)) {
          if (ev.type === 'status') patch({ stage: ev.stage });
          else if (ev.type === 'meta') {
            const changed = ev.plan.resolved && ev.plan.resolved.toLowerCase().replace(/\W/g, '') !== q.toLowerCase().replace(/\W/g, '');
            patch({ sources: ev.sources, urgent: ev.plan.urgent, interpreted: changed ? ev.plan.resolved : undefined });
          } else if (ev.type === 'delta') patch((m) => ({ content: m.content + ev.text, stage: null }));
          else if (ev.type === 'error') {
            patch({ error: ev.message, stage: null });
            if (ev.code === 'not_configured') setAvail('not-configured');
          }
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') patch({ error: navigator.onLine ? 'Hmm, I couldn’t get through just now — check your connection and ask me again?' : 'You are offline.' });
      } finally {
        patch((m) => ({ streaming: false, stage: null, content: m.content || (m.error ? '' : ac.signal.aborted ? '_Stopped._' : '') }));
        abortRef.current = null;
      }
    },
    [busy, msgs],
  );

  const stop = () => abortRef.current?.abort();
  const reset = () => {
    stop();
    setMsgs([]);
  };

  const blocked = avail === 'offline' || avail === 'not-configured' || !online;
  const statusText = !online || avail === 'offline' ? 'Offline' : avail === 'not-configured' ? 'Not set up' : avail === 'unreachable' ? 'Unreachable' : avail === 'ready' ? 'Online' : 'Connecting…';

  return createPortal(
    <div className={`dm-root ${placement}`}>
      <button className={`dm-fab ${open ? 'hidden' : ''} ${online ? '' : 'off'}`} onClick={() => setOpen(true)} aria-label="Ask Dr. Murphy" title="Dr. Murphy — medical study assistant">
        <span className="dm-fab-ring" aria-hidden />
        <DoctorAvatar size={58} state="idle" className="dm-fab-av" />
        <span className="dm-fab-tip" aria-hidden>
          Ask Dr Murphy
        </span>
        {!online && (
          <span className="dm-fab-off" aria-hidden>
            <WifiOff size={10} />
          </span>
        )}
      </button>

      {open && (
        <section className={`dm-panel ${full ? 'full' : 'card'}`} role="dialog" aria-label="Dr. Murphy chat">
          <header className="dm-head">
            <DoctorAvatar size={42} state={headState} className="dm-av-head" />
            <div className="dm-id">
              <div className="dm-name">Dr. Murphy</div>
              <div className="dm-sub">
                <span className={`dm-dot ${avail === 'ready' && online ? 'ok' : blocked ? 'bad' : ''}`} /> {statusText} · your resident doctor
              </div>
            </div>
            {msgs.length > 0 && (
              <button className="dm-icon" onClick={reset} aria-label="New conversation" title="New conversation">
                <RotateCcw size={16} />
              </button>
            )}
            <button className="dm-icon" onClick={toggleFull} aria-label={full ? 'Exit full screen' : 'Full screen'} title={full ? 'Exit full screen' : 'Full screen'}>
              {full ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
            <button className="dm-icon" onClick={() => setOpen(false)} aria-label="Close Dr. Murphy">
              <X size={18} />
            </button>
          </header>
          {focus && (
            <div className="dm-focus" title="Dr. Murphy knows what you are looking at">
              Looking at <b>{focus}</b> · {useApp.getState().bodyModel} anatomy
            </div>
          )}

          <div className="dm-list" ref={listRef}>
            {msgs.length === 0 && (
              <div className="dm-empty">
                <div className="dm-hello">
                  <DoctorAvatar size={84} state="idle" className="dm-av-hello" />
                  <h3>Hi, I’m Dr. Murphy 👋</h3>
                  <p>Your friendly resident doctor. Ask me anything — anatomy, physiology, pathology, a tricky case or that viva question you’re dreading. Typos are fine, I’ll figure it out.</p>
                  <p className="dm-privacy">Please don’t share names or other personal details.</p>
                </div>
                <div className="dm-suggest">
                  {suggestions(focus, route.view).map((s) => (
                    <button key={s} onClick={() => void send(s)} disabled={blocked}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="dm-msg me">
                  <div className="dm-bubble">{m.content}</div>
                </div>
              ) : (
                <AssistantMsg key={m.id} m={m} last={m.id === lastBot} onFollow={(q) => void send(q)} />
              ),
            )}
          </div>

          {blocked && (
            <div className="dm-banner">
              {!online || avail === 'offline' ? (
                <>
                  <WifiOff size={15} /> You’re offline. Dr. Murphy needs the internet — the 3D anatomy and Learn guides keep working.
                </>
              ) : (
                <>
                  <AlertTriangle size={15} /> Dr. Murphy isn’t set up on this server yet (missing API key or endpoint).
                </>
              )}
            </div>
          )}

          <form
            className="dm-input"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              maxLength={2000}
              placeholder={focus ? `Ask about the ${focus.toLowerCase()}…` : 'Ask a medical question…'}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(140, e.target.scrollHeight) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              disabled={blocked}
              aria-label="Message Dr. Murphy"
            />
            {busy ? (
              <button type="button" className="dm-send stop" onClick={stop} aria-label="Stop">
                <Square size={14} />
              </button>
            ) : (
              <button type="submit" className="dm-send" disabled={!input.trim() || blocked} aria-label="Send">
                <ArrowUp size={18} />
              </button>
            )}
          </form>
          <div className="dm-foot">I’m a teaching assistant, not your doctor — answers can be wrong, so check the references.</div>
        </section>
      )}
    </div>,
    document.body,
  );
}
