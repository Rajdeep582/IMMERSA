import { Loader2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Registry } from '../data/registry';
import { viewer } from '../engine/viewer';
import { useApp } from '../state/store';
import { useStats } from '../state/stats';

export function HoverLabel({ registry }: { registry: Registry }) {
  const id = useApp((s) => s.hoveredId);
  const pos = useApp((s) => s.hoverPos);
  const selected = useApp((s) => s.selectedId);
  const rec = registry.get(id);
  // The selection already carries a pinned label; don't double it.
  if (!rec || !pos || id === selected) return null;
  return (
    <div className="hover-label" style={{ transform: `translate(${pos.x + 14}px, ${pos.y + 12}px)` }} aria-hidden>
      {rec.name}
      {registry.get(rec.parent) && registry.get(rec.parent)!.kind !== 'system' && <span className="muted"> · {registry.get(rec.parent)!.name}</span>}
    </div>
  );
}

export function HintToast() {
  const hint = useApp((s) => s.hint);
  const clear = useApp((s) => s.clearHint);
  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(clear, hint.action ? 9000 : 6000);
    return () => clearTimeout(t);
  }, [hint, clear]);
  if (!hint) return null;
  const run = () => {
    const st = useApp.getState();
    if (hint.action?.kind === 'ghost-others') st.setIsolate({ id: hint.action.target, mode: 'ghost' });
    if (hint.action?.kind === 'inspect') {
      st.select(hint.action.target);
      st.setInspectorOpen(true);
      st.setRightOpen(true);
    }
    clear();
  };
  return (
    <div className="hint" role="status" key={hint.id}>
      <span>{hint.text}</span>
      {hint.action && (
        <button className="chip gold" onClick={run}>
          {hint.action.label}
        </button>
      )}
      <button className="icon-btn xs ghost" onClick={clear} aria-label="Dismiss">
        <X size={13} />
      </button>
    </div>
  );
}

let everReady = false;

export function LoadingVeil() {
  const status = useApp((s) => s.systemStatus);
  // Full-screen veil only on the very first load; later model switches keep the scene interactive.
  const first = status.skeletal === 'ready' || status.integumentary === 'ready' || everReady;
  if (first) everReady = true;
  const loading = Object.entries(status).filter(([, v]) => v === 'loading').map(([k]) => k);
  const hiRes = useApp((s) => s.hiResRegion);
  return (
    <>
      <div className={`veil ${first ? 'gone' : ''}`} aria-hidden={first}>
        <div className="veil-inner">
          <Loader2 className="spin" size={18} />
          <span>Preparing anatomy…</span>
        </div>
      </div>
      {first && (loading.length > 0 || hiRes) && (
        <div className="lod-chip" role="status">
          {loading.length > 0 ? (
            <>
              <Loader2 className="spin" size={12} /> Loading {loading.join(', ')}
            </>
          ) : (
            <>
              <span className="dot" /> Full-resolution: {hiRes}
            </>
          )}
        </div>
      )}
    </>
  );
}

export function StatsOverlay() {
  const show = useApp((s) => s.showStats);
  const tier = useApp((s) => s.tier);
  const s = useStats();
  if (!show) return null;
  return (
    <div className="stats mono" aria-label="Render statistics">
      <div>
        {s.fps.toFixed(0)} fps · {s.frameMs.toFixed(1)} ms
      </div>
      <div>
        {s.calls} calls · {(s.triangles / 1000).toFixed(0)}k tris
      </div>
      <div>
        dpr {s.dpr.toFixed(2)} · tier {tier}
      </div>
      <div>
        {s.units} meshes · {s.geometries} geoms
      </div>
      <div>r {s.radius.toFixed(3)} m</div>
      <button className="link-btn" onClick={() => viewer.home()}>
        reset camera
      </button>
    </div>
  );
}

/** Floating label anchored to the selected structure; tracks it every rendered frame. */
export function SelectionPin({ registry }: { registry: Registry }) {
  const selectedId = useApp((s) => s.selectedId);
  const guided = useApp((s) => s.guided);
  const ref = useRef<HTMLDivElement>(null);
  const rec = registry.get(selectedId);
  useEffect(() => {
    if (!rec || rec.kind === 'system') return;
    const id = rec.id;
    const c = new THREE.Vector3();
    let frame = 0;
    const fn = (cam: THREE.PerspectiveCamera) => {
      const el = ref.current;
      if (!el) return;
      if (frame++ % 8 === 0) {
        const b = viewer.scene?.liveBounds(id);
        if (b && !b.isEmpty()) {
          b.getCenter(c);
          c.y = b.max.y - (b.max.y - b.min.y) * 0.15;
        } else c.set(...registry.center(id));
      }
      const p = c.clone().project(cam);
      const parent = el.parentElement;
      const w = parent?.clientWidth ?? window.innerWidth;
      const h = parent?.clientHeight ?? window.innerHeight;
      const visible = p.z < 1 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05;
      el.classList.toggle('hidden-pin', !visible);
      el.style.transform = `translate(${((p.x + 1) / 2) * w}px, ${((1 - p.y) / 2) * h}px)`;
    };
    viewer.frameListeners.add(fn);
    viewer.invalidate();
    return () => {
      viewer.frameListeners.delete(fn);
    };
  }, [rec, registry]);
  if (!rec || rec.kind === 'system' || guided) return null;
  const parent = registry.get(rec.parent);
  return (
    <div className="pin hidden-pin" ref={ref}>
      <span className="pin-dot" />
      <span className="pin-line" />
      <button className="pin-label" onClick={() => viewer.focus(rec.id)} title="Fly to this structure">
        {rec.name}
        {parent && parent.kind !== 'system' && <span className="muted">{parent.name}</span>}
      </button>
    </div>
  );
}
