import { Activity, Box, Crosshair, Droplet, Eye, EyeOff, FlipHorizontal2, Info, Layers2, Layers3, MapPin, MessageCircleQuestion, Shrink, Star, Stethoscope, Target, X, Zap } from 'lucide-react';
import { openMurphy } from '../murphy/open';
import { useMemo } from 'react';
import { BODYPARTS3D, HRA, fmaRef, ontRef } from '../data/references';
import type { Registry } from '../data/registry';
import { SYSTEM_BY_ID } from '../data/systems';
import type { StructureRecord } from '../data/types';
import { viewer } from '../engine/viewer';
import type { QualityProfile } from '../engine/quality';
import { InspectViewport } from '../scene/InspectViewport';
import { Breadcrumbs } from './Breadcrumbs';
import { SliceControl } from './SliceControl';
import { useApp } from '../state/store';
import { SYSTEM_TOPICS, studyFor, type Study } from '../learn';
import { Rich } from '../learn/Rich';
import { openLearn, useRoute } from '../learn/route';
import { StudyModeButton } from './StudyMode';

function Chips({ items, max = 18 }: { items: StructureRecord[]; max?: number }) {
  if (!items.length) return null;
  return (
    <div className="chips">
      {items.slice(0, max).map((c) => (
        <button key={c.id} className="chip link" onClick={() => viewer.selectAndFocus(c.id)} title={c.name}>
          <span className="swatch xs" style={{ background: SYSTEM_BY_ID[c.system].swatch }} />
          {c.name}
        </button>
      ))}
      {items.length > max && <span className="muted small">+{items.length - max} more in Explore</span>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const STUDY_SECTIONS: { key: 'location' | 'structure' | 'functions' | 'clinical' | 'key'; label: string; Icon: typeof MapPin; numbered?: boolean }[] = [
  { key: 'location', label: 'Location', Icon: MapPin },
  { key: 'structure', label: 'Structure', Icon: Layers3 },
  { key: 'functions', label: 'Function', Icon: Activity, numbered: true },
  { key: 'clinical', label: 'Clinical significance', Icon: Stethoscope },
  { key: 'key', label: 'Key points', Icon: Star },
];

/** Structured study card: what it is → location → structure → function → clinical → key points. */
function StudyCard({ study, registry }: { study: Study; registry: Registry }) {
  const link = (id: string) => viewer.selectAndFocus(id);
  const present = STUDY_SECTIONS.filter((x) => (study[x.key]?.length ?? 0) > 0);
  const jump = (k: string) => document.getElementById(`sc-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <section className={`study ${study.source}`}>
      <p className="study-what">
        <Rich text={study.what} registry={registry} onLink={link} />
      </p>
      {present.length > 1 && (
        <nav className="study-nav" aria-label="Study card sections">
          {present.map((x) => (
            <button key={x.key} onClick={() => jump(x.key)}>
              {x.label}
            </button>
          ))}
        </nav>
      )}
      {present.map(({ key, label, Icon, numbered }) => {
        const items = study[key]!;
        const L = numbered && items.length > 1 ? 'ol' : 'ul';
        return (
          <div key={key} id={`sc-${key}`} className={`study-sec k-${key}`}>
            <h3>
              <Icon size={14} aria-hidden /> {label}
            </h3>
            <L>
              {items.map((t, i) => (
                <li key={i}>
                  <Rich text={t} registry={registry} onLink={link} />
                </li>
              ))}
            </L>
          </div>
        );
      })}
      {(study.innervation || study.blood) && (
        <dl className="study-facts">
          {study.innervation && (
            <div>
              <dt>
                <Zap size={13} /> Nerve supply
              </dt>
              <dd>
                <Rich text={study.innervation} registry={registry} onLink={link} />
              </dd>
            </div>
          )}
          {study.blood && (
            <div>
              <dt>
                <Droplet size={13} /> Blood supply
              </dt>
              <dd>
                <Rich text={study.blood} registry={registry} onLink={link} />
              </dd>
            </div>
          )}
        </dl>
      )}
      {study.source === 'derived' && (
        <p className="study-note">
          <Info size={13} /> No dedicated card yet: location and contents come from the model hierarchy{study.from ? `; function and clinical notes are those of the ${study.from.toLowerCase()}` : ''}.
        </p>
      )}
    </section>
  );
}

export function InspectorPanel({ registry, quality, onClose }: { registry: Registry; quality: QualityProfile; onClose?: () => void }) {
  const selectedId = useApp((s) => s.selectedId);
  const inspectorOpen = useApp((s) => s.inspectorOpen);
  const setInspectorOpen = useApp((s) => s.setInspectorOpen);
  const isolate = useApp((s) => s.isolate);
  const setIsolate = useApp((s) => s.setIsolate);
  const hidden = useApp((s) => s.hidden);
  const faded = useApp((s) => s.faded);
  const toggleHidden = useApp((s) => s.toggleHidden);
  const toggleFaded = useApp((s) => s.toggleFaded);
  const rec = registry.get(selectedId);
  const learning = useRoute().view === 'learn';

  const info = useMemo(() => {
    if (!rec) return null;
    const children = rec.children.map((c) => registry.get(c)!).filter(Boolean);
    const neighbours = rec.kind === 'system' ? [] : registry.spatialNeighbours(rec.id, rec.kind === 'structure' ? 0.004 : 0.002, 10);
    const counterpart = registry.counterpart(rec.id);
    const units = registry.unitsUnder(rec.id);
    let lo = 0;
    let hi = 0;
    for (const u of units) {
      lo += registry.manifest.units[u]?.lo ?? 0;
      hi += registry.manifest.units[u]?.hi ?? 0;
    }
    return { children, neighbours, counterpart, units, lo, hi, study: studyFor(registry, rec), parent: registry.get(rec.parent) };
  }, [rec, registry]);

  if (!rec || !info) {
    const picks = (registry.model === 'female'
      ? ['Uterus', 'Left ovary', 'Left mammary gland', 'Brain', 'Lungs', 'Spinal cord', 'Lumbar vertebra 1', 'Heart']
      : ['Heart', 'First lumbar vertebra', 'Skull', 'Left femur', 'Stomach', 'Right biceps brachii', 'Brain', 'Left kidney']
    )
      .map((n) => [...registry.structures.values()].find((x) => x.name === n))
      .filter((x): x is StructureRecord => !!x);
    const meshes = registry.unitStructure.size;
    return (
      <div className="inspector empty-state">
        <StudyModeButton registry={registry} />
        <div className="es-head">
          <div className="empty-icon">
            <Crosshair size={20} />
          </div>
          <div>
            <div className="es-title">Explore the {registry.model} body</div>
            <div className="muted small">
              {meshes.toLocaleString()} selectable meshes · {registry.systems.length} systems
            </div>
          </div>
        </div>
        <p className="es-lead">Click any structure in the body, pick one from the hierarchy, or search by name.</p>
        <SliceControl registry={registry} variant="in-panel" />
        <h3 className="es-h">Start with</h3>
        <Chips items={picks} max={8} />
        <h3 className="es-h">Study guides</h3>
        <div className="chips">
          {SYSTEM_TOPICS.map((t) => (
            <button key={t.id} className="chip link" onClick={() => openLearn(t.id)}>
              <span className="swatch xs" style={{ background: SYSTEM_BY_ID[t.system].swatch }} />
              {t.title}
            </button>
          ))}
        </div>
        <h3 className="es-h">Controls</h3>
        <dl className="keys">
          <dt>Drag</dt>
          <dd>Rotate (pan with the hand tool)</dd>
          <dt>Scroll / pinch</dt>
          <dd>Zoom toward the pointer</dd>
          <dt>Right-drag / 2 fingers</dt>
          <dd>Pan</dd>
          <dt>Click</dt>
          <dd>Select · again to go deeper</dd>
          <dt>Double-click</dt>
          <dd>Fly to structure</dd>
          <dt>Empty space</dt>
          <dd>Model-only view</dd>
          <dt>
            <kbd className="kbd">1</kbd>–<kbd className="kbd">6</kbd>
          </dt>
          <dd>Standard views</dd>
          <dt>
            <kbd className="kbd">H</kbd> <kbd className="kbd">F</kbd> <kbd className="kbd">/</kbd>
          </dt>
          <dd>Home · focus · search</dd>
        </dl>
        <p className="disclaimer">Educational visualization. Not a diagnostic or clinical tool.</p>
      </div>
    );
  }

  const sys = SYSTEM_BY_ID[rec.system];
  const isIso = isolate?.id === rec.id;
  const isHidden = hidden.has(rec.id);
  const isFaded = faded.has(rec.id);
  const isBone = rec.system === 'skeletal' && rec.kind === 'structure' && !/cartilage|disk|ligament|membrane|tooth/i.test(rec.name);
  const st = info.study;

  return (
    <div className="inspector">
      <header className="insp-head">
        <Breadcrumbs registry={registry} variant="panel" />
        <div className="insp-kicker">
          <span className="swatch sm" style={{ background: sys.swatch }} />
          {sys.label}
          {rec.kind !== 'structure' && <span className="tag">{rec.kind === 'system' ? 'System' : 'Group'} · {rec.unitCount} meshes</span>}
          {rec.side && <span className="tag">{rec.side === 'L' ? 'Left' : 'Right'}</span>}
          {rec.landmark && <span className="tag gold">Landmark surface</span>}
          {rec.zaMuscle && <span className="tag" title="Muscle mesh from Z-Anatomy (CC BY-SA 4.0), fitted to this body">Z-Anatomy</span>}
          {rec.adapted && <span className="tag" title="Not present in the female source data: mesh from the male model (BodyParts3D), fitted to this body">Adapted from male model</span>}
          {onClose && (
            <button className="icon-btn xs ghost push" onClick={onClose} aria-label="Close details">
              <X size={14} />
            </button>
          )}
        </div>
        <h2>{rec.name}</h2>
        {rec.synonyms && rec.synonyms.length > 0 && <div className="synonyms">{rec.synonyms.slice(0, 4).join(' · ')}</div>}
      </header>

      <div className="sm-cta-wrap">
        <StudyModeButton registry={registry} />
      </div>

      <div className="insp-actions" role="toolbar" aria-label="Structure actions">
        <button className="act" onClick={() => viewer.focus(rec.id)} title="Fly to (F)">
          <Crosshair size={15} />
          <span>Focus</span>
        </button>
        <button className={`act ${inspectorOpen ? 'on' : ''}`} onClick={() => setInspectorOpen(!inspectorOpen)} aria-pressed={inspectorOpen} title="Independent 3D inspection view (I)">
          <Box size={15} />
          <span>Inspect</span>
        </button>
        <button className={`act ${isIso && isolate?.mode === 'hide' ? 'on' : ''}`} onClick={() => setIsolate(isIso && isolate?.mode === 'hide' ? null : { id: rec.id, mode: 'hide' })} title="Show only this">
          <Target size={15} />
          <span>Isolate</span>
        </button>
        <button className={`act ${isIso && isolate?.mode === 'ghost' ? 'on' : ''}`} onClick={() => setIsolate(isIso && isolate?.mode === 'ghost' ? null : { id: rec.id, mode: 'ghost' })} title="Fade everything else for context">
          <Layers2 size={15} />
          <span>Ghost others</span>
        </button>
        <button className={`act ${isFaded ? 'on' : ''}`} onClick={() => toggleFaded(rec.id)} title="Make this translucent to see behind it">
          <Shrink size={15} />
          <span>Fade</span>
        </button>
        <button className={`act ${isHidden ? 'on' : ''}`} onClick={() => toggleHidden(rec.id)} title="Hide to reveal deeper structures">
          {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
          <span>{isHidden ? 'Hidden' : 'Hide'}</span>
        </button>
        <button className="act murphy" onClick={() => openMurphy()} title="Ask Doctor Murphy about this structure">
          <MessageCircleQuestion size={15} />
          <span>Ask AI</span>
        </button>
        {info.counterpart && (
          <button className="act" onClick={() => viewer.selectAndFocus(info.counterpart!.id)} title={info.counterpart.name}>
            <FlipHorizontal2 size={15} />
            <span>Other side</span>
          </button>
        )}
      </div>

      <SliceControl registry={registry} variant="in-panel" />

      {inspectorOpen && (
        <div className="insp-3d">
          <div className="insp-3d-h">
            <span>Isolated 3D view</span>
            <button className="xlink" onClick={() => setInspectorOpen(false)}>
              Hide
            </button>
          </div>
          {learning ? <div className="inspect" /> : <InspectViewport registry={registry} targetId={rec.id} quality={quality} />}
        </div>
      )}

      <div className="insp-body">
        <StudyCard study={st} registry={registry} />

        <dl className="facts">
          {rec.fma && (
            <Field label="FMA ID">
              <a href={fmaRef(rec.fma).url} target="_blank" rel="noreferrer" className="mono">
                {rec.fma.replace('FMA', 'FMA:')}
              </a>
            </Field>
          )}
          {info.parent && (
            <Field label="Part of">
              <button className="link-btn" onClick={() => viewer.selectAndFocus(info.parent!.id)}>
                {info.parent.name}
              </button>
            </Field>
          )}
          {rec.ont && (
            <Field label="Ontology">
              <a href={ontRef(rec.ont).url} target="_blank" rel="noreferrer" className="mono">
                {rec.ont}
              </a>
            </Field>
          )}
          {isBone && registry.model === 'male' && <Field label="Landmarks">Bony landmarks (processes, foramina, facets) are not segmented in the source meshes and are therefore not labelled in 3D.</Field>}
          <Field label="Geometry">
            <span className="mono">{info.units.length}</span> mesh{info.units.length === 1 ? '' : 'es'} · body view <span className="mono">{info.lo.toLocaleString()}</span> tris · full{' '}
            <span className="mono">{info.hi.toLocaleString()}</span> tris
          </Field>
        </dl>

        {info.children.length > 0 && (
          <section>
            <h3>Contains</h3>
            <Chips items={info.children} />
          </section>
        )}
        {info.neighbours.length > 0 && (
          <section>
            <h3>
              Adjacent in model <span className="muted small">(computed from bounds)</span>
            </h3>
            <Chips items={info.neighbours} max={10} />
          </section>
        )}

        <section className="refs">
          <h3>References</h3>
          <ul>
            {st.refs.map((r) => (
              <li key={r.label}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.label}
                </a>
              </li>
            ))}
            {rec.fma && (
              <li>
                <a href={fmaRef(rec.fma).url} target="_blank" rel="noreferrer">
                  {fmaRef(rec.fma).label}
                </a>
              </li>
            )}
            {rec.ont && (
              <li>
                <a href={ontRef(rec.ont).url} target="_blank" rel="noreferrer">
                  {ontRef(rec.ont).label}
                </a>
              </li>
            )}
            <li>
              <a href={(registry.model === 'female' ? HRA : BODYPARTS3D).url} target="_blank" rel="noreferrer">
                Geometry: {(registry.model === 'female' ? HRA : BODYPARTS3D).label}
              </a>
            </li>
          </ul>
        </section>
        <p className="disclaimer">Educational visualization. Not a diagnostic or clinical tool.</p>
      </div>
    </div>
  );
}
