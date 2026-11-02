import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid2x2, Hand, Layers2, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Registry } from '../data/registry';
import { defaultOpacities, type SystemOpacity } from '../data/systems';
import type { SystemId } from '../data/types';
import { AnatomyScene } from '../engine/anatomyScene';
import { CameraRig, STANDARD_VIEWS, poseForBox } from '../engine/cameraRig';
import { libraryFor } from '../engine/models';
import type { QualityProfile } from '../engine/quality';
import { RigInput } from '../engine/rigInput';
import { viewer } from '../engine/viewer';
import { useApp } from '../state/store';

/** Above this many meshes the inspector keeps body-view LOD (whole systems would be too heavy). */
const HI_RES_UNIT_LIMIT = 90;

export type DetailState = { kind: 'lo' | 'loading' | 'hi' | 'lo-only'; tris: number };

interface DriverProps {
  registry: Registry;
  targetId: string;
  quality: QualityProfile;
  context: boolean;
  wireframe: boolean;
  viewCmd: { id: string; n: number };
  onDetail: (d: DetailState) => void;
  panRef: React.MutableRefObject<boolean>;
  gateRef: React.MutableRefObject<(e: WheelEvent) => boolean>;
}

function allOpaque(): SystemOpacity {
  const o = defaultOpacities();
  for (const k of Object.keys(o) as SystemId[]) o[k] = 1;
  return o;
}

function InspectDriver({ registry, targetId, quality, context, wireframe, viewCmd, onDetail, panRef, gateRef }: DriverProps) {
  const { gl, camera, scene, invalidate } = useThree();
  const anatRef = useRef<AnatomyScene | null>(null);
  const rigRef = useRef<CameraRig | null>(null);
  const hoverRef = useRef<string | null>(null);

  // Environment once per context.
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, { size: 64 }).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.5;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  // Rig + input once.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 28;
    cam.updateProjectionMatrix();
    const rig = new CameraRig(cam, { target: [0, 0, 0], radius: 1, theta: 0, phi: Math.PI / 2 });
    rig.minRadius = 0.006;
    rig.bounds.set(new THREE.Vector3(-2, -2, -2), new THREE.Vector3(2, 2, 2));
    rigRef.current = rig;
    const el = gl.domElement;
    const ndc = new THREE.Vector2();
    const pickAt = (x: number, y: number, ring: number) => {
      const r = el.getBoundingClientRect();
      ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      return anatRef.current?.pick(ndc, cam, ring, new THREE.Vector2(r.width, r.height)) ?? null;
    };
    const input = new RigInput(el, rig, {
      panMode: () => panRef.current,
      wheelGate: (e) => gateRef.current(e),
      pick: (x, y) => pickAt(x, y, 0)?.point ?? null,
      onTap: (x, y, type) => {
        const h = pickAt(x, y, type === 'touch' ? 12 : 4);
        if (h && registry.isAncestorOrSelf(useApp.getState().selectedId ?? '', h.structureId) && h.structureId !== useApp.getState().selectedId) {
          useApp.getState().select(h.structureId);
        }
      },
      onHover: (x, y) => {
        const h = pickAt(x, y, 0);
        const id = h?.structureId ?? null;
        if (id !== hoverRef.current) {
          hoverRef.current = id;
          anatRef.current?.applyState({ ...baseState(), hoveredId: id });
          el.title = id ? (registry.get(id)?.name ?? '') : '';
          invalidate();
        }
      },
    });
    const kick = () => invalidate();
    el.addEventListener('pointermove', kick);
    el.addEventListener('wheel', kick, { passive: true });
    return () => {
      input.dispose();
      el.removeEventListener('pointermove', kick);
      el.removeEventListener('wheel', kick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, gl, invalidate, registry]);

  const baseState = () => ({
    opacity: allOpaque(),
    hidden: new Set<string>(),
    faded: new Set<string>(),
    isolate: { id: targetId, mode: context ? ('ghost' as const) : ('hide' as const) },
    selectedId: null,
    hoveredId: hoverRef.current,
    explode: 0,
  });

  // Rebuild content whenever the target changes.
  useEffect(() => {
    const rec = registry.get(targetId);
    const rig = rigRef.current;
    if (!rec || !rig) return;
    let cancelled = false;
    const library = libraryFor(registry.model);
    const anat = new AnatomyScene(registry, quality.tier, { ghostOpacity: 0.13 });
    anatRef.current = anat;
    scene.add(anat.root);
    const targetUnits = new Set(registry.unitsUnder(targetId));
    const ctxIds = registry.spatialNeighbours(targetId, rec.kind === 'structure' ? 0.008 : 0.004, rec.kind === 'structure' ? 14 : 6);
    const ctxUnits = new Set(ctxIds.flatMap((s) => s.units ?? []));
    const st = useApp.getState();
    const systems = new Set<SystemId>();
    for (const fj of targetUnits) systems.add(registry.unitSystem.get(fj)!);
    for (const fj of ctxUnits) {
      const s = registry.unitSystem.get(fj)!;
      if (st.systemStatus[s] === 'ready') systems.add(s);
    }
    anat.applyState(baseState());
    const pinned: string[] = [];
    Promise.all(
      [...systems].map((s) =>
        library.loadSystem(s, registry.manifest.systems[s]!.file).then((units) => {
          if (cancelled) return;
          anat.addUnits(s, units, (fj) => targetUnits.has(fj) || ctxUnits.has(fj));
        }),
      ),
    ).then(() => {
      if (cancelled) return;
      anat.setWireframe(wireframe);
      anat.applyState(baseState());
      // Frame using the main view's current azimuth so orientation stays familiar.
      const mainTheta = viewer.rig?.pose.theta ?? 0;
      const pose = poseForBox(rec.bbox, { target: [0, 0, 0], radius: 1, theta: mainTheta, phi: Math.PI * 0.46 }, rig.camera, { outward: false, margin: 1.15 });
      rig.setImmediate({ ...pose, radius: pose.radius * 1.5 });
      rig.flyTo(pose, { duration: 0.6, arc: false });
      rig.bounds.set(new THREE.Vector3(...rec.bbox[0]).subScalar(0.3), new THREE.Vector3(...rec.bbox[1]).addScalar(0.3));
      onDetail({ kind: 'lo', tris: anat.triangles(targetId) });
      invalidate();
      if (targetUnits.size > HI_RES_UNIT_LIMIT) {
        onDetail({ kind: 'lo-only', tris: anat.triangles(targetId) });
        return;
      }
      const chunks = new Set<string>();
      for (const fj of targetUnits) {
        const c = registry.manifest.units[fj]?.chunk;
        if (c) chunks.add(c);
      }
      onDetail({ kind: 'loading', tris: anat.triangles(targetId) });
      Promise.all(
        [...chunks].map((c) => {
          library.pin(c);
          pinned.push(c);
          return library.loadHi(c).then((units) => {
            if (cancelled) return;
            for (const u of units.values()) if (targetUnits.has(u.fj)) anat.setUnitGeometry(u.fj, u.geometry, u);
          });
        }),
      )
        .then(() => {
          if (cancelled) return;
          anat.setWireframe(wireframe);
          onDetail({ kind: 'hi', tris: anat.triangles(targetId) });
          invalidate();
        })
        .catch(() => !cancelled && onDetail({ kind: 'lo', tris: anat.triangles(targetId) }));
    });
    return () => {
      cancelled = true;
      scene.remove(anat.root);
      anat.dispose();
      for (const c of pinned) library.unpin(c);
      if (anatRef.current === anat) anatRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, registry, quality.tier]);

  useEffect(() => {
    anatRef.current?.applyState(baseState());
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  useEffect(() => {
    anatRef.current?.setWireframe(wireframe);
    invalidate();
  }, [wireframe, invalidate]);

  useEffect(() => {
    const rig = rigRef.current;
    const rec = registry.get(targetId);
    if (!rig || !rec || !viewCmd.n) return;
    const base = poseForBox(rec.bbox, rig.pose, rig.camera, { outward: false, margin: 1.15 });
    if (viewCmd.id === 'reset') rig.flyTo({ ...base, theta: viewer.rig?.pose.theta ?? 0, phi: Math.PI * 0.46 });
    else {
      const v = STANDARD_VIEWS.find((x) => x.id === viewCmd.id);
      if (v) rig.flyTo({ ...base, theta: v.theta, phi: v.phi });
    }
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewCmd]);

  useFrame((state, dt) => {
    anatRef.current?.setResolution(state.size.width, state.size.height);
    const a = rigRef.current?.update(dt) ?? false;
    const b = anatRef.current?.update(dt) ?? false;
    if (a || b) invalidate();
  });
  return null;
}

export function InspectViewport({ registry, targetId, quality }: { registry: Registry; targetId: string; quality: QualityProfile }) {
  const [context, setContext] = useState(true);
  const [wire, setWire] = useState(false);
  const [detail, setDetail] = useState<DetailState>({ kind: 'lo', tris: 0 });
  const [viewCmd, setViewCmd] = useState({ id: 'reset', n: 0 });
  const [pan, setPan] = useState(false);
  const panRef = useRef(false);
  panRef.current = pan;
  // Fullscreen: native Fullscreen API where available, otherwise a fixed full-viewport overlay (iOS Safari).
  const boxRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState<'off' | 'native' | 'overlay'>('off');
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement && document.fullscreenElement === boxRef.current ? 'native' : (f) => (f === 'native' ? 'off' : f));
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  useEffect(() => {
    // Ancestors with backdrop-filter would trap a fixed overlay; a root class lifts those styles.
    document.documentElement.classList.toggle('inspect-full', full === 'overlay');
    return () => document.documentElement.classList.remove('inspect-full');
  }, [full]);
  useEffect(() => {
    if (full !== 'overlay') return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && (e.stopPropagation(), setFull('off'));
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [full]);
  const toggleFull = useCallback(() => {
    const el = boxRef.current;
    if (!el) return;
    if (full === 'native') return void document.exitFullscreen?.();
    if (full === 'overlay') return setFull('off');
    if (document.fullscreenEnabled && el.requestFullscreen) el.requestFullscreen().catch(() => setFull('overlay'));
    else setFull('overlay');
  }, [full]);
  // Re-frame after the canvas size changes so the structure stays centred.
  useEffect(() => {
    const t = window.setTimeout(() => setViewCmd((v) => ({ id: 'reset', n: v.n + 1 })), 120);
    return () => clearTimeout(t);
  }, [full]);
  // Embedded in a scrolling page (Learn): the wheel scrolls the page until the view is engaged (click/tap
  // on it) or the gesture is a pinch (ctrl+wheel); touch scrolls vertically until engaged.
  const [engaged, setEngaged] = useState(false);
  const engagedRef = useRef(false);
  engagedRef.current = engaged;
  const fullRef = useRef(full);
  fullRef.current = full;
  const [hint, setHint] = useState(false);
  const hintT = useRef(0);
  const gateRef = useRef<(e: WheelEvent) => boolean>(() => true);
  gateRef.current = (e) => {
    if (fullRef.current !== 'off' || e.ctrlKey || engagedRef.current) return true;
    if (!boxRef.current?.closest('.learn')) return true;
    setHint(true);
    clearTimeout(hintT.current);
    hintT.current = window.setTimeout(() => setHint(false), 1400);
    return false;
  };
  useEffect(() => () => clearTimeout(hintT.current), []);
  useEffect(() => {
    if (!engaged) return;
    const box = boxRef.current;
    const out = (e: PointerEvent) => {
      if (!box || !box.contains(e.target as Node)) setEngaged(false);
    };
    const leave = (e: PointerEvent) => e.pointerType === 'mouse' && setEngaged(false);
    document.addEventListener('pointerdown', out, true);
    box?.addEventListener('pointerleave', leave);
    return () => {
      document.removeEventListener('pointerdown', out, true);
      box?.removeEventListener('pointerleave', leave);
    };
  }, [engaged]);
  const rec = registry.get(targetId);
  const view = (id: string) => setViewCmd((v) => ({ id, n: v.n + 1 }));
  const dpr = useMemo(() => Math.min(quality.maxDpr, 2), [quality.maxDpr]);
  if (!rec) return null;
  const badge =
    detail.kind === 'hi'
      ? 'Full-resolution source mesh'
      : detail.kind === 'loading'
        ? 'Loading full-resolution mesh…'
        : detail.kind === 'lo-only'
          ? 'Body-view meshes (large selection)'
          : 'Body-view mesh (simplified)';
  return (
    <div className="inspect">
      <div ref={boxRef} onPointerDownCapture={() => !engaged && setEngaged(true)} className={`inspect-canvas ${full !== 'off' ? 'is-full' : ''} ${full === 'overlay' ? 'overlay-full' : ''} ${engaged ? 'engaged' : ''}`} title="Independent inspection view: drag to rotate, scroll or pinch to zoom, right-drag to pan">
        {full !== 'off' && <div className="inspect-title">{rec.name}</div>}
        <Canvas frameloop="demand" resize={{ scroll: false }} dpr={dpr} gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }} camera={{ fov: 28, near: 0.001, far: 10, position: [0, 0, 1] }}>
          <hemisphereLight args={['#eef2f7', '#2a2522', 0.6]} />
          <directionalLight position={[1.5, 2.5, 2.2]} intensity={1.5} />
          <directionalLight position={[-2, 0.6, -1.6]} intensity={0.6} color="#d6e4ff" />
          <InspectDriver registry={registry} targetId={targetId} quality={quality} context={context} wireframe={wire} viewCmd={viewCmd} onDetail={setDetail} panRef={panRef} gateRef={gateRef} />
        </Canvas>
        {hint && <div className="inspect-hint">Click the model to zoom · or Ctrl + scroll</div>}
        <div className={`inspect-badge ${detail.kind}`} title="Triangle count of the selected structure as displayed">
          {badge}
          {detail.tris > 0 && <span className="mono"> · {detail.tris.toLocaleString()} tris</span>}
        </div>
        <div className="inspect-tools" role="toolbar" aria-label="Inspector view controls">
          <button className="icon-btn sm" onClick={() => view('reset')} aria-label="Reset inspector view" title="Reset view">
            <RotateCcw size={14} />
          </button>
          <span className="tools-gap" />
          <button className={`icon-btn sm ${pan ? 'on' : ''}`} onClick={() => setPan((p) => !p)} aria-pressed={pan} aria-label="Pan mode" title="Pan mode: drag moves the structure in any direction">
            <Hand size={14} />
          </button>
          <button className={`icon-btn sm ${context ? 'on' : ''}`} onClick={() => setContext((c) => !c)} aria-pressed={context} aria-label="Neighbouring structures" title="Show neighbouring structures as faded context">
            <Layers2 size={14} />
          </button>
          <button className={`icon-btn sm ${wire ? 'on' : ''}`} onClick={() => setWire((w) => !w)} aria-pressed={wire} aria-label="Wireframe" title="Show mesh wireframe (actual geometric detail)">
            <Grid2x2 size={14} />
          </button>
          <button className={`icon-btn sm ${full !== 'off' ? 'on' : ''}`} onClick={toggleFull} aria-pressed={full !== 'off'} aria-label={full !== 'off' ? 'Exit full screen' : 'Full screen'} title={full !== 'off' ? 'Exit full screen (Esc)' : 'Full screen'}>
            {full !== 'off' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
