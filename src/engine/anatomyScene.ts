import * as THREE from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import type { Registry } from '../data/registry';
import type { SystemOpacity } from '../data/systems';
import type { SystemId } from '../data/types';
import type { AppState } from '../state/store';
import { ACCENT, HOVER, createOutlineMaterial, createUnitMaterial } from './materials';
import type { LoadedUnit } from './models';

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
}

export interface PickHit {
  fj: string;
  structureId: string;
  point: THREE.Vector3;
  distance: number;
}

export type ViewState = Pick<AppState, 'opacity' | 'hidden' | 'faded' | 'isolate' | 'selectedId' | 'hoveredId' | 'explode'>;

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
      const material = createUnitMaterial(system, name, u.fj, this.tier, !!this.registry.get(sid)?.landmark);
      const mesh = new THREE.Mesh(u.geometry, material);
      mesh.name = u.fj;
      mesh.position.copy(u.position);
      mesh.quaternion.copy(u.quaternion);
      mesh.scale.copy(u.scale);
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
      };
      this.units.set(u.fj, view);
      this.root.add(mesh);
      if (this.state) this.computeUnit(view, this.state);
      // Newly arrived meshes fade in rather than popping.
      view.opacity = 0;
      this.syncMaterial(view);
    }
    this.pickDirty = true;
  }

  /** Swap a unit to a full-resolution geometry (same transform frame), or back to body LOD with null. */
  setUnitGeometry(fj: string, geom: THREE.BufferGeometry | null, transform?: LoadedUnit) {
    const v = this.units.get(fj);
    if (!v) return;
    if (geom && transform) {
      v.mesh.geometry = geom;
      v.mesh.scale.copy(transform.scale);
      v.basePosition.copy(transform.position);
      v.mesh.quaternion.copy(transform.quaternion);
      this.hiActive.set(fj, geom);
    } else {
      v.mesh.geometry = v.loGeometry;
      v.mesh.scale.copy(v.loTransform.scale);
      v.mesh.quaternion.copy(v.loTransform.quaternion);
      v.basePosition.copy(v.loTransform.position);
      this.hiActive.delete(fj);
    }
    v.mesh.position.copy(v.basePosition).add(v.offset);
    if (v.outline) v.outline.geometry = v.mesh.geometry;
    this.pickDirty = true;
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
    this.state = st;
    if (st.selectedId !== prevSel) this.selectedAt = performance.now();
    // Explode: children of the selected node fan out from its centre.
    const explodeMap = new Map<string, THREE.Vector3>();
    const sel = this.registry.get(st.selectedId);
    if (sel && sel.kind !== 'structure' && sel.children.length > 1 && st.explode > 0.001) {
      const g = new THREE.Vector3(...this.registry.center(sel.id));
      for (const c of sel.children) {
        const cc = new THREE.Vector3(...this.registry.center(c)).sub(g).multiplyScalar(st.explode * 1.1);
        explodeMap.set(c, cc);
      }
    }
    for (const v of this.units.values()) this.computeUnit(v, st, explodeMap);
    this.selCount = 0;
    this.hoverCount = 0;
    for (const v of this.units.values()) {
      if (v.highlightTarget) this.selCount++;
      if (v.hoverTarget) this.hoverCount++;
    }
    for (const v of this.units.values()) this.syncOutline(v);
  }

  private computeUnit(v: UnitView, st: ViewState, explodeMap?: Map<string, THREE.Vector3>) {
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
    v.opacityTarget = o;
    v.highlightTarget = st.selectedId && anc.includes(st.selectedId) ? 1 : 0;
    v.hoverTarget = st.hoveredId && anc.includes(st.hoveredId) && !v.highlightTarget ? 1 : 0;
    v.offsetTarget.set(0, 0, 0);
    if (explodeMap && explodeMap.size) {
      for (const a of anc) {
        const off = explodeMap.get(a);
        if (off) {
          v.offsetTarget.copy(off);
          break;
        }
      }
    }
  }

  /** Advance per-unit transitions. Returns true while anything is still animating. */
  update(dt: number): boolean {
    const k = 1 - Math.exp(-dt / 0.12);
    const ke = 1 - Math.exp(-dt / 0.16);
    let animating = false;
    const pulseT = (performance.now() - this.selectedAt) / 1000;
    const pulse = pulseT < 0.9 ? 1 + 0.9 * Math.sin((pulseT / 0.9) * Math.PI) : 1;
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
    const want = v.mesh.visible && ((v.highlightTarget > 0 && this.selCount <= this.outlineBudget) || (v.hoverTarget > 0 && this.hoverCount <= this.outlineBudget));
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

  private ensureBvh(meshes: THREE.Mesh[]) {
    for (const m of meshes) if (!m.geometry.boundsTree) m.geometry.computeBoundsTree();
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
      const ray = this.raycaster.ray;
      const s = new THREE.Sphere();
      const cand: THREE.Mesh[] = [];
      for (const m of this.pickables) {
        if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
        s.copy(m.geometry.boundingSphere!).applyMatrix4(m.matrixWorld);
        if (ray.intersectsSphere(s)) cand.push(m);
      }
      if (!cand.length) return null;
      this.ensureBvh(cand);
      const hits = this.raycaster.intersectObjects(cand, false);
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
    const ray = this.raycaster.ray;
    const s = new THREE.Sphere();
    const cand = this.pickables.filter((m) => {
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      s.copy(m.geometry.boundingSphere!).applyMatrix4(m.matrixWorld);
      return ray.intersectsSphere(s);
    });
    this.ensureBvh(cand);
    const prev = this.raycaster.firstHitOnly;
    this.raycaster.firstHitOnly = false;
    const out: PickHit[] = [];
    const seen = new Set<string>();
    for (const m of cand) {
      const h = this.raycaster.intersectObject(m, false)[0];
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
    const s = new THREE.Sphere();
    const cand = this.pickables.filter((m) => {
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      s.copy(m.geometry.boundingSphere!).applyMatrix4(m.matrixWorld);
      return this.raycaster.ray.intersectsSphere(s);
    });
    this.ensureBvh(cand);
    const h = this.raycaster.intersectObjects(cand, false)[0];
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
    for (const v of this.units.values()) v.material.dispose();
    this.outlineSel.dispose();
    this.outlineHover.dispose();
    this.units.clear();
    this.root.clear();
  }
}
