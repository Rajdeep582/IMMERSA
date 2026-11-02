import * as THREE from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import type { Registry } from '../data/registry';
import type { SystemOpacity } from '../data/systems';
import type { SystemId } from '../data/types';
import type { AppState } from '../state/store';
import { ACCENT, HOVER, createOutlineMaterial, createSliceUniforms, createUnitMaterial, makeBatchMaterial, materialKey, setDetailAxis } from './materials';
import type { LoadedUnit } from './models';
import { flatAttr, sliceSplitter } from './sliceSplitter';
import { mergeUnits, type MergeResult, type MergeUnit } from './sliceWorker';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;


interface UnitView {
  fj: string;
  system: SystemId;
  structureId: string;
  ancestors: string[];
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  baseColor: THREE.Color;
  loGeometry: THREE.BufferGeometry;
  loTransform: { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 };
  hiChunk: string | null;
  basePosition: THREE.Vector3;
  opacityTarget: number;
  opacity: number;
  highlightTarget: number;
  highlight: number;
  hoverTarget: number;
  hover: number;
  baseOpacity: number;
  outline: THREE.Mesh | null;
  offsetTarget: THREE.Vector3;
  offset: THREE.Vector3;
  /** Part of the current vertical slice dissection. */
  sliced: boolean;
  /** Geometry the unit shows when not dissected (body-view or full-resolution). */
  baseGeom: THREE.BufferGeometry;
  /** Worker-cut copy of baseGeom for one slab layout. */
  split: { geom: THREE.BufferGeometry; key: string } | null;
  splitPending: string | null;
  /** Logically visible (opacity above zero) — independent of whether it is drawn alone or in a batch. */
  logicalVisible: boolean;
  batch: Batch | null;
  batchIndex: number;
  /** Currently drawn by its batch (own mesh hidden). */
  inBatch: boolean;
  gpuFreed: boolean;
  /** Cached world-space bounding sphere for ray prefiltering. */
  wsphere: THREE.Sphere | null;
  /** Depth-only pre-pass (translucent muscle / skin layers draw only their front surface). */
  pre: THREE.Mesh | null;
}

/**
 * Units of one system that share a material look, merged into one draw call. Units that need their
 * own state (selection, hover, slicing, full-resolution mesh, a different opacity) are masked out of
 * the batch and drawn by their own mesh, so visuals and interaction are unchanged.
 */
interface Batch {
  key: string;
  system: SystemId;
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  units: UnitView[];
  mask: Uint8Array;
  maskTex: THREE.DataTexture;
  maskDirty: boolean;
  opacityTarget: number;
  opacity: number;
  baseOpacity: number;
  tint: THREE.Color;
  members: number;
  /** Opacity the members were last checked against (re-check all members when it moves). */
  syncedOpacity: number;
  syncedTarget: number;
  pre: THREE.Mesh | null;
}

/**
 * Translucent layers that wrap the body. Each draws a depth-only pre-pass and then only its front-most
 * surface, so a 30% muscle layer is one tinted veil instead of every muscle stacked (overdraw ×N).
 */
const LAYERED: Partial<Record<SystemId, number>> = { muscular: 2, integumentary: 4 };

function createDepthPrepass(mask?: { tex: THREE.DataTexture; w: number }): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    defines: mask ? { BATCH_MASK: '' } : {},
    uniforms: mask ? { uUnitMask: { value: mask.tex }, uMaskW: { value: mask.w } } : {},
    vertexShader: /* glsl */ `
      #ifdef BATCH_MASK
      attribute float aUnit;
      uniform highp sampler2D uUnitMask;
      uniform float uMaskW;
      #endif
      void main() {
        gl_Position = projectionMatrix * (modelViewMatrix * vec4(position, 1.0));
        #ifdef BATCH_MASK
        ivec2 tc = ivec2(int(mod(aUnit, uMaskW)), int(floor(aUnit / uMaskW)));
        if (texelFetch(uUnitMask, tc, 0).r < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        #endif
      }`,
    fragmentShader: /* glsl */ `void main() { gl_FragColor = vec4(0.0); }`,
    colorWrite: false,
    depthWrite: true,
    transparent: true,
    // Pushed back a hair so the colour pass of the same surface passes the depth test.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}

const idle = (cb: () => void) => {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ric) ric(cb, { timeout: 400 });
  else window.setTimeout(cb, 16);
};

export interface PickHit {
  fj: string;
  structureId: string;
  point: THREE.Vector3;
  distance: number;
}

export type ViewState = Pick<AppState, 'opacity' | 'hidden' | 'faded' | 'isolate' | 'selectedId' | 'hoveredId' | 'explode'> & { sliceCount?: number };

/** Current vertical (sagittal) slice dissection: region split along x into `n` slabs of width `h` from `y0`, spread by `gap`. */
export interface SliceInfo {
  target: string | null;
  y0: number;
  h: number;
  n: number;
  /** Gap the slabs are animating toward (metres between neighbouring slabs). */
  gap: number;
  /** Region bounds before separation. */
  box: THREE.Box3;
}

/** Opacity below which a structure is not pickable (so ghosted context never steals clicks). */
const PICK_MIN_OPACITY = 0.3;

/**
 * Imperative scene graph for the anatomy model. React never re-renders individual meshes:
 * application state is pushed in through `applyState`, and visual transitions are animated
 * per frame in `update`.
 */
export class AnatomyScene {
  readonly root = new THREE.Group();
  private units = new Map<string, UnitView>();
  private state: ViewState | null = null;
  private raycaster = new THREE.Raycaster();
  private pickables: THREE.Mesh[] = [];
  private pickDirty = true;
  private selectedAt = 0;
  private tier: 'low' | 'medium' | 'high';
  /** Units currently showing full-resolution geometry. */
  private hiActive = new Map<string, THREE.BufferGeometry>();
  /** Shader uniforms shared by this scene's materials for the slice dissection. */
  readonly slice = createSliceUniforms();
  private sliceInfo: SliceInfo | null = null;
  private sliceKey = '';
  private layoutKey = '';
  /** Called when asynchronous work (worker-cut slabs) changes what should be drawn. */
  onAsync: (() => void) | null = null;
  private batches: Batch[] = [];
  /** Units with a transition in progress; `update` only visits these. */
  private active = new Set<UnitView>();
  /** Units whose batch membership must be re-checked. */
  private batchDirty = new Set<UnitView>();
  /** Batch merges still in flight; reported so the start-up screen can wait for them. */
  private pendingMerges = 0;
  onBatchProgress: ((pending: number) => void) | null = null;

  get mergesPending() {
    return this.pendingMerges;
  }

  constructor(
    private registry: Registry,
    tier: 'low' | 'medium' | 'high',
    private opts: { ghostOpacity?: number; batch?: boolean } = {},
  ) {
    this.tier = tier;
    this.root.name = 'anatomy';
    this.raycaster.firstHitOnly = true;
  }

  get unitCount() {
    return this.units.size;
  }

  hasUnit(fj: string) {
    return this.units.has(fj);
  }

  /** Adds the units not yet in the scene; returns how many were new. */
  /** Units added with `deferBatch`, merged later in one go by `flushBatches` (sliced loading). */
  private deferred = new Map<SystemId, UnitView[]>();

  addUnits(system: SystemId, loaded: Map<string, LoadedUnit>, filter?: (fj: string) => boolean, deferBatch = false): number {
    const added: UnitView[] = [];
    for (const u of loaded.values()) {
      if (this.units.has(u.fj) || (filter && !filter(u.fj))) continue;
      const sid = this.registry.unitStructure.get(u.fj);
      if (!sid) continue;
      const name = this.registry.get(sid)?.name ?? '';
      // Mirror-pair seed (HRA _L/_R) so left and right parts share one tint.
      const material = createUnitMaterial(system, name, u.fj.replace(/_[LR]$/, ''), this.tier, !!this.registry.get(sid)?.landmark, this.registry.model === 'female', this.slice);
      const mesh = new THREE.Mesh(u.geometry, material);
      mesh.name = u.fj;
      mesh.position.copy(u.position);
      mesh.quaternion.copy(u.quaternion);
      mesh.scale.copy(u.scale);
      setDetailAxis(material, mesh);
      // Static meshes: matrices are recomposed only when a transform changes (not 2,500× per frame).
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      mesh.userData.fj = u.fj;
      const view: UnitView = {
        fj: u.fj,
        system,
        structureId: sid,
        ancestors: this.registry.unitAncestors(u.fj),
        mesh,
        material,
        baseColor: material.color.clone(),
        loGeometry: u.geometry,
        loTransform: { position: u.position.clone(), quaternion: u.quaternion.clone(), scale: u.scale.clone() },
        hiChunk: this.registry.manifest.units[u.fj]?.chunk ?? null,
        basePosition: u.position.clone(),
        opacityTarget: 0,
        opacity: 0,
        highlightTarget: 0,
        highlight: 0,
        hoverTarget: 0,
        hover: 0,
        baseOpacity: (material.userData.baseOpacity as number | undefined) ?? 1,
        outline: null,
        offsetTarget: new THREE.Vector3(),
        offset: new THREE.Vector3(),
        sliced: false,
        baseGeom: u.geometry,
        split: null,
        splitPending: null,
        logicalVisible: false,
        batch: null,
        batchIndex: -1,
        inBatch: false,
        gpuFreed: false,
        wsphere: null,
        pre: null,
      };
      this.units.set(u.fj, view);
      added.push(view);
      this.root.add(mesh);
      if (this.state) this.computeUnit(view, this.state);
      this.syncSliceFlag(view);
      // Newly arrived meshes fade in rather than popping.
      view.opacity = 0;
      this.syncMaterial(view);
      this.active.add(view);
    }
    this.pickDirty = true;
    if (this.opts.batch && added.length) {
      if (deferBatch) this.deferred.set(system, [...(this.deferred.get(system) ?? []), ...added]);
      else this.buildBatches(system, added);
    }
    // Structures that arrive while dissecting join the slab layout (recompute the region).
    if (this.state && this.state.explode > 0.001) {
      this.sliceKey = '';
      this.updateSlicing(this.state, this.state);
    }
    return added.length;
  }

  /** Merge the batches of units added with `deferBatch`. */
  flushBatches(system: SystemId) {
    const views = this.deferred.get(system);
    this.deferred.delete(system);
    if (views?.length && this.opts.batch) this.buildBatches(system, views);
  }

  /** Every mesh the scene currently draws (for staged GPU upload before the first visible frame). */
  drawnMeshes(): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    this.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.visible && m.name !== 'outline') out.push(m);
    });
    return out;
  }

  /** Swap a unit to a full-resolution geometry (same transform frame), or back to body LOD with null. */
  setUnitGeometry(fj: string, geom: THREE.BufferGeometry | null, transform?: LoadedUnit) {
    const v = this.units.get(fj);
    if (!v) return;
    if (geom && transform) {
      v.baseGeom = geom;
      v.mesh.geometry = geom;
      v.mesh.scale.copy(transform.scale);
      v.basePosition.copy(transform.position);
      v.mesh.quaternion.copy(transform.quaternion);
      this.hiActive.set(fj, geom);
    } else {
      v.baseGeom = v.loGeometry;
      v.mesh.geometry = v.loGeometry;
      v.mesh.scale.copy(v.loTransform.scale);
      v.mesh.quaternion.copy(v.loTransform.quaternion);
      v.basePosition.copy(v.loTransform.position);
      this.hiActive.delete(fj);
    }
    v.mesh.position.copy(v.basePosition).add(v.offset);
    v.mesh.updateMatrix();
    if (v.outline) v.outline.geometry = v.mesh.geometry;
    if (v.pre) v.pre.geometry = v.mesh.geometry;
    this.pickDirty = true;
    v.wsphere = null;
    this.batchDirty.add(v);
    // A geometry swap invalidates any cut copy.
    if (v.split) {
      v.split.geom.dispose();
      v.split = null;
    }
    v.splitPending = null;
    this.syncSliceFlag(v);
  }

  setWireframe(on: boolean) {
    for (const v of this.units.values()) {
      v.material.wireframe = on;
    }
  }

  /** Triangle count of units under a node, as currently displayed. */
  triangles(id: string): number {
    let t = 0;
    for (const fj of this.registry.unitsUnder(id)) {
      const g = this.units.get(fj)?.mesh.geometry;
      if (g) t += (g.index ? g.index.count : g.getAttribute('position').count) / 3;
    }
    return Math.round(t);
  }

  /** Units whose bounding sphere lies within `radius` metres of a point (visible only). */
  unitsNear(p: THREE.Vector3, radius: number): string[] {
    const out: string[] = [];
    const s = new THREE.Sphere();
    for (const v of this.units.values()) {
      if (v.opacityTarget * v.baseOpacity < PICK_MIN_OPACITY) continue;
      const g = v.mesh.geometry;
      if (!g.boundingSphere) g.computeBoundingSphere();
      v.mesh.updateMatrixWorld();
      s.copy(g.boundingSphere!).applyMatrix4(v.mesh.matrixWorld);
      if (s.distanceToPoint(p) < radius) out.push(v.fj);
    }
    return out;
  }

  chunkOf(fj: string) {
    return this.units.get(fj)?.hiChunk ?? null;
  }

  isHiActive(fj: string) {
    return this.hiActive.has(fj);
  }

  hiActiveUnits() {
    return [...this.hiActive.keys()];
  }

  /** Recompute per-unit targets from application state. Cheap: O(units × depth). */
  applyState(st: ViewState) {
    const prevSel = this.state?.selectedId;
    const prev = this.state;
    this.state = st;
    if (st.selectedId !== prevSel) this.selectedAt = performance.now();
    // Hover / selection only: recompute just the units under the old and new hovered/selected nodes.
    if (
      prev &&
      prev.opacity === st.opacity &&
      prev.hidden === st.hidden &&
      prev.faded === st.faded &&
      prev.isolate === st.isolate &&
      prev.explode <= 0.001 &&
      st.explode <= 0.001 &&
      prev.sliceCount === st.sliceCount
    ) {
      const touched = new Set<UnitView>();
      const add = (id: string | null | undefined) => {
        if (!id) return;
        for (const fj of this.registry.unitsUnder(id)) {
          const v = this.units.get(fj);
          if (v) touched.add(v);
        }
      };
      if (prev.selectedId !== st.selectedId) {
        add(prev.selectedId);
        add(st.selectedId);
      }
      if (prev.hoveredId !== st.hoveredId) {
        add(prev.hoveredId);
        add(st.hoveredId);
      }
      for (const v of touched) {
        this.computeUnit(v, st);
        this.active.add(v);
        this.batchDirty.add(v);
      }
      this.selCount = 0;
      this.hoverCount = 0;
      if (st.selectedId) for (const fj of this.registry.unitsUnder(st.selectedId)) if (this.units.get(fj)?.highlightTarget) this.selCount++;
      if (st.hoveredId) for (const fj of this.registry.unitsUnder(st.hoveredId)) if (this.units.get(fj)?.hoverTarget) this.hoverCount++;
      for (const v of touched) this.syncOutline(v);
      this.syncBatches();
      return;
    }
    for (const v of this.units.values()) {
      this.computeUnit(v, st);
      this.active.add(v);
      this.batchDirty.add(v);
    }
    this.updateSlicing(st, prev);
    for (const b of this.batches) b.opacityTarget = modeOpacity(b.units);
    this.selCount = 0;
    this.hoverCount = 0;
    for (const v of this.units.values()) {
      if (v.highlightTarget) this.selCount++;
      if (v.hoverTarget) this.hoverCount++;
    }
    for (const v of this.units.values()) this.syncOutline(v);
    this.syncBatches();
  }

  /**
   * Vertical (sagittal) slice dissection driven by the "Separate" amount. Without a selection every
   * visible structure is cut into vertical slabs that spread apart sideways; with a selection only that
   * structure is cut and everything else is ghosted.
   */
  private updateSlicing(st: ViewState, prev: ViewState | null) {
    const amount = st.explode;
    const target = st.selectedId && this.registry.get(st.selectedId) ? st.selectedId : null;
    const active = amount > 0.001;
    // Region and slab layout only change with the selection, visibility or slab count, not with hover.
    const key = active ? `${target}|${st.sliceCount ?? 12}` : '';
    const visChanged = !prev || prev.opacity !== st.opacity || prev.hidden !== st.hidden || prev.isolate !== st.isolate || prev.faded !== st.faded;
    if (!active) {
      if (this.sliceInfo) this.sliceInfo.gap = 0;
    } else if (key !== this.sliceKey || visChanged || !this.sliceInfo) {
      const box = new THREE.Box3();
      const tmp = new THREE.Box3();
      for (const v of this.units.values()) {
        if (!v.sliced || v.opacityTarget * v.baseOpacity < 0.004) continue;
        const g = v.mesh.geometry;
        if (!g.boundingBox) g.computeBoundingBox();
        v.mesh.updateMatrixWorld();
        box.union(tmp.copy(g.boundingBox!).applyMatrix4(v.mesh.matrixWorld));
      }
      if (!box.isEmpty()) {
        const width = box.max.x - box.min.x;
        const want = st.sliceCount ?? 12;
        const n = Math.max(2, Math.min(want, Math.floor(width / 0.004)));
        const h = width / n;
        this.sliceInfo = { target, y0: box.min.x - 1e-5, h: h + 2e-5 / n, n, gap: 0, box };
      }
    }
    this.sliceKey = key;
    // Wide travel: at 100% neighbouring slabs sit four slab-widths apart (≥3 cm), growing linearly with the slider.
    if (this.sliceInfo && active) this.sliceInfo.gap = amount * Math.max(this.sliceInfo.h * 4, 0.03);
    const lk = this.sliceInfo ? `${this.sliceInfo.y0.toFixed(5)}|${this.sliceInfo.h.toFixed(6)}|${this.sliceInfo.n}` : '';
    if (lk !== this.layoutKey) {
      this.layoutKey = lk;
      sliceSplitter.clearQueue();
    }
    if (this.sliceInfo) {
      this.slice.uSliceY0.value = this.sliceInfo.y0;
      this.slice.uSliceH.value = this.sliceInfo.h;
      this.slice.uSliceN.value = this.sliceInfo.n;
    }
    for (const v of this.units.values()) this.syncSliceFlag(v);
  }

  private syncSliceFlag(v: UnitView) {
    this.batchDirty.add(v);
    const on = v.sliced && !!this.sliceInfo;
    const u = v.material.userData.sliceOn as { value: number } | undefined;
    if (u) u.value = on ? 1 : 0;
    const side = on ? THREE.DoubleSide : ((v.material.userData.baseSide as THREE.Side | undefined) ?? THREE.FrontSide);
    if (v.material.side !== side) v.material.side = side;
    // Displaced slabs leave the original bounds; skip frustum culling while dissected.
    v.mesh.frustumCulled = !on;
    if (on && this.sliceInfo!.gap > 0) this.requestSplit(v);
    else this.showGeometry(v, false);
  }

  private showGeometry(v: UnitView, split: boolean) {
    const g = split && v.split ? v.split.geom : v.baseGeom;
    if (v.mesh.geometry !== g) {
      v.mesh.geometry = g;
      if (v.outline) v.outline.geometry = g;
      if (v.pre) v.pre.geometry = g;
      this.pickDirty = true;
    }
    const f = v.material.userData.sliceSplit as { value: number } | undefined;
    if (f) f.value = split && v.split ? 1 : 0;
  }

  /** Use (or start) an exact worker cut of this unit for the current slab layout. */
  private requestSplit(v: UnitView) {
    const key = this.layoutKey;
    if (v.split?.key === key) return this.showGeometry(v, true);
    if (v.split) {
      v.split.geom.dispose();
      v.split = null;
    }
    this.showGeometry(v, false);
    if (v.splitPending === key || !v.mesh.visible && v.opacityTarget <= 0) return;
    const s = this.sliceInfo!;
    v.splitPending = key;
    v.mesh.updateMatrixWorld();
    const base = v.baseGeom;
    sliceSplitter
      .split(base, v.mesh.matrixWorld, { y0: s.y0, h: s.h, n: s.n })
      .then((g) => {
        if (v.splitPending !== key || this.layoutKey !== key || v.baseGeom !== base || !this.units.has(v.fj)) {
          g.dispose();
          return;
        }
        v.splitPending = null;
        v.split = { geom: g, key };
        if (v.sliced && this.sliceInfo) this.showGeometry(v, true);
        this.onAsync?.();
      })
      .catch(() => {
        if (v.splitPending === key) v.splitPending = null;
      });
  }

  /** Slab layout of the current dissection (null when not slicing). */
  sliceState(): SliceInfo | null {
    return this.sliceInfo && this.slice.uSliceGap.value > 1e-5 ? this.sliceInfo : null;
  }

  /** Bounds of the dissected region once fully separated at `gap`. */
  slicedBounds(): THREE.Box3 | null {
    const s = this.sliceInfo;
    if (!s) return null;
    const extra = ((s.n - 1) / 2) * s.gap;
    return s.box.clone().expandByVector(new THREE.Vector3(extra, 0, 0));
  }

  private computeUnit(v: UnitView, st: ViewState) {
    const sys: SystemOpacity = st.opacity;
    let o = sys[v.system] ?? 0;
    const anc = v.ancestors;
    if (anc.some((a) => st.hidden.has(a))) o = 0;
    else if (anc.some((a) => st.faded.has(a))) o = Math.min(o, 0.14);
    if (st.isolate) {
      const inside = anc.includes(st.isolate.id);
      if (!inside) o = st.isolate.mode === 'hide' ? 0 : Math.min(o, this.opts.ghostOpacity ?? 0.07);
      else if (o === 0) o = 1; // isolating a hidden system reveals it
    }
    const slicing = st.explode > 0.001;
    const inSel = !!st.selectedId && anc.includes(st.selectedId);
    if (slicing && st.selectedId) {
      // Selected structure is dissected; the rest of the body becomes faint context.
      if (inSel) o = Math.max(o, 1);
      else o = Math.min(o, 0.035);
    }
    v.sliced = slicing && (st.selectedId ? inSel : true);
    v.opacityTarget = o;
    // Natural tissue colours while dissecting (no selection tint on the slabs).
    v.highlightTarget = inSel && !slicing ? 1 : 0;
    v.hoverTarget = st.hoveredId && anc.includes(st.hoveredId) && !v.highlightTarget && !slicing ? 1 : 0;
    v.offsetTarget.set(0, 0, 0);
  }

  /** Advance per-unit transitions. Returns true while anything is still animating. */
  update(dt: number): boolean {
    const k = 1 - Math.exp(-dt / 0.12);
    const ke = 1 - Math.exp(-dt / 0.16);
    let animating = false;
    const pulseT = (performance.now() - this.selectedAt) / 1000;
    const pulse = pulseT < 0.9 ? 1 + 0.9 * Math.sin((pulseT / 0.9) * Math.PI) : 1;
    const gapTarget = this.sliceInfo?.gap ?? 0;
    const g = this.slice.uSliceGap;
    if (Math.abs(g.value - gapTarget) > 1e-5) {
      g.value += (gapTarget - g.value) * (1 - Math.exp(-dt / 0.18));
      animating = true;
    } else if (g.value !== gapTarget) {
      g.value = gapTarget;
      if (gapTarget === 0 && this.sliceInfo) {
        // Fully closed again: drop the slab layout and restore normal rendering.
        this.sliceInfo = null;
        for (const v of this.units.values()) this.syncSliceFlag(v);
      }
      animating = true;
    }
    for (const v of this.active) {
      let dirty = false;
      if (Math.abs(v.opacity - v.opacityTarget) > 0.002) {
        v.opacity += (v.opacityTarget - v.opacity) * k;
        dirty = true;
      } else if (v.opacity !== v.opacityTarget) {
        v.opacity = v.opacityTarget;
        dirty = true;
        this.pickDirty = true;
      }
      if (Math.abs(v.highlight - v.highlightTarget) > 0.002 || (v.highlightTarget && pulseT < 1)) {
        v.highlight += (v.highlightTarget - v.highlight) * k;
        dirty = true;
      }
      if (Math.abs(v.hover - v.hoverTarget) > 0.002) {
        v.hover += (v.hoverTarget - v.hover) * k;
        dirty = true;
      }
      if (v.offset.distanceToSquared(v.offsetTarget) > 1e-10) {
        v.offset.lerp(v.offsetTarget, ke);
        v.mesh.position.copy(v.basePosition).add(v.offset);
        v.mesh.updateMatrix();
        dirty = true;
      }
      if (dirty) {
        this.syncMaterial(v, pulse);
        animating = true;
      } else if (!(v.highlightTarget && pulseT < 1)) this.active.delete(v);
    }
    for (const b of this.batches) {
      if (Math.abs(b.opacity - b.opacityTarget) > 0.002) {
        b.opacity += (b.opacityTarget - b.opacity) * k;
        animating = true;
      } else b.opacity = b.opacityTarget;
    }
    this.syncBatches();
    return animating;
  }

  private syncMaterial(v: UnitView, pulse = 1) {
    const m = v.material;
    const o = v.opacity * v.baseOpacity;
    const visible = o > 0.004;
    if (v.logicalVisible !== visible) {
      v.logicalVisible = visible;
      this.pickDirty = true;
    }
    v.mesh.visible = visible && !v.inBatch;
    const transparent = o < 0.995;
    if (m.transparent !== transparent) {
      m.transparent = transparent;
      m.needsUpdate = true;
    }
    m.opacity = o;
    const layer = LAYERED[v.system];
    m.depthWrite = !transparent || (layer ? false : o > 0.55);
    v.mesh.renderOrder = transparent ? (layer ? layer + 1 : 1) : 0;
    this.syncPrepass(v.mesh, v, transparent && !!layer && !v.sliced && v.mesh.visible && o > 0.02, layer ?? 0, () => createDepthPrepass());
    this.batchDirty.add(v);
    // Selection tints the albedo toward the accent (visible even on near-white bone) plus a soft glow.
    m.color.copy(v.baseColor).lerp(ACCENT, Math.min(0.4, v.highlight * 0.26 * pulse));
    const h = v.highlight * 0.2 * pulse;
    const hv = v.hover * 0.16;
    m.emissive.setRGB(ACCENT.r * h + HOVER.r * hv, ACCENT.g * h + HOVER.g * hv, ACCENT.b * h + HOVER.b * hv);
    // Ghosted skin reads as a light glass envelope instead of a dark film over the background.
    if (v.system === 'integumentary' && o < 0.9) m.emissive.add(v.baseColor.clone().multiplyScalar(0.4 * (1 - o)));
    this.syncOutline(v);
  }

  /** Show/hide (creating on demand) the depth pre-pass child of a unit or batch mesh. */
  private syncPrepass(mesh: THREE.Mesh, owner: { pre: THREE.Mesh | null }, on: boolean, layer: number, make: () => THREE.ShaderMaterial) {
    if (!on) {
      if (owner.pre) owner.pre.visible = false;
      return;
    }
    if (!owner.pre) {
      const pm = make();
      const pre = new THREE.Mesh(mesh.geometry, pm);
      pre.raycast = () => undefined;
      pre.name = 'depth-prepass';
      pre.matrixAutoUpdate = false;
      mesh.add(pre);
      owner.pre = pre;
    }
    const pre = owner.pre;
    pre.geometry = mesh.geometry;
    (pre.material as THREE.ShaderMaterial).side = (mesh.material as THREE.Material).side;
    pre.renderOrder = layer;
    pre.frustumCulled = mesh.frustumCulled;
    pre.visible = true;
  }

  // ---------- outlines ----------
  private outlineSel = createOutlineMaterial(ACCENT, 2.2);
  private outlineHover = createOutlineMaterial(HOVER, 1.4);
  /** Large group selections skip outlines (tint + glow remain) to keep draw calls bounded. */
  private outlineBudget = 160;
  private selCount = 0;
  private hoverCount = 0;

  private syncOutline(v: UnitView) {
    const want = v.mesh.visible && !v.sliced && ((v.highlightTarget > 0 && this.selCount <= this.outlineBudget) || (v.hoverTarget > 0 && this.hoverCount <= this.outlineBudget));
    if (!want) {
      if (v.outline) v.outline.visible = false;
      return;
    }
    if (!v.outline) {
      const o = new THREE.Mesh(v.mesh.geometry, this.outlineSel);
      o.raycast = () => undefined;
      o.renderOrder = 1.5;
      o.name = 'outline';
      v.mesh.add(o);
      v.outline = o;
    }
    v.outline.geometry = v.mesh.geometry;
    v.outline.material = v.highlightTarget > 0 ? this.outlineSel : this.outlineHover;
    v.outline.visible = true;
  }

  setResolution(w: number, h: number) {
    this.outlineSel.uniforms.resolution!.value.set(w, h);
    this.outlineHover.uniforms.resolution!.value.set(w, h);
  }

  private refreshPickables() {
    if (!this.pickDirty) return;
    this.pickables = [];
    for (const v of this.units.values()) if (v.logicalVisible && v.opacityTarget * v.baseOpacity >= PICK_MIN_OPACITY) this.pickables.push(v.mesh);
    this.pickDirty = false;
  }

  private bvhQueue: THREE.Mesh[] = [];
  private bvhScheduled = false;
  /**
   * Build picking BVHs in idle time (small time slices) so the first tap on a phone does not stall
   * while acceleration structures for hundreds of meshes are built at once.
   */
  warmBvh() {
    this.refreshPickables();
    this.bvhQueue = this.pickables.filter((m) => !m.geometry.boundsTree);
    if (this.bvhScheduled || !this.bvhQueue.length) return;
    this.bvhScheduled = true;
    const ric: (cb: (d: { timeRemaining(): number }) => void) => void =
      (window as unknown as { requestIdleCallback?: typeof ric }).requestIdleCallback?.bind(window) ?? ((cb) => window.setTimeout(() => cb({ timeRemaining: () => 8 }), 16));
    const step = (d: { timeRemaining(): number }) => {
      while (this.bvhQueue.length && d.timeRemaining() > 3) {
        const m = this.bvhQueue.pop()!;
        if (!m.geometry.boundsTree) m.geometry.computeBoundsTree();
      }
      if (this.bvhQueue.length) ric(step);
      else this.bvhScheduled = false;
    };
    ric(step);
  }

  private ensureBvh(meshes: THREE.Mesh[]) {
    for (const m of meshes) if (!m.geometry.boundsTree) m.geometry.computeBoundsTree();
  }

  /** Bounding-sphere ray prefilter; sliced meshes get their sphere stretched by the slab spread. */
  private candidates(ray: THREE.Ray): THREE.Mesh[] {
    const s = new THREE.Sphere();
    const sl = this.sliceState();
    const spread = sl ? ((sl.n - 1) / 2) * this.slice.uSliceGap.value : 0;
    return this.pickables.filter((m) => {
      const v = this.units.get(m.userData.fj as string);
      if (v && !v.wsphere) {
        if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
        m.updateMatrixWorld();
        v.wsphere = m.geometry.boundingSphere!.clone().applyMatrix4(m.matrixWorld);
      }
      if (v?.wsphere) s.copy(v.wsphere);
      else {
        if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
        s.copy(m.geometry.boundingSphere!).applyMatrix4(m.matrixWorld);
      }
      if (spread && v?.sliced) s.radius += spread;
      return ray.intersectsSphere(s);
    });
  }

  /**
   * Raycast that understands the slice dissection: sliced meshes are tested once per slab with the
   * ray shifted by that slab's offset, keeping only hits that fall inside the slab.
   */
  private intersect(cand: THREE.Mesh[]): THREE.Intersection[] {
    const sl = this.sliceState();
    if (!sl) return this.raycaster.intersectObjects(cand, false);
    const sliced = cand.filter((m) => this.units.get(m.userData.fj as string)?.sliced);
    const rest = cand.filter((m) => !this.units.get(m.userData.fj as string)?.sliced);
    const out = rest.length ? this.raycaster.intersectObjects(rest, false) : [];
    if (sliced.length) {
      const ray = this.raycaster.ray;
      const o0 = ray.origin.clone();
      const prev = this.raycaster.firstHitOnly;
      this.raycaster.firstHitOnly = false;
      for (let k = 0; k < sl.n; k++) {
        const off = (k - (sl.n - 1) / 2) * this.slice.uSliceGap.value;
        ray.origin.copy(o0);
        ray.origin.x -= off;
        const lo = sl.y0 + k * sl.h;
        const hi = lo + sl.h;
        for (const h of this.raycaster.intersectObjects(sliced, false)) {
          if (h.point.x < lo || h.point.x >= hi) continue;
          h.point.x += off;
          h.distance = h.point.distanceTo(o0);
          out.push(h);
        }
      }
      ray.origin.copy(o0);
      this.raycaster.firstHitOnly = prev;
    }
    return out.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Pick at normalised device coordinates. Thin structures (nerves, small vessels) are hard to
   * hit with a single ray, so when the centre ray misses we sample a small ring of rays.
   */
  pick(ndc: THREE.Vector2, camera: THREE.Camera, ringPx = 0, viewportPx = new THREE.Vector2(1, 1), build = true): PickHit | null {
    this.refreshPickables();
    const tryRay = (x: number, y: number): PickHit | null => {
      this.raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      // Bounding-sphere prefilter so BVHs are only built for candidate meshes.
      let cand = this.candidates(this.raycaster.ray);
      // Hover and zoom pivots never build acceleration structures on the spot (that stalls a frame on
      // phones); meshes still waiting for their idle-time BVH are skipped and the caller falls back.
      if (!build) cand = cand.filter((m) => !!m.geometry.boundsTree);
      if (!cand.length) return null;
      this.ensureBvh(cand);
      const hits = this.intersect(cand);
      const h = hits[0];
      if (!h) return null;
      const fj = h.object.userData.fj as string;
      return { fj, structureId: this.units.get(fj)!.structureId, point: h.point.clone(), distance: h.distance };
    };
    const c = tryRay(ndc.x, ndc.y);
    if (c || ringPx <= 0) return c;
    let best: PickHit | null = null;
    for (const rpx of [ringPx * 0.5, ringPx]) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const h = tryRay(ndc.x + (Math.cos(a) * rpx * 2) / viewportPx.x, ndc.y + (Math.sin(a) * rpx * 2) / viewportPx.y);
        if (h && (!best || h.distance < best.distance)) best = h;
      }
      if (best) return best;
    }
    return null;
  }

  /** All distinct structures under a screen point, nearest first (for click-to-drill-through). */
  pickAll(ndc: THREE.Vector2, camera: THREE.Camera, max = 8): PickHit[] {
    this.refreshPickables();
    this.raycaster.setFromCamera(ndc, camera);
    const cand = this.candidates(this.raycaster.ray);
    this.ensureBvh(cand);
    const prev = this.raycaster.firstHitOnly;
    this.raycaster.firstHitOnly = false;
    const out: PickHit[] = [];
    const seen = new Set<string>();
    for (const m of cand) {
      const h = this.intersect([m])[0];
      if (!h) continue;
      const fj = m.userData.fj as string;
      const sid = this.units.get(fj)!.structureId;
      out.push({ fj, structureId: sid, point: h.point.clone(), distance: h.distance });
    }
    this.raycaster.firstHitOnly = prev;
    out.sort((a, b) => a.distance - b.distance);
    return out.filter((h) => (seen.has(h.structureId) ? false : (seen.add(h.structureId), true))).slice(0, max);
  }

  /** First pickable structure hit along an arbitrary ray (used for occlusion checks). */
  firstHit(origin: THREE.Vector3, dir: THREE.Vector3, maxDist: number): PickHit | null {
    this.refreshPickables();
    this.raycaster.set(origin, dir.clone().normalize());
    this.raycaster.far = maxDist;
    const cand = this.candidates(this.raycaster.ray);
    this.ensureBvh(cand);
    const h = this.intersect(cand)[0];
    this.raycaster.far = Infinity;
    if (!h) return null;
    const fj = h.object.userData.fj as string;
    return { fj, structureId: this.units.get(fj)!.structureId, point: h.point.clone(), distance: h.distance };
  }

  /** World-space bounds of currently visible units within a node (uses live, possibly exploded, positions). */
  liveBounds(id: string): THREE.Box3 | null {
    const box = new THREE.Box3();
    const tmp = new THREE.Box3();
    let any = false;
    for (const fj of this.registry.unitsUnder(id)) {
      const v = this.units.get(fj);
      if (!v) continue;
      const g = v.mesh.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      v.mesh.updateMatrixWorld();
      tmp.copy(g.boundingBox!).applyMatrix4(v.mesh.matrixWorld);
      box.union(tmp);
      any = true;
    }
    return any ? box : null;
  }

  // ---------- shader warm-up ----------
  private warm: THREE.Group | null = null;
  /**
   * Compile every shader variant the model will need while its meshes are still downloading:
   * one material per distinct look (unit and merged-batch versions, opaque and translucent), drawn
   * off-screen. With KHR_parallel_shader_compile this runs off the main thread; without it the cost
   * still overlaps the network instead of freezing the first frame after loading.
   */
  prewarm(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): Promise<void> {
    if (this.warm) return Promise.resolve();
    const seen = new Set<string>();
    const group = new THREE.Group();
    group.position.set(0, -1000, 0);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.001, 0, 0, 0, 0.001, 0], 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 1, 1, 1, 1, 1, 1], 3));
    geo.setAttribute('aDetailAxis', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    geo.setAttribute('aUnit', new THREE.Float32BufferAttribute([0, 0, 0], 1));
    geo.setAttribute('aSlab', new THREE.Float32BufferAttribute([0, 0, 0], 1));
    const tex = new THREE.DataTexture(new Uint8Array(256), 256, 1, THREE.RedFormat, THREE.UnsignedByteType);
    tex.needsUpdate = true;
    const female = this.registry.model === 'female';
    for (const rec of this.registry.structures.values()) {
      if (rec.kind !== 'structure' || !rec.units?.length) continue;
      const probe = createUnitMaterial(rec.system, rec.name, 'warm', this.tier, !!rec.landmark, female, this.slice);
      const key = `${rec.system}|${materialKey(probe)}`;
      if (seen.has(key)) {
        probe.dispose();
        continue;
      }
      seen.add(key);
      const mats: THREE.Material[] = [probe];
      const t = createUnitMaterial(rec.system, rec.name, 'warm', this.tier, !!rec.landmark, female, this.slice);
      t.transparent = true;
      t.opacity = 0.5;
      mats.push(t);
      if (this.opts.batch) {
        for (const transparent of [false, true]) {
          const bm = makeBatchMaterial(createUnitMaterial(rec.system, rec.name, 'warm', this.tier, !!rec.landmark, female), tex, 256);
          bm.transparent = transparent;
          mats.push(bm);
        }
      }
      for (const m of mats) {
        const mesh = new THREE.Mesh(geo, m);
        mesh.frustumCulled = false;
        group.add(mesh);
      }
    }
    this.warm = group;
    return gl
      .compileAsync(group, camera, scene)
      .catch(() => undefined)
      .then(() => undefined);
    // The warm-up materials stay referenced for the session so translucent/opaque variants are never
    // released and recompiled when layers fade in and out (they are tiny and never drawn).
  }

  /** Drop warm-up meshes (their programs stay cached while real materials use them). */
  releaseWarmup() {
    const g = this.warm;
    if (!g) return;
    for (const c of g.children) ((c as THREE.Mesh).material as THREE.Material).dispose();
    this.warm = null;
  }

  // ---------- merged batches ----------
  private buildBatches(system: SystemId, views: UnitView[]) {
    const groups = new Map<string, UnitView[]>();
    for (const v of views) {
      if (v.material.userData.overlay) continue;
      const k = `${system}|${materialKey(v.material)}`;
      let g = groups.get(k);
      if (!g) groups.set(k, (g = []));
      g.push(v);
    }
    for (const [key, units] of groups) {
      if (units.length < 2) continue;
      const mu: MergeUnit[] = units.map((v) => {
        const p = flatAttr(v.loGeometry.getAttribute('position') as THREE.BufferAttribute);
        const na = v.loGeometry.getAttribute('normal') as THREE.BufferAttribute | undefined;
        const n = na ? flatAttr(na) : null;
        const idx = v.loGeometry.index ? ((v.loGeometry.index.array as Uint16Array | Uint32Array).slice() as Uint16Array | Uint32Array) : null;
        const m = new THREE.Matrix4().compose(v.loTransform.position, v.loTransform.quaternion, v.loTransform.scale);
        const ax = (v.material.userData.detail as { uDetailAxis?: { value: THREE.Vector3 } } | undefined)?.uDetailAxis?.value ?? new THREE.Vector3(0, 1, 0);
        return { pos: p.arr, posNorm: p.norm, posSize: p.size, nrm: n?.arr ?? null, nrmNorm: n?.norm ?? false, idx, m: m.toArray(), color: [v.baseColor.r, v.baseColor.g, v.baseColor.b], axis: [ax.x, ax.y, ax.z] };
      });
      this.pendingMerges++;
      this.onBatchProgress?.(this.pendingMerges);
      const done = () => {
        this.pendingMerges--;
        this.onBatchProgress?.(this.pendingMerges);
      };
      const verts = mu.reduce((a, u) => a + (u.pos as Float32Array).length / u.posSize, 0);
      // Small groups (and machines with few cores) merge on the main thread in idle slices: no worker
      // round trip, and nothing waits behind the big systems in the worker queue.
      const inline = verts < 40000 || (navigator.hardwareConcurrency ?? 4) <= 2;
      const merged: Promise<MergeResult> = inline
        ? new Promise((resolve, reject) =>
            idle(() => {
              try {
                resolve(mergeUnits({ kind: 'merge', id: 0, units: mu }));
              } catch (e) {
                reject(e);
              }
            }),
          )
        : sliceSplitter.merge(mu).catch(() => mergeUnits({ kind: 'merge', id: 0, units: mu.map((u) => ({ ...u })) }));
      merged
        .then((r) => this.addBatch(key, system, units, r))
        .catch((e: unknown) => console.warn('batch build failed', e))
        .finally(done);
    }
  }

  private addBatch(key: string, system: SystemId, units: UnitView[], r: MergeResult) {
    if (units.some((v) => !this.units.has(v.fj))) return; // scene disposed / model switched meanwhile
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(r.pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(r.nrm, 3, true));
    g.setAttribute('color', new THREE.BufferAttribute(r.color, 3, true));
    g.setAttribute('aDetailAxis', new THREE.BufferAttribute(r.axis, 3, true));
    g.setAttribute('aUnit', new THREE.BufferAttribute(r.unit, 1, false));
    g.setIndex(new THREE.BufferAttribute(r.idx, 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    const W = 256;
    const H = Math.ceil(units.length / W);
    const mask = new Uint8Array(W * H);
    const tex = new THREE.DataTexture(mask, W, H, THREE.RedFormat, THREE.UnsignedByteType);
    tex.magFilter = tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    const rep = units[0]!;
    const repRec = this.registry.get(rep.structureId);
    const mat = makeBatchMaterial(
      createUnitMaterial(system, repRec?.name ?? '', key, this.tier, !!repRec?.landmark, this.registry.model === 'female'),
      tex,
      W,
    );
    const mesh = new THREE.Mesh(g, mat);
    mesh.name = `batch:${system}`;
    mesh.matrixAutoUpdate = false;
    mesh.raycast = () => undefined;
    const tint = new THREE.Color(0, 0, 0);
    for (const v of units) tint.add(v.baseColor);
    tint.multiplyScalar(1 / units.length);
    const b: Batch = {
      key,
      system,
      mesh,
      material: mat,
      units,
      mask,
      maskTex: tex,
      maskDirty: false,
      opacityTarget: modeOpacity(units),
      opacity: median(units.map((v) => v.opacity)),
      baseOpacity: (mat.userData.baseOpacity as number | undefined) ?? 1,
      tint,
      members: 0,
      syncedOpacity: -1,
      syncedTarget: -1,
      pre: null,
    };
    units.forEach((v, i) => {
      v.batch = b;
      v.batchIndex = i;
      this.batchDirty.add(v);
    });
    this.batches.push(b);
    this.root.add(mesh);
    this.syncBatches();
    this.onAsync?.();
  }

  private batchable(v: UnitView, b: Batch) {
    return (
      !v.sliced &&
      v.mesh.geometry === v.loGeometry &&
      !this.hiActive.has(v.fj) &&
      v.highlightTarget === 0 &&
      v.highlight < 0.002 &&
      v.hoverTarget === 0 &&
      v.hover < 0.002 &&
      v.opacityTarget === b.opacityTarget &&
      Math.abs(v.opacity - b.opacity) < 0.012 &&
      !v.material.wireframe
    );
  }

  /** Move units between their batch and their own mesh as their state diverges or converges. */
  private syncBatches() {
    // A batch whose opacity moved re-checks all members; otherwise only units that changed are visited.
    for (const b of this.batches) {
      if (b.opacity !== b.syncedOpacity || b.opacityTarget !== b.syncedTarget) {
        b.syncedOpacity = b.opacity;
        b.syncedTarget = b.opacityTarget;
        for (const v of b.units) this.batchDirty.add(v);
      }
    }
    for (const v of this.batchDirty) {
      const b = v.batch;
      if (!b) continue;
      const want = this.batchable(v, b);
      if (want !== v.inBatch) {
        v.inBatch = want;
        b.mask[v.batchIndex] = want ? 255 : 0;
        b.maskDirty = true;
        b.members += want ? 1 : -1;
        v.mesh.visible = v.logicalVisible && !want;
        if (v.pre && !v.mesh.visible) v.pre.visible = false;
        // Drawn by the batch from now on: free the unit's own GPU buffers (re-uploaded on demand).
        if (want && !v.gpuFreed) {
          v.gpuFreed = true;
          v.loGeometry.dispose();
        }
        if (!want) this.syncMaterial(v);
      }
    }
    this.batchDirty.clear();
    for (const b of this.batches) {
      if (b.maskDirty) {
        b.maskTex.needsUpdate = true;
        b.maskDirty = false;
      }
      const m = b.material;
      const o = b.opacity * b.baseOpacity;
      b.mesh.visible = b.members > 0 && o > 0.004;
      const transparent = o < 0.995;
      if (m.transparent !== transparent) {
        m.transparent = transparent;
        m.needsUpdate = true;
      }
      m.opacity = o;
      const layer = LAYERED[b.system];
      m.depthWrite = !transparent || (layer ? false : o > 0.55);
      b.mesh.renderOrder = transparent ? (layer ? layer + 1 : 1) : 0;
      this.syncPrepass(b.mesh, b, transparent && !!layer && b.mesh.visible && o > 0.02 && !this.sliceInfo, layer ?? 0, () => createDepthPrepass({ tex: b.maskTex, w: 256 }));
      m.emissive.setRGB(0, 0, 0);
      if (b.system === 'integumentary' && o < 0.9) m.emissive.copy(b.tint).multiplyScalar(0.4 * (1 - o));
    }
  }

  /** Draw-call diagnostics: [merged batches drawn, units drawn on their own]. */
  batchStats(): [number, number] {
    let solo = 0;
    for (const v of this.units.values()) if (v.mesh.visible) solo++;
    return [this.batches.filter((b) => b.mesh.visible).length, solo];
  }

  dispose() {
    // Geometries are shared with the model library (and other viewports); only materials are owned here.
    for (const v of this.units.values()) {
      v.material.dispose();
      v.split?.geom.dispose();
    }
    for (const b of this.batches) {
      b.mesh.geometry.dispose();
      b.material.dispose();
      b.maskTex.dispose();
      (b.pre?.material as THREE.Material | undefined)?.dispose();
    }
    for (const v of this.units.values()) (v.pre?.material as THREE.Material | undefined)?.dispose();
    this.active.clear();
    this.batchDirty.clear();
    this.batches = [];
    this.releaseWarmup();
    this.outlineSel.dispose();
    this.outlineHover.dispose();
    this.units.clear();
    this.root.clear();
  }
}

function modeOpacity(units: UnitView[]): number {
  const c = new Map<number, number>();
  let best = 0;
  let bestN = -1;
  for (const v of units) {
    const n = (c.get(v.opacityTarget) ?? 0) + 1;
    c.set(v.opacityTarget, n);
    if (n > bestN) {
      bestN = n;
      best = v.opacityTarget;
    }
  }
  return best;
}

function median(a: number[]): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[s.length >> 1]!;
}
