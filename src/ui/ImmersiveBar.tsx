import { Info, PanelsTopLeft } from 'lucide-react';
import type { Registry } from '../data/registry';
import { SYSTEM_BY_ID } from '../data/systems';
import { useApp } from '../state/store';

/** Single info line shown in model-only view. */
export function ImmersiveBar({ registry }: { registry: Registry }) {
  const immersive = useApp((s) => s.immersive);
  const selectedId = useApp((s) => s.selectedId);
  const setImmersive = useApp((s) => s.setImmersive);
  if (!immersive) return null;
  const rec = registry.get(selectedId);
  const parent = registry.get(rec?.parent);
  return (
    <div className="immersive-bar" role="status">
      <span className="ib-model">{registry.model === 'female' ? 'Female' : 'Male'}</span>
      <span className="ib-sep" />
      {rec ? (
        <span className="ib-main">
          <span className="swatch sm" style={{ background: SYSTEM_BY_ID[rec.system].swatch }} />
          <b>{rec.name}</b>
          {parent && parent.kind !== 'system' && <span className="muted"> · {parent.name}</span>}
        </span>
      ) : (
        <span className="ib-main muted">Tap a structure · empty space shows panels</span>
      )}
      {rec && (
        <button
          className="ib-btn"
          onClick={() => {
            const st = useApp.getState();
            st.setImmersive(false);
            st.setRightOpen(true);
          }}
          title="Show details"
        >
          <Info size={14} /> Details
        </button>
      )}
      <button className="ib-btn" onClick={() => setImmersive(false)} title="Show panels (Esc)">
        <PanelsTopLeft size={14} /> Panels
      </button>
    </div>
  );
}
