import { AlertTriangle, Eye, EyeOff, Loader2, RotateCcw, Target } from 'lucide-react';
import type { Registry } from '../data/registry';
import { DISSECTION_PRESETS, SYSTEMS } from '../data/systems';
import { useApp } from '../state/store';

export function LayersPanel({ registry }: { registry: Registry }) {
  const opacity = useApp((s) => s.opacity);
  const status = useApp((s) => s.systemStatus);
  const isolate = useApp((s) => s.isolate);
  const setOpacity = useApp((s) => s.setOpacity);
  const setOpacities = useApp((s) => s.setOpacities);
  const setIsolate = useApp((s) => s.setIsolate);
  const reset = useApp((s) => s.resetAppearance);
  const hidden = useApp((s) => s.hidden);
  const faded = useApp((s) => s.faded);
  const manifest = registry.manifest.systems;
  const overrides = hidden.size + faded.size + (isolate ? 1 : 0);

  return (
    <div className="layers">
      <div className="section-label">Dissect</div>
      <div className="presets" role="group" aria-label="Dissection presets">
        {DISSECTION_PRESETS.map((p) => (
          <button
            key={p.id}
            className={`preset ${Object.entries(p.opacity).every(([k, v]) => !manifest[k as keyof typeof manifest] || Math.abs((opacity[k as keyof typeof opacity] ?? 0) - (v ?? 0)) < 0.02) ? 'on' : ''}`}
            onClick={() => {
              setIsolate(null);
              setOpacities(p.opacity);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="section-label row">
        <span>Systems</span>
        <button className="link-btn sans" onClick={reset} title="Restore default layers, clear hidden/faded/isolated structures">
          <RotateCcw size={12} /> Restore
        </button>
      </div>
      <ul className="system-list">
        {SYSTEMS.filter((s) => manifest[s.id]).map((s) => {
          const o = opacity[s.id] ?? 0;
          const st = status[s.id] ?? 'idle';
          const isIso = isolate?.id === `sys:${s.id}`;
          const m = manifest[s.id]!;
          return (
            <li key={s.id} className={`system-row ${o === 0 ? 'off' : ''} ${isIso ? 'iso' : ''}`}>
              <div className="sr-top">
                <button className="icon-btn sm" aria-label={`${o > 0 ? 'Hide' : 'Show'} ${s.label} system`} aria-pressed={o > 0} onClick={() => setOpacity(s.id, o > 0 ? 0 : 1)}>
                  {o > 0 ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <span className="swatch" style={{ background: s.swatch }} aria-hidden />
                <span className="system-name">
                  {registry.get(`sys:${s.id}`)?.name.replace(/ system/, '') ?? s.label}
                  {st === 'loading' && <Loader2 className="spin" size={12} aria-label="Loading" />}
                  {st === 'error' && (
                    <span className="err" title="Failed to load. Toggle again to retry.">
                      <AlertTriangle size={12} />
                    </span>
                  )}
                </span>
                <span className="count mono" title={`${m.units} meshes · ${m.trisFull.toLocaleString()} triangles at full resolution`}>
                  {m.units}
                </span>
                <button
                  className={`icon-btn sm ${isIso ? 'on' : ''}`}
                  aria-label={isIso ? `Stop isolating ${s.label}` : `Isolate ${s.label}`}
                  aria-pressed={isIso}
                  title="Isolate (hide everything else)"
                  onClick={() => setIsolate(isIso ? null : { id: `sys:${s.id}`, mode: 'hide' })}
                >
                  <Target size={14} />
                </button>
              </div>
              <div className="sr-slider">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={o}
                  aria-label={`${s.label} opacity`}
                  onChange={(e) => setOpacity(s.id, Number(e.target.value))}
                  style={{ ['--v' as string]: `${o * 100}%`, ['--c' as string]: s.swatch }}
                />
                <span className="pct mono">{Math.round(o * 100)}%</span>
              </div>
            </li>
          );
        })}
      </ul>
      {overrides > 0 && (
        <p className="note">
          {hidden.size > 0 && `${hidden.size} hidden · `}
          {faded.size > 0 && `${faded.size} faded · `}
          {isolate && `isolating ${registry.get(isolate.id)?.name ?? ''}`}
        </p>
      )}
      <p className="note muted">
        {registry.model === 'male'
          ? 'Male: BodyParts3D, with spinal cord and peripheral nerves added from Z-Anatomy. Not shown: lymph vessels, lung surfaces, skin layers.'
          : 'Female: HRA Visible Human Female (organs, brain, spinal cord, pelvis, spine, leg bones, eyes, vessels) with peripheral nerves from Z-Anatomy. Skull, thoracic cage, shoulder girdle, arm bones, oesophagus, stomach and endocrine glands are adapted from the male model and fitted to this body. General musculature is not available yet.'}
      </p>
    </div>
  );
}
