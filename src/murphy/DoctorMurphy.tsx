import { AlertTriangle, ArrowUp, BookOpen, ChevronDown, ExternalLink, RotateCcw, Square, Stethoscope, WifiOff, X } from 'lucide-react';
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
const STAGE_TEXT = { understanding: 'Understanding your question', searching: 'Searching PubMed, StatPearls & MedlinePlus', writing: 'Writing the answer' } as const;
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
        <BookOpen size={13} /> {sources.length} source{sources.length === 1 ? '' : 's'}
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

function AssistantMsg({ m }: { m: Msg }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cite = (n: number) => {
    setOpen(true);
    window.setTimeout(() => ref.current?.querySelector(`#dm-src-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 30);
  };
  return (
    <div className="dm-msg bot" ref={ref}>
      <div className="dm-avatar sm" aria-hidden>
        <Stethoscope size={13} />
      </div>
      <div className="dm-bubble">
        {m.urgent && (
          <div className="dm-urgent" role="alert">
            <AlertTriangle size={15} /> If this is happening now, seek emergency care — dial <b>112</b> (India) or your local emergency number.
          </div>
        )}
        {m.interpreted && <div className="dm-interp">Interpreted as: “{m.interpreted}”</div>}
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
        {!m.streaming && m.sources && <Sources sources={m.sources} open={open} onToggle={() => setOpen((o) => !o)} />}
      </div>
    </div>
  );
}

export function DoctorMurphy({ placement }: { placement: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(loadChat);
  const [input, setInput] = useState('');
  const [avail, setAvail] = useState<Availability>('unknown');
  const online = useOnline();
  const route = useRoute();
  const selectedId = useApp((s) => s.selectedId);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = msgs.some((m) => m.streaming);
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
        if ((e as Error).name !== 'AbortError') patch({ error: navigator.onLine ? 'Could not reach Doctor Murphy. Check your connection and try again.' : 'You are offline.' });
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
      <button className={`dm-fab ${open ? 'hidden' : ''} ${online ? '' : 'off'}`} onClick={() => setOpen(true)} aria-label="Ask Doctor Murphy" title="Doctor Murphy — medical study assistant">
        <span className="dm-fab-ring" aria-hidden />
        <Stethoscope size={22} />
        {!online && (
          <span className="dm-fab-off" aria-hidden>
            <WifiOff size={10} />
          </span>
        )}
      </button>

      {open && (
        <section className="dm-panel" role="dialog" aria-label="Doctor Murphy chat">
          <header className="dm-head">
            <div className="dm-avatar" aria-hidden>
              <Stethoscope size={18} />
            </div>
            <div className="dm-id">
              <div className="dm-name">Doctor Murphy</div>
              <div className="dm-sub">
                <span className={`dm-dot ${avail === 'ready' && online ? 'ok' : blocked ? 'bad' : ''}`} /> {statusText} · medical study assistant
              </div>
            </div>
            {msgs.length > 0 && (
              <button className="dm-icon" onClick={reset} aria-label="New conversation" title="New conversation">
                <RotateCcw size={16} />
              </button>
            )}
            <button className="dm-icon" onClick={() => setOpen(false)} aria-label="Close Doctor Murphy">
              <X size={18} />
            </button>
          </header>
          {focus && (
            <div className="dm-focus" title="Doctor Murphy knows what you are looking at">
              Looking at <b>{focus}</b> · {useApp.getState().bodyModel} anatomy
            </div>
          )}

          <div className="dm-list" ref={listRef}>
            {msgs.length === 0 && (
              <div className="dm-empty">
                <div className="dm-hello">
                  <div className="dm-avatar lg" aria-hidden>
                    <Stethoscope size={26} />
                  </div>
                  <h3>Hi, I’m Doctor Murphy</h3>
                  <p>Ask me about anatomy, physiology, pathology, diagnosis or treatment. I search PubMed, StatPearls and MedlinePlus and cite what I use. Typos are fine.</p>
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
                <AssistantMsg key={m.id} m={m} />
              ),
            )}
          </div>

          {blocked && (
            <div className="dm-banner">
              {!online || avail === 'offline' ? (
                <>
                  <WifiOff size={15} /> You’re offline. Doctor Murphy needs the internet — the 3D anatomy and Learn guides keep working.
                </>
              ) : (
                <>
                  <AlertTriangle size={15} /> Doctor Murphy isn’t set up on this server yet (missing API key or endpoint).
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
              aria-label="Message Doctor Murphy"
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
          <div className="dm-foot">Educational use only — not a diagnosis or medical advice. Answers can contain mistakes; check the sources.</div>
        </section>
      )}
    </div>,
    document.body,
  );
}
