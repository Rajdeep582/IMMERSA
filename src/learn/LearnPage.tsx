import { Activity, ArrowLeft, ArrowRight, BookMarked, Box, Brain, CheckCircle2, ChevronRight, Clock, Compass, Droplets, Flame, GitCompare, GraduationCap, HelpCircle, Layers3, Lightbulb, MapPin, Moon, RotateCcw, Search as SearchIcon, Star, Stethoscope, Sun, Type, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Registry } from '../data/registry';
import { SYSTEM_BY_ID } from '../data/systems';
import type { BodyModel } from '../data/types';
import type { QualityProfile } from '../engine/quality';
import { viewer } from '../engine/viewer';
import { BodyToggle } from '../ui/BodyToggle';
import { BlockView, type BlockCtx } from './Blocks';
import { SYSTEM_TOPICS, TOPICS, TOPIC_BY_ID, childTopics, resolveName, topicFor } from './index';
import { Rich, plain } from './Rich';
import { navBack, openExplorer, openExplorerFresh, openLearn, useCanGoBack } from './route';
import { FocusCard } from './FocusCard';
import { useApp } from '../state/store';
import type { Block, Topic } from './types';

const SECTION_ICON: Record<string, typeof MapPin> = {
  overview: MapPin,
  structure: Layers3,
  function: Activity,
  clinical: Stethoscope,
  key: Star,
  applied: Stethoscope,
  revision: Flame,
  memory: Lightbulb,
  relations: Compass,
  blood: Droplets,
  coronary: Droplets,
  vessels: Droplets,
  tracts: Zap,
  injuries: Zap,
  compare: GitCompare,
  areas: Brain,
};

function useStored<T extends string>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => {
    try {
      return (localStorage.getItem(key) as T) || initial;
    } catch {
      return initial;
    }
  });
  const set = (x: T) => {
    setV(x);
    try {
      localStorage.setItem(key, x);
    } catch {
      /* storage unavailable */
    }
  };
  return [v, set];
}

/** Jump from a learning page to the 3D explorer with the structure selected and framed. */
function showIn3D(id: string) {
  openExplorerFresh();
  window.setTimeout(() => viewer.selectAndFocus(id), 60);
}

/** Return to the explorer entry the user came from (selection + camera restored); select `id` if it is not already. */
function backTo3D(id: string) {
  openExplorer();
  window.setTimeout(() => {
    if (useApp.getState().selectedId !== id) viewer.selectAndFocus(id);
  }, 80);
}

function blockText(b: Block): string {
  switch (b.t) {
    case 'p':
      return b.text;
    case 'bullets':
    case 'steps':
      return b.items.join(' ');
    case 'flow':
      return b.title + ' ' + b.steps.map((s) => s.label + ' ' + (s.note ?? '')).join(' ');
    case 'table':
      return (b.title ?? '') + ' ' + b.rows.flat().join(' ');
    case 'layers':
      return b.title + ' ' + b.layers.map((l) => l.name + ' ' + l.note).join(' ');
    case 'callout':
      return b.text;
    case 'mnemonic':
      return b.title + ' ' + b.phrase + ' ' + b.items.map((x) => x.join(' ')).join(' ');
    case 'relations':
      return b.title + ' ' + b.center + ' ' + Object.values(b.sides).join(' ');
    case 'compare':
      return b.title + ' ' + b.cols.join(' ') + ' ' + b.rows.flat().join(' ');
    case 'highyield':
      return b.items.join(' ');
    case 'terms':
      return b.items.flat().join(' ');
    default:
      return '';
  }
}
const topicText = (t: Topic) => plain([t.title, t.tagline, ...t.sections.flatMap((s) => [s.title, ...s.blocks.map(blockText)])].join(' ')).toLowerCase();

function Hub({ registry }: { registry: Registry | null }) {
  const [q, setQ] = useState('');
  const index = useMemo(() => TOPICS.map((t) => ({ t, hay: topicText(t) })), []);
  const hits = q.trim().length > 1 ? index.filter((x) => q.toLowerCase().split(/\s+/).every((w) => x.hay.includes(w))).map((x) => x.t) : null;
  const selectedId = useApp((s) => s.selectedId);
  const sel = registry && selectedId ? registry.get(selectedId) : undefined;
  const selTopic = registry && sel ? topicFor(registry, sel) : undefined;
  return (
    <div className="lhub">
      {sel && selTopic && (
        <button className="lhub-continue" onClick={() => openLearn(selTopic.id, undefined, sel.id)} style={{ ['--sys' as string]: SYSTEM_BY_ID[sel.system].swatch }}>
          <span className="lsys-dot" />
          <span className="lhc-text">
            <small>Selected in 3D</small>
            <b>{sel.name}</b>
          </span>
          <span className="lhc-go">
            Study it <ArrowRight size={15} />
          </span>
        </button>
      )}
      <header className="lhub-hero">
        <div className="lhub-kicker">
          <GraduationCap size={16} /> Study guides
        </div>
        <h1>Learn anatomy, system by system</h1>
        <p>Each guide follows the same order — <b>what and where</b>, <b>structure</b>, <b>function</b>, <b>clinical significance</b> and <b>key points</b> — with a live 3D figure and a short self-test.</p>
        <ol className="lhub-how">
          <li>
            <span>1</span>
            <span>Pick a system or topic below.</span>
          </li>
          <li>
            <span>2</span>
            <span>
              Read point by point: <b className="kw">highlighted</b> words are key terms and <span className="xlink static">underlined names</span> open the structure in 3D.
            </span>
          </li>
          <li>
            <span>3</span>
            <span>
              Finish with <b>Key points</b> and <b>Test yourself</b>.
            </span>
          </li>
        </ol>
        <label className="lhub-search">
          <SearchIcon size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guides — e.g. carpal tunnel, CSF, nephron" aria-label="Search study guides" />
        </label>
      </header>
      {hits ? (
        <section className="lhub-results">
          <h2>
            {hits.length} guide{hits.length === 1 ? '' : 's'} mention “{q}”
          </h2>
          <div className="lcards">
            {hits.map((t) => (
              <TopicCard key={t.id} t={t} />
            ))}
          </div>
        </section>
      ) : (
        <div className="lhub-grid">
          {SYSTEM_TOPICS.map((t) => (
            <article key={t.id} className="lsys" style={{ ['--sys' as string]: SYSTEM_BY_ID[t.system].swatch }}>
              <button className="lsys-main" onClick={() => openLearn(t.id)}>
                <span className="lsys-dot" />
                <span className="lsys-title">{t.title}</span>
                <span className="lsys-tag">{t.tagline}</span>
                <span className="lsys-meta">
                  <Clock size={12} /> {t.minutes} min
                  {registry && !resolveName(registry, t.focus[registry.model]) && <em> · not in {registry.model} model</em>}
                </span>
              </button>
              {childTopics(t.id).length > 0 && (
                <ul className="lsys-subs">
                  {[...childTopics(t.id), ...childTopics(t.id).flatMap((c) => childTopics(c.id))].map((c) => (
                    <li key={c.id}>
                      <button onClick={() => openLearn(c.id)}>
                        <ChevronRight size={13} /> {c.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function TopicCard({ t }: { t: Topic }) {
  return (
    <button className="lcard" style={{ ['--sys' as string]: SYSTEM_BY_ID[t.system].swatch }} onClick={() => openLearn(t.id)}>
      <span className="lsys-dot" />
      <span className="lcard-t">{t.title}</span>
      <span className="lcard-s">{t.tagline}</span>
    </button>
  );
}

function Quiz({ topic, ctx }: { topic: Topic; ctx: BlockCtx }) {
  const [shown, setShown] = useState<Record<number, boolean>>({});
  const [marks, setMarks] = useState<Record<number, 'ok' | 'again'>>({});
  useEffect(() => {
    setShown({});
    setMarks({});
  }, [topic.id]);
  const done = Object.keys(marks).length;
  const ok = Object.values(marks).filter((m) => m === 'ok').length;
  return (
    <div className="lquiz">
      {topic.quiz.map((qa, i) => (
        <div key={i} className={`lq ${marks[i] ?? ''}`}>
          <div className="lq-q">
            <span className="lq-n">Q{i + 1}</span>
            <Rich text={qa.q} registry={ctx.registry} onLink={ctx.onLink} />
          </div>
          {shown[i] ? (
            <>
              <div className="lq-a">
                <Rich text={qa.a} registry={ctx.registry} onLink={ctx.onLink} />
              </div>
              <div className="lq-mark">
                <button className={marks[i] === 'ok' ? 'on' : ''} onClick={() => setMarks({ ...marks, [i]: 'ok' })}>
                  <CheckCircle2 size={14} /> I knew it
                </button>
                <button className={marks[i] === 'again' ? 'on' : ''} onClick={() => setMarks({ ...marks, [i]: 'again' })}>
                  <RotateCcw size={14} /> Review again
                </button>
              </div>
            </>
          ) : (
            <button className="lq-reveal" onClick={() => setShown({ ...shown, [i]: true })}>
              Show answer
            </button>
          )}
        </div>
      ))}
      {done > 0 && (
        <div className="lq-score" role="status">
          {ok} of {topic.quiz.length} known{done < topic.quiz.length ? ` · ${topic.quiz.length - done} left` : ''}
          <button className="xlink" onClick={() => (setShown({}), setMarks({}))}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

function TopicView({ topic, registry, quality, section, focusId }: { topic: Topic; registry: Registry | null; quality: QualityProfile; section?: string; focusId?: string }) {
  const scroller = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(topic.sections[0]?.id ?? '');
  const parent = topic.parent ? TOPIC_BY_ID.get(topic.parent) : undefined;
  const subs = childTopics(topic.id);
  const siblings = parent ? childTopics(parent.id) : [];
  const order = TOPICS;
  const idx = order.findIndex((t) => t.id === topic.id);
  const prev = order[idx - 1];
  const next = order[idx + 1];
  const focus = registry ? resolveName(registry, topic.focus[registry.model]) : undefined;
  // Structure the guide was opened for (from the 3D explorer). After a body switch the URL id may belong
  // to the other model; the mapped selection is used then.
  const selectedId = useApp((s) => s.selectedId);
  const picked = registry && focusId ? (registry.get(focusId) ?? (selectedId ? registry.get(selectedId) : undefined)) : undefined;
  let fig = 0;
  const ctx: BlockCtx = { registry, quality, onLink: showIn3D, figureNo: () => ++fig };
  const hasQuiz = topic.quiz.length > 0;
  const toc = [...topic.sections.map((s, i) => ({ id: s.id, title: s.title, n: i + 1 })), ...(hasQuiz ? [{ id: 'quiz', title: 'Test yourself', n: topic.sections.length + 1 }] : []), { id: 'refs', title: 'References', n: 0 }];

  useEffect(() => {
    scroller.current = document.querySelector('.learn');
    const target = section ? document.getElementById(`sec-${section}`) : null;
    if (target) target.scrollIntoView({ block: 'start' });
    else scroller.current?.scrollTo({ top: 0 });
    setActive(section ?? topic.sections[0]?.id ?? '');
  }, [topic.id, section, topic.sections]);

  useEffect(() => {
    const els = toc.map((t) => document.getElementById(`sec-${t.id}`)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id.replace('sec-', ''));
      },
      { root: document.querySelector('.learn'), rootMargin: '-15% 0px -70% 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id]);

  // Keep the active chip visible in the horizontal (phone) table of contents.
  useEffect(() => {
    const btn = document.querySelector<HTMLElement>(`.ltoc button[data-id="${active}"]`);
    const list = btn?.closest('ol');
    if (btn && list && list.scrollWidth > list.clientWidth) list.scrollTo({ left: btn.offsetLeft - 12, behavior: 'smooth' });
  }, [active]);

  // Off-screen sections use content-visibility (estimated heights), so correct the landing once rendered.
  const jump = (id: string) => {
    const el = document.getElementById(`sec-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450);
  };

  return (
    <div className="ltopic" style={{ ['--sys' as string]: SYSTEM_BY_ID[topic.system].swatch }}>
      <nav className="ltoc" aria-label="On this page">
        <div className="ltoc-h">On this page</div>
        <ol>
          {toc.map((t) => (
            <li key={t.id}>
              <button data-id={t.id} className={active === t.id ? 'on' : ''} onClick={() => jump(t.id)} aria-current={active === t.id ? 'true' : undefined}>
                {t.n > 0 && <span className="ltoc-n">{t.n}</span>}
                {t.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <article className="larticle">
        <div className="lkicker">
          <span className="lsys-dot" />
          {parent ? (
            <>
              <button className="xlink" onClick={() => openLearn(parent.id)}>
                {parent.title}
              </button>
              <ChevronRight size={13} />
            </>
          ) : (
            'System guide'
          )}
          <span className="lkicker-time">
            <Clock size={12} /> {topic.minutes} min read
          </span>
        </div>
        <h1>{topic.title}</h1>
        <p className="ltagline">{topic.tagline}</p>
        <div className="lactions">
          {picked && (
            <button className="lbtn primary" onClick={() => backTo3D(picked.id)}>
              <Box size={15} /> Back to {picked.name} in 3D
            </button>
          )}
          {focus && (
            <button className={`lbtn ${picked ? '' : 'primary'}`} onClick={() => showIn3D(focus.id)}>
              <Box size={15} /> {picked ? `Whole ${topic.title.toLowerCase()} in 3D` : 'Explore in 3D'}
            </button>
          )}
          <button className="lbtn" onClick={() => jump('key')}>
            <Star size={15} /> Key points
          </button>
          {topic.sections.some((x) => x.id === 'revision') && (
            <button className="lbtn" onClick={() => jump('revision')}>
              <Flame size={15} /> Rapid revision
            </button>
          )}
        </div>

        {picked && registry && <FocusCard rec={picked} registry={registry} quality={quality} onBack={() => backTo3D(picked.id)} onLink={showIn3D} topicId={topic.id} />}

        {topic.sections.map((s, i) => {
          const Icon = SECTION_ICON[s.id] ?? BookMarked;
          return (
            <section key={s.id} id={`sec-${s.id}`} className={`lsec s-${s.id}`}>
              <h2>
                <span className="lsec-n">{i + 1}</span>
                <Icon size={18} aria-hidden />
                {s.title}
              </h2>
              {s.blocks.map((b, j) => (
                <BlockView key={j} b={b} ctx={ctx} />
              ))}
            </section>
          );
        })}

        {hasQuiz && (
        <section id="sec-quiz" className="lsec s-quiz">
          <h2>
            <span className="lsec-n">{topic.sections.length + 1}</span>
            <HelpCircle size={18} aria-hidden />
            Test yourself
          </h2>
          <p className="lp muted">Answer in your head first, then reveal and mark yourself.</p>
          <Quiz topic={topic} ctx={ctx} />
        </section>
        )}

        <section id="sec-refs" className="lsec s-refs">
          <h2>
            <BookMarked size={18} aria-hidden /> References
          </h2>
          <ul className="lrefs">
            {topic.refs.map((r) => (
              <li key={r.label}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="disclaimer">Educational content for study and revision. Not a substitute for clinical training or medical advice.</p>
        </section>

        <nav className="lpager" aria-label="Previous and next guide">
          {prev ? (
            <button onClick={() => openLearn(prev.id)}>
              <ArrowLeft size={15} />
              <span>
                <small>Previous</small>
                {prev.title}
              </span>
            </button>
          ) : (
            <span />
          )}
          {next && (
            <button className="next" onClick={() => openLearn(next.id)}>
              <span>
                <small>Next</small>
                {next.title}
              </span>
              <ArrowRight size={15} />
            </button>
          )}
        </nav>
      </article>

      <aside className="lrail" aria-label="Related guides">
        {subs.length > 0 && (
          <div className="lrail-box">
            <div className="lrail-h">Topics in this guide</div>
            {subs.map((c) => (
              <button key={c.id} onClick={() => openLearn(c.id)}>
                <ChevronRight size={13} /> {c.title}
              </button>
            ))}
          </div>
        )}
        {parent && siblings.length > 1 && (
          <div className="lrail-box">
            <div className="lrail-h">More in {parent.title}</div>
            {siblings
              .filter((s) => s.id !== topic.id)
              .map((c) => (
                <button key={c.id} onClick={() => openLearn(c.id)}>
                  <ChevronRight size={13} /> {c.title}
                </button>
              ))}
          </div>
        )}
        <div className="lrail-box tip">
          <div className="lrail-h">Study tip</div>
          <p>Open the 3D explorer and click any structure — its study card shows location, structure, function and clinical notes beside the model.</p>
        </div>
      </aside>
    </div>
  );
}

export function LearnPage({ topicId, section, focusId, registry, quality, switching, onSwitchModel }: { topicId: string | null; section?: string; focusId?: string; registry: Registry | null; quality: QualityProfile; switching: BodyModel | null; onSwitchModel: (m: BodyModel) => void }) {
  const canBack = useCanGoBack();
  const topic = topicId ? TOPIC_BY_ID.get(topicId) : undefined;
  const [size, setSize] = useStored<'s' | 'm' | 'l'>('immersa.readSize', 'm');
  const [theme, setTheme] = useStored<'dark' | 'light'>('immersa.readTheme', 'dark');
  useEffect(() => {
    document.title = topic ? `${topic.title} · Immersa Learn` : 'Study guides · Immersa';
    return () => {
      document.title = 'Immersa — 3D Anatomy';
    };
  }, [topic]);
  return (
    <div className={`learn size-${size} theme-${theme}`} role="main">
      <header className="lbar">
        {canBack && (
          <button className="back-btn" onClick={navBack} aria-label="Back" title="Back">
            <ArrowLeft size={18} />
          </button>
        )}
        <button className="lbtn ghost" onClick={openExplorer} title="Go to the 3D explorer">
          <Box size={16} /> <span className="hide-xs">3D explorer</span>
        </button>
        <nav className="lcrumbs" aria-label="Breadcrumb">
          <button onClick={() => openLearn(null)} className={!topic ? 'on' : ''}>
            <GraduationCap size={15} /> Learn
          </button>
          {topic?.parent && TOPIC_BY_ID.get(topic.parent) && (
            <span className="hide-xs">
              <ChevronRight size={13} />
              <button onClick={() => openLearn(topic.parent!)}>{TOPIC_BY_ID.get(topic.parent)!.title}</button>
            </span>
          )}
          {topic && (
            <>
              <ChevronRight size={13} />
              <span className="on">{topic.title}</span>
            </>
          )}
        </nav>
        <div className="lbar-tools">
          {registry && <BodyToggle value={registry.model} pending={switching} onChange={onSwitchModel} />}
          <div className="lseg" role="group" aria-label="Text size">
            <Type size={14} aria-hidden />
            {(['s', 'm', 'l'] as const).map((s) => (
              <button key={s} className={`sz-${s} ${size === s ? 'on' : ''}`} onClick={() => setSize(s)} aria-pressed={size === s} aria-label={`Text size ${s === 's' ? 'small' : s === 'm' ? 'medium' : 'large'}`}>
                A
              </button>
            ))}
          </div>
          <button className="lbtn ghost icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Light reading theme' : 'Dark reading theme'} title="Reading theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>
      {topicId && !topic ? (
        <div className="lhub">
          <h1>Guide not found</h1>
          <button className="lbtn" onClick={() => openLearn(null)}>
            All guides
          </button>
        </div>
      ) : topic ? (
        <TopicView topic={topic} registry={registry} quality={quality} section={section} focusId={focusId} />
      ) : (
        <Hub registry={registry} />
      )}
    </div>
  );
}
