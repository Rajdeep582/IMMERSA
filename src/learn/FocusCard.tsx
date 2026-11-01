import { Activity, Box, Droplet, Layers3, MapPin, Star, Stethoscope, Zap } from 'lucide-react';
import { useMemo } from 'react';
import type { Registry } from '../data/registry';
import { SYSTEM_BY_ID } from '../data/systems';
import type { StructureRecord } from '../data/types';
import type { QualityProfile } from '../engine/quality';
import { InspectViewport } from '../scene/InspectViewport';
import { studyFor, topicFor } from './index';
import { Rich } from './Rich';

const SECS = [
  { key: 'location', label: 'Location', Icon: MapPin },
  { key: 'structure', label: 'Structure', Icon: Layers3 },
  { key: 'functions', label: 'Function', Icon: Activity },
  { key: 'clinical', label: 'Clinical', Icon: Stethoscope },
  { key: 'key', label: 'Remember', Icon: Star },
] as const;

/**
 * The structure a guide was opened for: its own isolated 3D view (exactly that node, never the
 * guide's whole system) plus its study card, shown above the guide.
 */
export function FocusCard({ rec, registry, quality, onBack, onLink, topicId }: { rec: StructureRecord; registry: Registry; quality: QualityProfile; onBack: () => void; onLink: (id: string) => void; topicId: string }) {
  const study = useMemo(() => studyFor(registry, rec), [registry, rec]);
  const chain = useMemo(
    () =>
      registry
        .ancestorIds(rec.id)
        .slice(0, -1)
        .map((id) => registry.get(id)!)
        .filter((r) => r && r.kind !== 'system'),
    [registry, rec],
  );
  const related = topicFor(registry, rec)?.id === topicId;
  const sys = SYSTEM_BY_ID[rec.system];
  return (
    <section className="lfocus" style={{ ['--sys' as string]: sys.swatch }} aria-label={`${rec.name} — selected structure`}>
      <header className="lfocus-head">
        <div className="lfocus-kicker">
          <span className="lsys-dot" /> Selected in 3D
          {rec.side && <span className="lfocus-tag">{rec.side === 'L' ? 'Left' : 'Right'}</span>}
          {rec.kind !== 'structure' && <span className="lfocus-tag">{rec.unitCount} parts</span>}
        </div>
        <h2>{rec.name}</h2>
        {chain.length > 0 && (
          <div className="lfocus-chain">
            {chain.map((c, i) => (
              <span key={c.id}>
                {i > 0 && ' › '}
                <button className="xlink" onClick={() => onLink(c.id)}>
                  {c.name}
                </button>
              </span>
            ))}
          </div>
        )}
      </header>
      <div className="lfocus-grid">
        <div className="lfocus-view">
          <InspectViewport registry={registry} targetId={rec.id} quality={quality} />
        </div>
        <div className="lfocus-study">
          <p className="lfocus-what">
            <Rich text={study.what} registry={registry} onLink={onLink} />
          </p>
          {SECS.filter((s) => (study[s.key]?.length ?? 0) > 0).map(({ key, label, Icon }) => (
            <div key={key} className={`lfocus-sec k-${key}`}>
              <h3>
                <Icon size={14} aria-hidden /> {label}
              </h3>
              <ul>
                {study[key]!.map((t, i) => (
                  <li key={i}>
                    <Rich text={t} registry={registry} onLink={onLink} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {(study.innervation || study.blood) && (
            <dl className="lfocus-supply">
              {study.innervation && (
                <div>
                  <dt>
                    <Zap size={13} /> Nerve supply
                  </dt>
                  <dd>
                    <Rich text={study.innervation} registry={registry} onLink={onLink} />
                  </dd>
                </div>
              )}
              {study.blood && (
                <div>
                  <dt>
                    <Droplet size={13} /> Blood supply
                  </dt>
                  <dd>
                    <Rich text={study.blood} registry={registry} onLink={onLink} />
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>
      <footer className="lfocus-foot">
        <button className="lbtn primary" onClick={onBack}>
          <Box size={15} /> Back to {rec.name} in 3D
        </button>
        <span className="lfocus-note">{related ? 'The guide below explains the system this structure belongs to.' : 'Guide below is a related topic.'}</span>
      </footer>
    </section>
  );
}
