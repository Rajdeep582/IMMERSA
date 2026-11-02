import { Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Registry } from '../data/registry';
import { viewer } from '../engine/viewer';
import { useApp } from '../state/store';
import { useStats } from '../state/stats';
import { SYSTEMS } from '../data/systems';

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
let warmStarted = false;

declare global {
  interface Window {
    /** Anatomy intro screen (index.html): progress + dismissal. */
    __intro?: { progress: (f: number, label?: string) => void; done: () => void } | null;
  }
}

const STAGE: Partial<Record<string, string>> = {
  integumentary: 'Shaping the body surface',
  skeletal: 'Assembling the skeleton',
  nervous: 'Wiring the nervous system',
  digestive: 'Placing the organs',
  respiratory: 'Inflating the lungs',
  cardiovascular: 'Perfusing the vessels',
  muscular: 'Layering the muscles',
};

export function LoadingVeil() {
  const status = useApp((s) => s.systemStatus);
  // Intro only on the very first load; later model switches keep the scene interactive.
  const loading = Object.entries(status).filter(([, v]) => v === 'loading').map(([k]) => k);
  // The intro stays until every start-up system has arrived, so the first view is complete.
  const eagerIds = SYSTEMS.filter((m) => m.eager).map((m) => m.id);
  const settled = eagerIds.filter((id) => status[id] === 'ready' || status[id] === 'error').length;
  const batchPending = useApp((s) => s.batchPending);
  // ...and until the merged draw batches exist, so the first interaction is already at full speed.
  const first = everReady || (status.skeletal === 'ready' && settled >= eagerIds.length && batchPending === 0);
  if (first) everReady = true;
  const hiRes = useApp((s) => s.hiResRegion);
  useEffect(() => {
    const intro = window.__intro;
    if (!intro) {
      if (first) useApp.setState({ introActive: false });
      return;
    }
    if (first) {
      if (warmStarted) return;
      warmStarted = true;
      // Upload the finished scene to the GPU behind the intro, then lift it.
      intro.progress(0.995, 'Preparing the 3D view');
      (viewer.warmUpload?.() ?? Promise.resolve())
        .catch(() => undefined)
        .then(() => {
          window.__intro?.done();
          useApp.setState({ introActive: false });
        });
      return;
    }
    const f = 0.06 + 0.9 * Math.min(1, (settled + 0.25 * loading.length) / eagerIds.length);
    if (settled >= eagerIds.length) intro.progress(Math.min(0.99, 0.96 + 0.03 / (1 + batchPending)), 'Optimising for your device');
    else intro.progress(f, loading.length ? (STAGE[loading[0]!] ?? 'Loading anatomy') : 'Loading anatomy data');
  }, [first, status, loading.length, settled, eagerIds.length, batchPending]);
  useEffect(() => {
    // Never leave the intro up if something stalls.
    const t = window.setTimeout(() => {
      window.__intro?.done();
      useApp.setState({ introActive: false });
    }, 45000);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
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

/** Notice over the female model: the free source data is partial; a complete female body is planned. */
export function FemaleNotice() {
  const female = useApp((s) => s.bodyModel === 'female');
  const guided = useApp((s) => s.guided);
  const [hidden, setHidden] = useState(false);
  if (!female || guided || hidden) return null;
  return (
    <div className="female-note" role="note">
      <span className="fn-badge">Female model · partial</span>
      <span className="fn-text">No free or affordable complete female anatomy model is available yet, so some parts (arm bones, nerves, muscles) are missing. A complete female body is coming in a future update.</span>
      <button className="icon-btn xs ghost" onClick={() => setHidden(true)} aria-label="Dismiss note">
        <X size={13} />
      </button>
    </div>
  );
}
