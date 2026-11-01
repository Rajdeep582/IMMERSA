import * as THREE from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import type { Registry } from '../data/registry';
import type { SystemOpacity } from '../data/systems';
import type { SystemId } from '../data/types';
import type { AppState } from '../state/store';
import { ACCENT, HOVER, createOutlineMaterial, createSliceUniforms, createUnitMaterial, setDetailAxis } from './materials';
import type { LoadedUnit } from './models';
import { sliceSplitter } from './sliceSplitter';

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
}

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

  constructor(
    private registry: Registry,
    tier: 'low' | 'medium' | 'high',
    private opts: { ghostOpacity?: number } = {},
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

  addUnits(system: SystemId, loaded: Map<string, LoadedUnit>, filter?: (fj: string) => boolean) {
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
      mesh.matrixAutoUpdate = true;
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
      };
      this.units.set(u.fj, view);
      this.root.add(mesh);
      if (this.state) this.computeUnit(view, this.state);
      this.syncSliceFlag(view);
      // Newly arrived meshes fade in rather than popping.
      view.opacity = 0;
      this.syncMaterial(view);
    }
    this.pickDirty = true;
    // Structures that arrive while dissecting join the slab layout (recompute the region).
    if (this.state && this.state.explode > 0.001) {
      this.sliceKey = '';
      this.updateSlicing(this.state, this.state);
    }
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
    if (v.outline) v.outline.geometry = v.mesh.geometry;
    this.pickDirty = true;
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
    for (const v of this.units.values()) this.computeUnit(v, st);
    this.updateSlicing(st, prev);
    this.selCount = 0;
    this.hoverCount = 0;
    for (const v of this.units.values()) {
      if (v.highlightTarget) this.selCount++;
      if (v.hoverTarget) this.hoverCount++;
    }
    for (const v of this.units.values()) this.syncOutline(v);
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
    for (const v of this.units.values()) {
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
        dirty = true;
      }
      if (dirty) {
        this.syncMaterial(v, pulse);
        animating = true;
      }
    }
    return animating;
  }

  private syncMaterial(v: UnitView, pulse = 1) {
    const m = v.material;
    const o = v.opacity * v.baseOpacity;
    const visible = o > 0.004;
    if (v.mesh.visible !== visible) {
      v.mesh.visible = visible;
      this.pickDirty = true;
    }
    const transparent = o < 0.995;
    if (m.transparent !== transparent) {
      m.transparent = transparent;
      m.needsUpdate = true;
    }
    m.opacity = o;
    m.depthWrite = o > 0.55;
    v.mesh.renderOrder = transparent ? 1 : 0;
    // Selection tints the albedo toward the accent (visible even on near-white bone) plus a soft glow.
    m.color.copy(v.baseColor).lerp(ACCENT, Math.min(0.4, v.highlight * 0.26 * pulse));
    const h = v.highlight * 0.2 * pulse;
    const hv = v.hover * 0.16;
    m.emissive.setRGB(ACCENT.r * h + HOVER.r * hv, ACCENT.g * h + HOVER.g * hv, ACCENT.b * h + HOVER.b * hv);
    // Ghosted skin reads as a light glass envelope instead of a dark film over the background.
    if (v.system === 'integumentary' && o < 0.9) m.emissive.add(v.baseColor.clone().multiplyScalar(0.4 * (1 - o)));
    this.syncOutline(v);
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
      o.renderOrder = 2;
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
    for (const v of this.units.values()) if (v.mesh.visible && v.opacityTarget * v.baseOpacity >= PICK_MIN_OPACITY) this.pickables.push(v.mesh);
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
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      s.copy(m.geometry.boundingSphere!).applyMatrix4(m.matrixWorld);
      if (spread && this.units.get(m.userData.fj as string)?.sliced) s.radius += spread;
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
  pick(ndc: THREE.Vector2, camera: THREE.Camera, ringPx = 0, viewportPx = new THREE.Vector2(1, 1)): PickHit | null {
    this.refreshPickables();
    const tryRay = (x: number, y: number): PickHit | null => {
      this.raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      // Bounding-sphere prefilter so BVHs are only built for candidate meshes.
      const cand = this.candidates(this.raycaster.ray);
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

  dispose() {
    // Geometries are shared with the model library (and other viewports); only materials are owned here.
    for (const v of this.units.values()) {
      v.material.dispose();
      v.split?.geom.dispose();
    }
    this.outlineSel.dispose();
    this.outlineHover.dispose();
    this.units.clear();
    this.root.clear();
  }
}
