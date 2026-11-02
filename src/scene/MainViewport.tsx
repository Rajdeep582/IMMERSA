import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Registry } from '../data/registry';
import { SYSTEMS } from '../data/systems';
import type { SystemId } from '../data/types';
import { AnatomyScene, type ViewState } from '../engine/anatomyScene';
import { CameraRig, HOME_POSE } from '../engine/cameraRig';
import { HiLodController } from '../engine/hiLod';
import { libraryFor } from '../engine/models';
import type { QualityProfile } from '../engine/quality';
import { RigInput } from '../engine/rigInput';
import { loadProgress } from '../engine/loadProgress';
import { viewer } from '../engine/viewer';
import { useApp } from '../state/store';
import { useStats } from '../state/stats';

let drillHinted = false;

/**
 * Built scenes are kept per body model (except on low-memory devices), so switching male ⇄ female swaps
 * an already merged, already uploaded scene instead of rebuilding ~2,500 meshes and their batches.
 */
const sceneCache = new Map<string, AnatomyScene>();
const cacheScenes = (q: QualityProfile) => q.tier !== 'low';
function sceneFor(registry: Registry, q: QualityProfile): AnatomyScene {
  const key = `${registry.model}|${q.tier}`;
  let s = cacheScenes(q) ? sceneCache.get(key) : undefined;
  if (!s) {
    s = new AnatomyScene(registry, q.tier, { batch: !/[?&]batch=0/.test(location.search) });
    if (cacheScenes(q)) sceneCache.set(key, s);
  }
  return s;
}

/** Resolve after the browser has had a chance to paint (and run animations). */
const yieldFrame = () => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 0)));

const idleCb = (cb: () => void) => {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ric) ric(cb, { timeout: 600 });
  else window.setTimeout(cb, 30);
};

/**
 * Build the other body's scene in idle time (meshes from the background-preloaded library, merged
 * batches, shader programs and GPU buffers via one off-screen render), so the first switch is instant.
 */
export async function prebuildScene(registry: Registry, q: QualityProfile) {
  if (!cacheScenes(q) || sceneCache.has(`${registry.model}|${q.tier}`)) return;
  const anat = sceneFor(registry, q);
  const lib = libraryFor(registry.model);
  for (const meta of SYSTEMS) {
    const m = registry.manifest.systems[meta.id];
    if (!m || !meta.eager) continue;
    const units = await lib.loadSystem(meta.id, m.file).catch(() => null);
    if (!units) continue;
    await new Promise<void>((r) => idleCb(() => (anat.addUnits(meta.id, units), r())));
  }
  // Wait for the merged batches, then upload everything once off-screen.
  for (let i = 0; i < 200 && anat.mergesPending > 0; i++) await new Promise((r) => setTimeout(r, 150));
  const d = viewer.debug;
  if (!d || useApp.getState().bodyModel === registry.model) return;
  await new Promise<void>((r) => idleCb(r));
  try {
    const st = useApp.getState();
    anat.applyState({ opacity: st.opacity, hidden: new Set(), faded: new Set(), isolate: null, selectedId: null, hoveredId: null, explode: 0, sliceCount: st.sliceCount });
    for (let i = 0; i < 40; i++) anat.update(0.25);
    const scene = new THREE.Scene();
    scene.add(anat.root);
    const rt = new THREE.WebGLRenderTarget(4, 4);
    const prev = d.gl.getRenderTarget();
    await d.gl.compileAsync(scene, d.camera).catch(() => undefined);
    d.gl.setRenderTarget(rt);
    d.gl.render(scene, d.camera);
    d.gl.setRenderTarget(prev);
    rt.dispose();
    scene.remove(anat.root);
  } catch {
    /* best effort */
  }
}

const viewStateOf = (s: ReturnType<typeof useApp.getState>): ViewState => ({
  opacity: s.opacity,
  hidden: s.hidden,
  faded: s.faded,
  isolate: s.isolate,
  selectedId: s.selectedId,
  hoveredId: s.hoveredId,
  explode: s.explode,
  sliceCount: s.sliceCount,
});

function Lighting() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, { size: 64 }).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.42;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return (
    <>
      <hemisphereLight args={['#e8edf3', '#2b2622', 0.55]} />
      <directionalLight position={[1.8, 3.2, 2.6]} intensity={1.55} color="#fff6ea" />
      <directionalLight position={[-2.4, 1.2, 1.4]} intensity={0.45} color="#dfe8ff" />
      <directionalLight position={[0, 2.2, -3]} intensity={0.85} color="#cfe0ff" />
    </>
  );
}

/** Soft contact shadow under the feet so the body reads as floating above a floor. */
function GroundGlow() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(0,0,0,0.55)');
    grd.addColorStop(0.45, 'rgba(0,0,0,0.18)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.9, 0]} renderOrder={-1}>
      <planeGeometry args={[1.1, 0.7]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

function SceneDriver({ registry, quality }: { registry: Registry; quality: QualityProfile }) {
  const { gl, camera, scene, invalidate, size, setDpr } = useThree();
  const anat = useMemo(() => sceneFor(registry, quality), [registry, quality]);
  const library = useMemo(() => libraryFor(registry.model), [registry]);
  const rigRef = useRef<CameraRig | null>(null);
  const hiRef = useRef<HiLodController | null>(null);
  const drill = useRef<{ x: number; y: number; t: number; stack: string[]; idx: number }>({ x: 0, y: 0, t: 0, stack: [], idx: 0 });
  const offset = useRef({ cur: 0, goal: 0, curY: 0, goalY: 0, lastCheck: 0 });
  const perf = useRef({ ema: 1 / 60, slowFor: 0, dpr: quality.maxDpr, steps: 0, gesturing: false, lastMove: 0, frames: 0, acc: 0, lastStat: 0 });

  // --- scene, rig, input wiring (once) ---
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 30;
    cam.updateProjectionMatrix();
    scene.add(anat.root);
    // Arrive from a wider, rotated vantage for a gentle establishing move.
    // First visit: arrive from a wider, rotated vantage. Model switch: keep the user's exact view.
    const resumed = viewer.lastPose;
    const rig = new CameraRig(cam, resumed ?? { ...HOME_POSE, radius: 5.4, theta: HOME_POSE.theta + 0.9, phi: HOME_POSE.phi - 0.08 });
    rigRef.current = rig;
    const hi = new HiLodController(registry, anat, rig, library, invalidate);
    hi.enabled = quality.hiResInMainView;
    hi.onChange = (labels) => useApp.getState().setHiResRegion(labels.length ? labels.join(' · ') : null);
    hiRef.current = hi;
    library.setHiBudget(quality.hiChunkBudget);
    hi.swapBudget = quality.tier === 'low' ? 40000 : quality.tier === 'medium' ? 90000 : 150000;
    viewer.attach(rig, anat, registry, invalidate);
    anat.onBatchProgress = (n) => useApp.setState({ batchPending: n });
    // Staged GPU upload while the start-up screen is up: settle the fades, then draw the scene into a
    // tiny off-screen target a slice of triangles per frame, so buffers and shader programs are on the
    // GPU before the first visible frame (no long freeze when the intro lifts).
    viewer.warmUpload = async (onProgress?: (f: number) => void) => {
      const budget = quality.tier === 'low' ? 60000 : quality.tier === 'medium' ? 150000 : 300000;
      for (let i = 0; i < 60; i++) anat.update(0.25);
      const meshes = anat.drawnMeshes();
      const rt = new THREE.WebGLRenderTarget(4, 4);
      const prevRT = gl.getRenderTarget();
      const saved = meshes.map((m) => m.visible);
      try {
        await gl.compileAsync(scene, camera).catch(() => undefined);
        let i = 0;
        while (i < meshes.length) {
          let tris = 0;
          const from = i;
          while (i < meshes.length && (tris < budget || i === from)) {
            const g = meshes[i]!.geometry;
            tris += (g.index ? g.index.count : g.getAttribute('position').count) / 3;
            i++;
          }
          meshes.forEach((m, k) => (m.visible = k >= from && k < i));
          gl.setRenderTarget(rt);
          gl.render(scene, camera);
          gl.setRenderTarget(prevRT);
          meshes.forEach((m, k) => (m.visible = saved[k]!));
          onProgress?.(i / meshes.length);
          await yieldFrame();
        }
      } finally {
        meshes.forEach((m, k) => (m.visible = saved[k]!));
        gl.setRenderTarget(prevRT);
        rt.dispose();
      }
    };

    rig.onUserInput = () => {
      const g = useApp.getState().guided;
      if (g?.following) useApp.getState().patchGuided({ following: false });
    };
    rig.onDetailLimit = () => {
      const st = useApp.getState();
      st.showHint(
        'Closest useful viewing distance for the body model. Detailed meshes load automatically here; for the full-resolution source mesh of one structure, open it in the 3D inspector.',
        st.selectedId ? { label: 'Inspect selection', kind: 'inspect', target: st.selectedId } : undefined,
      );
    };

    const el = gl.domElement;
    const ndc = new THREE.Vector2();
    const toNdc = (x: number, y: number) => {
      const r = el.getBoundingClientRect();
      ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      return { ndc, vp: new THREE.Vector2(r.width, r.height) };
    };
    const planeHit = (x: number, y: number) => {
      const { ndc: n } = toNdc(x, y);
      const rc = new THREE.Raycaster();
      rc.setFromCamera(n, cam);
      const normal = cam.getWorldDirection(new THREE.Vector3()).negate();
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, rig.target);
      return rc.ray.intersectPlane(plane, new THREE.Vector3());
    };
    const input = new RigInput(el, rig, {
      pick: (x, y) => {
        // Zoom / pinch pivot: never builds a BVH mid-gesture (falls back to the focal plane).
        const { ndc: n, vp } = toNdc(x, y);
        const h = anat.pick(n, cam, 0, vp, false);
        return h ? h.point : planeHit(x, y);
      },
      onTap: (x, y, type) => {
        const { ndc: n, vp } = toNdc(x, y);
        const st = useApp.getState();
        // Repeated clicks on the same spot drill through overlapping structures (front to back).
        const d = drill.current;
        const now = performance.now();
        if (d.stack.length > 1 && Math.hypot(x - d.x, y - d.y) < 7 && now - d.t < 4000 && st.selectedId === d.stack[d.idx]) {
          d.idx = (d.idx + 1) % d.stack.length;
          d.t = now;
          st.select(d.stack[d.idx]!);
          const name = registry.get(d.stack[d.idx])?.name ?? '';
          st.showHint(`${d.idx + 1}/${d.stack.length} under pointer: ${name}. Click again to go deeper.`);
          invalidate();
          return;
        }
        const h = anat.pick(n, cam, type === 'touch' ? 14 : 5, vp);
        if (!h) {
          // Empty space toggles the model-only view (panels hidden, one info line).
          if (st.immersive) st.setImmersive(false);
          else {
            st.select(null);
            st.setImmersive(true);
          }
          drill.current = { x, y, t: now, stack: [], idx: 0 };
          invalidate();
          return;
        }
        const all = anat.pickAll(n, cam);
        const stack = h ? [h.structureId, ...all.map((a) => a.structureId).filter((s) => s !== h.structureId)] : [];
        drill.current = { x, y, t: now, stack, idx: 0 };
        st.select(h ? h.structureId : null);
        if (stack.length > 1 && !drillHinted) {
          drillHinted = true;
          st.showHint(`${stack.length} structures under the pointer. Click the same spot again to select the next one behind.`);
        }
        if (!st.rightOpen && !st.immersive && st.layout !== 'phone' && !st.guided) st.setRightOpen(true);
        invalidate();
      },
      onDoubleTap: (x, y) => {
        const { ndc: n, vp } = toNdc(x, y);
        const h = anat.pick(n, cam, 8, vp);
        if (h) {
          useApp.getState().select(h.structureId);
          viewer.focus(h.structureId);
        } else viewer.fullBody();
      },
      onHover: (x, y) => {
        if (rig.isMoving) return;
        const { ndc: n, vp } = toNdc(x, y);
        const h = anat.pick(n, cam, 0, vp, false);
        const r = el.getBoundingClientRect();
        useApp.getState().hover(h ? h.structureId : null, h ? { x: x - r.left, y: y - r.top } : null);
      },
      onHoverEnd: () => useApp.getState().hover(null),
      panMode: () => useApp.getState().panMode,
      onGestureStart: () => {
        useApp.getState().hover(null);
        invalidate();
      },
    });
    // Plain mouse hovering needs no frame (hover changes redraw through the store); drags and touches do.
    const kick = (e: PointerEvent | WheelEvent) => {
      if (!(e instanceof PointerEvent) || e.buttons !== 0 || e.pointerType !== 'mouse') invalidate();
    };
    el.addEventListener('pointermove', kick);
    el.addEventListener('wheel', kick, { passive: true });

    return () => {
      viewer.lastPose = rig.goalPose;
      input.dispose();
      el.removeEventListener('pointermove', kick);
      el.removeEventListener('wheel', kick);
      viewer.detach();
      viewer.warmUpload = null;
      scene.remove(anat.root);
      anat.onBatchProgress = null;
      anat.onAsync = null;
      // Cached scenes return to body-view meshes (full-resolution chunks may be evicted meanwhile).
      for (const fj of anat.hiActiveUnits()) anat.setUnitGeometry(fj, null);
      if (!cacheScenes(quality)) anat.dispose();
    };
  }, [anat, camera, gl, invalidate, quality, registry, scene, library]);

  // --- push app state into the scene ---
  // Worker-cut slabs arrive asynchronously; redraw when they do.
  useEffect(() => {
    anat.onAsync = invalidate;
    return () => {
      anat.onAsync = null;
    };
  }, [anat, invalidate]);

  useEffect(() => {
    anat.applyState(viewStateOf(useApp.getState()));
    invalidate();
    return useApp.subscribe((s, p) => {
      if (
        s.opacity !== p.opacity ||
        s.hidden !== p.hidden ||
        s.faded !== p.faded ||
        s.isolate !== p.isolate ||
        s.selectedId !== p.selectedId ||
        s.hoveredId !== p.hoveredId ||
        s.explode !== p.explode ||
        s.sliceCount !== p.sliceCount
      ) {
        anat.applyState(viewStateOf(s));
        invalidate();
      }
    });
  }, [anat, invalidate]);

  // --- progressive system loading ---
  useEffect(() => {
    const manifest = registry.manifest;
    let arrived = false;
    // Start-up scheduler: a few systems download/decode at a time, silhouette first, so the first
    // complete frame appears quickly and low-end devices are not flooded with parallel decodes.
    const PRIORITY: SystemId[] = ['integumentary', 'skeletal', 'nervous', 'digestive', 'respiratory', 'urinary', 'reproductive', 'sensory', 'lymphatic', 'endocrine', 'cardiovascular', 'muscular'];
    const waiting = new Set<SystemId>();
    let active = 0;
    let disposed = false;
    const pump = () => {
      while (!disposed && active < quality.loadConcurrency && waiting.size) {
        const next = PRIORITY.find((x) => waiting.has(x)) ?? [...waiting][0]!;
        waiting.delete(next);
        active++;
        start(next);
      }
    };
    const load = (sys: SystemId, urgent = false) => {
      const m = manifest.systems[sys];
      const st = useApp.getState();
      if (st.bodyModel !== registry.model) return; // this viewport is being replaced
      if (!m) return;
      if (waiting.has(sys)) {
        // Queued but now needed right away (selected / isolated): jump the queue.
        if (urgent) {
          waiting.delete(sys);
          active++;
          start(sys);
        }
        return;
      }
      if (st.systemStatus[sys] === 'loading' || st.systemStatus[sys] === 'ready') return;
      st.setSystemStatus(sys, 'loading');
      if (urgent) {
        active++;
        start(sys);
      } else {
        waiting.add(sys);
        pump();
      }
    };
    const start = (sys: SystemId) => {
      const m = manifest.systems[sys]!;
      library
        .loadSystem(sys, m.file)
        .then(async (units) => {
          loadProgress.set(sys, 0.85);
          // A late result from a model that has since been switched away must not touch the new state.
          if (useApp.getState().bodyModel !== registry.model) return;
          // Meshes are created a slice at a time between frames (big systems have ~1,000 parts), so the
          // start-up animation never stalls; their merged batches are built once at the end.
          let added = 0;
          const all = [...units.entries()];
          const SLICE = quality.tier === 'low' ? 60 : 140;
          for (let i = 0; i < all.length; i += SLICE) {
            if (useApp.getState().bodyModel !== registry.model) return;
            added += anat.addUnits(sys, new Map(all.slice(i, i + SLICE)), undefined, true);
            loadProgress.set(sys, 0.85 + 0.14 * Math.min(1, (i + SLICE) / all.length));
            if (i + SLICE < all.length) await yieldFrame();
          }
          anat.flushBatches(sys);
          loadProgress.set(sys, 1);
          useApp.getState().setSystemStatus(sys, 'ready');
          // New meshes only (a cached scene on a body switch has them all): compile new shader programs in
          // parallel (KHR_parallel_shader_compile) and warm picking BVHs in idle time.
          if (added) {
            gl.compileAsync(scene, camera).then(() => invalidate()).catch(() => undefined);
            anat.warmBvh();
          }
          if (!arrived) {
            arrived = true;
            if (!viewer.resumedFromSwitch) rigRef.current?.flyTo(HOME_POSE, { duration: 2.1, arc: false });
          }
          invalidate();
        })
        .catch((e: unknown) => {
          console.error(e);
          loadProgress.set(sys, 1);
          if (useApp.getState().bodyModel === registry.model) useApp.getState().setSystemStatus(sys, 'error');
        })
        .finally(() => {
          active--;
          pump();
        });
    };
    const needed = (s: ReturnType<typeof useApp.getState>) => {
      for (const meta of SYSTEMS) {
        const want =
          meta.eager ||
          (s.opacity[meta.id] ?? 0) > 0 ||
          (s.selectedId && registry.get(s.selectedId)?.system === meta.id) ||
          (s.isolate && registry.get(s.isolate.id)?.system === meta.id);
        const urgent = !!((s.selectedId && registry.get(s.selectedId)?.system === meta.id) || (s.isolate && registry.get(s.isolate.id)?.system === meta.id));
        if (want) load(meta.id, urgent);
      }
    };
    // Start-up: every start-up file starts downloading at once (largest first, so the big muscle and
    // vessel files are not left until the end); decoding still follows the priority order below.
    if (window.__intro) {
      const eager = SYSTEMS.filter((m) => m.eager && manifest.systems[m.id]).map((m) => m.id);
      for (const id of eager) loadProgress.register(id, manifest.systems[id]!.bytes ?? 1);
      eager
        .sort((a, b) => (manifest.systems[b]!.bytes ?? 0) - (manifest.systems[a]!.bytes ?? 0))
        .forEach((id) => void library.prefetch(id, manifest.systems[id]!.file, manifest.systems[id]!.bytes ?? 0, (f) => loadProgress.set(id, 0.7 * f)).catch(() => undefined));
    }
    // Shader variants for later fades: compiled after the start-up screen has lifted (the visible scene's
    // own programs are compiled by warmUpload), so the GPU is not busy with them while the body loads.
    let prewarmTimer = 0;
    const prewarm = () => anat.prewarm(gl, scene, camera).then(() => invalidate());
    if (useApp.getState().introActive) {
      const off = useApp.subscribe((s) => {
        if (s.introActive) return;
        off();
        prewarmTimer = window.setTimeout(prewarm, 1500);
      });
    } else prewarm();
    // Skin and skeleton first: they define the silhouette.
    load('integumentary');
    load('skeletal');
    needed(useApp.getState());
    const unsub = useApp.subscribe((s, p) => {
      if (s.opacity !== p.opacity || s.selectedId !== p.selectedId || s.isolate !== p.isolate || s.systemStatus !== p.systemStatus) needed(s);
    });
    // Background prefetch of the large lazy systems on capable devices, after the scene is up.
    let timer = 0;
    if (quality.prefetchLazySystems) {
      timer = window.setTimeout(() => {
        for (const meta of SYSTEMS) if (!meta.eager) load(meta.id);
      }, 3500);
    }
    return () => {
      disposed = true;
      unsub();
      clearTimeout(timer);
      clearTimeout(prewarmTimer);
    };
  }, [anat, invalidate, quality.prefetchLazySystems, registry, library]);

  // Panels sliding in/out change the visible area: wake the demand-driven loop so the centre shift animates.
  useEffect(
    () =>
      useApp.subscribe((s, p) => {
        if (s.leftOpen !== p.leftOpen || s.rightOpen !== p.rightOpen || !!s.guided !== !!p.guided || s.immersive !== p.immersive) {
          offset.current.lastCheck = 0;
          for (const t of [30, 250, 450]) window.setTimeout(() => {
            offset.current.lastCheck = 0;
            invalidate();
          }, t);
        }
      }),
    [invalidate],
  );

  // Keep the camera framing stable across resizes (R3F updates aspect; we re-apply the pose).
  useEffect(() => {
    rigRef.current?.apply();
    invalidate();
  }, [size.width, size.height, invalidate]);

  useFrame((state, dt) => {
    const rig = rigRef.current;
    if (!rig) return;
    // Keep the model centred in the area not covered by side panels (projection shift, no camera move).
    const o = offset.current;
    const nowMs = performance.now();
    if (nowMs - o.lastCheck > 200) {
      o.lastCheck = nowMs;
      const W = size.width;
      const imm = !!document.querySelector('.app.immersive');
      const l = imm ? 0 : (document.querySelector('.panel.left.open')?.getBoundingClientRect().right ?? 0);
      const rEl = imm ? null : document.querySelector('.panel.right.open, .guided, .app.landscape .sheet');
      const r = rEl && !document.querySelector('.app.mobile') ? W - rEl.getBoundingClientRect().left : 0;
      o.goal = l > W * 0.6 || r > W * 0.6 ? 0 : (r - l) / 2;
      // Bottom sheets / mobile journey panel cover the lower part of the screen.
      const bEl = imm || document.querySelector('.app.landscape') ? null : document.querySelector('.sheet, .app.mobile .guided');
      const covered = bEl ? Math.max(0, size.height - bEl.getBoundingClientRect().top) : 0;
      // Centre the model in the band between the top bar and the bottom toolbar / info line.
      const phone = !!document.querySelector('.app.mobile');
      const topPx = imm ? 0 : phone ? 50 : 64;
      const bottomPx = imm ? 44 : phone ? 72 : 76;
      o.goalY = covered > size.height * 0.85 ? 0 : covered / 2 - (topPx - bottomPx) / 2;
    }
    let shifting = false;
    const k = 1 - Math.exp(-dt / 0.18);
    if (Math.abs(o.cur - o.goal) > 0.3 || Math.abs(o.curY - o.goalY) > 0.3) {
      o.cur += (o.goal - o.cur) * k;
      o.curY += (o.goalY - o.curY) * k;
      shifting = true;
    } else {
      o.cur = o.goal;
      o.curY = o.goalY;
    }
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(o.cur) > 0.3 || Math.abs(o.curY) > 0.3) cam.setViewOffset(size.width, size.height, o.cur, o.curY, size.width, size.height);
    else if (cam.view) cam.clearViewOffset();
    anat.setResolution(size.width, size.height);
    const a = rig.update(dt) || shifting;
    const b = anat.update(dt);
    hiRef.current?.update(performance.now());
    for (const fn of viewer.frameListeners) fn(cam);
    if (a || b || hiRef.current?.loading) invalidate();

    // Resolution policy: one fixed render resolution (never lowered while moving, so nothing turns
    // blurry and the canvas is never reallocated mid-gesture). Only if a device stays far below 30 fps
    // while interacting for several seconds is the resolution stepped down once, permanently.
    const p = perf.current;
    const moving = a || b || !!hiRef.current?.loading;
    const gesturing = rig.isMoving;
    if (moving) p.lastMove = performance.now();
    if (gesturing !== p.gesturing) {
      p.gesturing = gesturing;
      // Frosted-glass panels are re-blurred every frame the canvas changes: pause the blur during gestures.
      document.documentElement.classList.toggle('gesturing', gesturing);
    }
    if (gesturing && dt < 0.25) {
      p.ema = p.ema * 0.9 + dt * 0.1;
      p.slowFor = p.ema > 1 / 24 ? p.slowFor + dt : 0;
      if (p.slowFor > 4 && p.steps < 2 && p.dpr > Math.max(1, quality.minDpr)) {
        p.steps++;
        p.slowFor = 0;
        p.dpr = Math.max(1, quality.minDpr, +(p.dpr - 0.25).toFixed(2));
        setDpr(p.dpr);
      }
    }
    p.frames++;
    p.acc += dt;
    const now = performance.now();
    if (now - p.lastStat > 500) {
      const info = state.gl.info.render;
      useStats.setState({
        fps: p.acc > 0 ? p.frames / p.acc : 0,
        frameMs: p.ema * 1000,
        calls: info.calls,
        triangles: info.triangles,
        dpr: state.viewport.dpr,
        units: anat.unitCount,
        geometries: state.gl.info.memory.geometries,
        radius: rig.radius,
      });
      p.frames = 0;
      p.acc = 0;
      p.lastStat = now;
    }
  });

  return null;
}

export function MainViewport({ registry, quality, paused: pausedProp = false }: { registry: Registry; quality: QualityProfile; paused?: boolean }) {
  // Nothing is drawn behind the start-up screen: loading work gets the main thread to itself.
  const intro = useApp((s) => s.introActive);
  const paused = pausedProp || intro;
  // Hidden under the Learn page: stop drawing entirely (GPU/battery), resume with one frame.
  useEffect(() => {
    if (!paused) for (const t of [0, 60, 250]) window.setTimeout(() => viewer.invalidate(), t);
  }, [paused]);
  return (
    <div className="viewport" aria-label="3D anatomy viewport. Drag to rotate, scroll or pinch to zoom toward the pointer, right-drag or two fingers to pan.">
      <Canvas
        resize={{ scroll: false }}
        frameloop={paused ? 'never' : 'demand'}
        dpr={quality.maxDpr}
        gl={{ antialias: quality.antialias, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false, stencil: false, depth: true, failIfMajorPerformanceCaveat: false }}
        camera={{ fov: 30, near: 0.01, far: 20, position: [0, 0, 3] }}
        onCreated={({ gl, scene, camera }) => {
          viewer.debug = { gl, scene, camera };
          gl.setClearColor(0x000000, 0);
          // Neutral tone mapping keeps tissue hues saturated (ACES desaturates bright reds/yellows).
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        <Lighting />
        <GroundGlow />
        {/* Keyed by model: switching bodies rebuilds the scene graph but keeps one WebGL context. */}
        <SceneDriver key={registry.model} registry={registry} quality={quality} />
      </Canvas>
    </div>
  );
}
