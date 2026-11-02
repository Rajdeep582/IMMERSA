import { Activity, ArrowLeft, BookOpen, Brain, ChevronRight, Droplet, GraduationCap, Layers3, Lightbulb, MapPin, MessageCircleQuestion, Network, Sparkles, Star, Stethoscope, Zap } from 'lucide-react';
import { useMemo } from 'react';
import type { Registry } from '../data/registry';
import { SYSTEM_BY_ID } from '../data/systems';
import type { StructureRecord } from '../data/types';
import { viewer } from '../engine/viewer';
import { SYSTEM_TOPICS, TOPIC_BY_ID, studyFor } from '../learn';
import { Rich } from '../learn/Rich';
import { openLearn } from '../learn/route';
import { openMurphy } from '../murphy/open';
import { useApp } from '../state/store';

/**
 * Study mode: with nothing selected → the Learn home page; with a structure selected → the study guide
 * of its topic, opened on that structure (falls back to its body system's guide).
 */
function openStudy(registry: Registry, rec: StructureRecord | undefined) {
  if (!rec || rec.kind === 'system') {
    openLearn(rec ? SYSTEM_TOPICS.find((t) => t.system === rec.system)?.id ?? null : null);
    return;
  }
  const topic = studyFor(registry, rec).topic ?? SYSTEM_TOPICS.find((t) => t.system === rec.system)?.id ?? null;
  openLearn(topic, undefined, rec.id);
}

/** Big entry button at the top of the right panel. */
export function StudyModeButton({ registry }: { registry: Registry }) {
  const selectedId = useApp((s) => s.selectedId);
  const rec = registry.get(selectedId);
  return (
    <button className="sm-cta" onClick={() => openStudy(registry, rec)}>
      <span className="sm-cta-ic">
        <GraduationCap size={22} />
      </span>
      <span className="sm-cta-txt">
        <strong>Study mode</strong>
        <small>{rec && rec.kind !== 'system' ? `Study guide · ${rec.name}` : 'Open the study guides'}</small>
      </span>
      <ChevronRight size={18} />
    </button>
  );
}

function Section({ icon: Icon, title, tone, children }: { icon: typeof MapPin; title: string; tone: string; children: React.ReactNode }) {
  return (
    <section className={`sm-sec tone-${tone}`}>
      <h3>
        <span className="sm-sec-ic">
          <Icon size={15} />
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function ChipRow({ items }: { items: StructureRecord[] }) {
  return (
    <div className="sm-chips">
      {items.map((c) => (
        <button key={c.id} onClick={() => viewer.selectAndFocus(c.id)} title={c.name}>
          <i style={{ background: SYSTEM_BY_ID[c.system].swatch }} />
          {c.name}
        </button>
      ))}
    </div>
  );
}

/** Full study view of the selected structure (or a system overview when nothing is selected). */
export function StudyMode({ registry }: { registry: Registry }) {
  const selectedId = useApp((s) => s.selectedId);
  const rec = registry.get(selectedId);
  const close = () => useApp.getState().setStudyMode(false);
  const link = (id: string) => viewer.selectAndFocus(id);

  const data = useMemo(() => {
    if (!rec || rec.kind === 'system') return null;
    return {
      study: studyFor(registry, rec),
      path: registry.path(rec.id).slice(0, -1),
      children: rec.children.map((c) => registry.get(c)!).filter(Boolean).slice(0, 14),
      neighbours: registry.spatialNeighbours(rec.id, rec.kind === 'structure' ? 0.004 : 0.002, 8),
    };
  }, [rec, registry]);

  if (!rec || !data) {
    return (
      <div className="smv">
        <header className="sm-top">
          <button className="sm-back" onClick={close} aria-label="Exit study mode">
            <ArrowLeft size={16} /> Exit study mode
          </button>
        </header>
        <div className="sm-hero overview">
          <div className="sm-hero-ic">
            <GraduationCap size={26} />
          </div>
          <h2>Study mode</h2>
          <p>Tap any structure in the body to open its notes: location, structure, function, nerve and blood supply, clinical significance and high-yield exam points. Or start with a system:</p>
        </div>
        <div className="sm-systems">
          {SYSTEM_TOPICS.map((t) => (
            <button key={t.id} className="sm-sys" style={{ ['--c' as string]: SYSTEM_BY_ID[t.system].swatch }} onClick={() => openLearn(t.id)}>
              <span className="sm-sys-bar" />
              <span className="sm-sys-t">
                <strong>{t.title}</strong>
                <small>{t.tagline}</small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const { study } = data;
  const sys = SYSTEM_BY_ID[rec.system];
  const topic = study.topic ? TOPIC_BY_ID.get(study.topic) : undefined;
  const lower = rec.name.toLowerCase();
  const asks: [string, string][] = [
    ['Clinical case', `Give me a short clinical case involving the ${lower} and explain the reasoning.`],
    ['Viva questions', `Ask me 3 viva questions on the ${lower}, then give the model answers.`],
    ['Memory trick', `Give me a mnemonic or memory trick for the ${lower}.`],
    ['Applied anatomy', `What is the applied anatomy of the ${lower}?`],
  ];
  const facts: { icon: typeof MapPin; label: string; value: React.ReactNode }[] = [];
  if (study.innervation) facts.push({ icon: Zap, label: 'Nerve supply', value: <Rich text={study.innervation} registry={registry} onLink={link} /> });
  if (study.blood) facts.push({ icon: Droplet, label: 'Blood supply', value: <Rich text={study.blood} registry={registry} onLink={link} /> });
  if (rec.side) facts.push({ icon: MapPin, label: 'Side', value: rec.side === 'L' ? 'Left' : 'Right' });
  facts.push({ icon: Layers3, label: 'System', value: sys.label });

  return (
    <div className="smv" style={{ ['--c' as string]: sys.swatch }}>
      <header className="sm-top">
        <button className="sm-back" onClick={close} aria-label="Exit study mode">
          <ArrowLeft size={16} /> Exit study mode
        </button>
        <button className="sm-focus" onClick={() => viewer.focus(rec.id)}>
          Show in 3D
        </button>
      </header>

      <div className="sm-hero">
        <div className="sm-path">
          {data.path.map((p, i) => (
            <span key={p.id}>
              {i > 0 && <ChevronRight size={11} />}
              <button onClick={() => link(p.id)}>{p.name}</button>
            </span>
          ))}
        </div>
        <h2>{rec.name}</h2>
        {rec.synonyms && rec.synonyms.length > 0 && <div className="sm-syn">{rec.synonyms.slice(0, 3).join(' · ')}</div>}
        <p className="sm-what">
          <Rich text={study.what} registry={registry} onLink={link} />
        </p>
      </div>

      <div className="sm-facts">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="sm-fact">
            <span className="sm-fact-l">
              <Icon size={13} /> {label}
            </span>
            <span className="sm-fact-v">{value}</span>
          </div>
        ))}
      </div>

      {!!study.location?.length && (
        <Section icon={MapPin} title="Location" tone="loc">
          <ul className="sm-list">
            {study.location.map((t, i) => (
              <li key={i}>
                <Rich text={t} registry={registry} onLink={link} />
              </li>
            ))}
          </ul>
        </Section>
      )}
      {!!study.structure?.length && (
        <Section icon={Layers3} title="Structure" tone="str">
          <ul className="sm-list">
            {study.structure.map((t, i) => (
              <li key={i}>
                <Rich text={t} registry={registry} onLink={link} />
              </li>
            ))}
          </ul>
        </Section>
      )}
      {!!study.functions?.length && (
        <Section icon={Activity} title="Function" tone="fn">
          <ol className="sm-steps">
            {study.functions.map((t, i) => (
              <li key={i}>
                <span className="sm-step-n">{i + 1}</span>
                <span>
                  <Rich text={t} registry={registry} onLink={link} />
                </span>
              </li>
            ))}
          </ol>
        </Section>
      )}
      {!!study.clinical?.length && (
        <Section icon={Stethoscope} title="Clinical significance" tone="clin">
          <div className="sm-clin">
            {study.clinical.map((t, i) => (
              <div key={i} className="sm-clin-card">
                <Rich text={t} registry={registry} onLink={link} />
              </div>
            ))}
          </div>
        </Section>
      )}
      {!!study.key?.length && (
        <Section icon={Star} title="High-yield exam points" tone="key">
          <ul className="sm-key">
            {study.key.map((t, i) => (
              <li key={i}>
                <Lightbulb size={14} />
                <span>
                  <Rich text={t} registry={registry} onLink={link} />
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {(data.children.length > 0 || data.neighbours.length > 0) && (
        <Section icon={Network} title="Parts & relations" tone="rel">
          {data.children.length > 0 && (
            <>
              <div className="sm-sub">Contains</div>
              <ChipRow items={data.children} />
            </>
          )}
          {data.neighbours.length > 0 && (
            <>
              <div className="sm-sub">Next to it in the model</div>
              <ChipRow items={data.neighbours} />
            </>
          )}
        </Section>
      )}

      <Section icon={Sparkles} title="Go deeper with Dr. Murphy" tone="ai">
        <div className="sm-asks">
          {asks.map(([label, q]) => (
            <button key={label} onClick={() => openMurphy(q)}>
              <MessageCircleQuestion size={14} /> {label}
            </button>
          ))}
        </div>
      </Section>

      {topic && (
        <button className="sm-guide" onClick={() => openLearn(topic.id, undefined, rec.id)}>
          <BookOpen size={18} />
          <span>
            <small>Full study guide</small>
            {topic.title}
          </span>
          <ChevronRight size={16} />
        </button>
      )}

      {study.source === 'derived' && (
        <p className="sm-note">
          <Brain size={13} /> No dedicated notes for this part yet{study.from ? `; function and clinical notes are those of the ${study.from.toLowerCase()}` : ''}.
        </p>
      )}
      <div className="sm-refs">
        {study.refs.slice(0, 4).map((r) => (
          <a key={r.label} href={r.url} target="_blank" rel="noreferrer">
            {r.label}
          </a>
        ))}
      </div>
      <p className="disclaimer">Educational content for medical students. Not medical advice.</p>
    </div>
  );
}
