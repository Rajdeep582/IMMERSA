import * as THREE from 'three';
import type { Registry } from '../data/registry';
import type { CameraPose } from '../data/types';
import { useApp } from '../state/store';
import type { AnatomyScene } from './anatomyScene';
import { HOME_POSE, STANDARD_VIEWS, poseForBox, type CameraRig } from './cameraRig';

/**
 * Narrow command surface between UI controls and the main 3D viewport. Controls call these
 * methods; they never touch the camera or scene graph directly.
 */
class ViewerApi {
  rig: CameraRig | null = null;
  scene: AnatomyScene | null = null;
  /** Renderer handles for diagnostics (benchmarks, console). */
  debug: { gl: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera } | null = null;
  registry: Registry | null = null;
  invalidate: () => void = () => undefined;
  /** Per-frame hooks (DOM overlays that track 3D positions). */
  frameListeners = new Set<(cam: THREE.PerspectiveCamera) => void>();
  /** Camera pose carried across a male/female model switch. */
  lastPose: CameraPose | null = null;
  get resumedFromSwitch() {
    return this.lastPose !== null;
  }

  attach(rig: CameraRig, scene: AnatomyScene, registry: Registry, invalidate: () => void) {
    this.rig = rig;
    this.scene = scene;
    this.registry = registry;
    this.invalidate = invalidate;
  }
  detach() {
    this.rig = null;
    this.scene = null;
  }

  flyTo(pose: CameraPose, opts?: { duration?: number; arc?: boolean }) {
    this.rig?.flyTo(pose, opts);
    this.invalidate();
  }

  home() {
    this.flyTo(HOME_POSE);
  }

  /** Full-body framing that keeps the current viewing direction. */
  fullBody() {
    if (!this.rig) return;
    const p = this.rig.pose;
    this.flyTo({ target: HOME_POSE.target, radius: HOME_POSE.radius, theta: p.theta, phi: THREE.MathUtils.clamp(p.phi, 0.3 * Math.PI, 0.62 * Math.PI) });
  }

  standardView(id: string) {
    const v = STANDARD_VIEWS.find((x) => x.id === id);
    if (!v || !this.rig) return;
    const p = this.rig.pose;
    this.flyTo({ target: p.target, radius: p.radius, theta: v.theta, phi: v.phi });
  }

  zoom(factor: number) {
    if (!this.rig) return;
    this.rig.dollyAt(factor, null);
    this.invalidate();
  }

  /** Frame the slice dissection once separated; `elevate` turns to a front-oblique view so the cut faces show. */
  frameSlices(elevate = false) {
    const rig = this.rig;
    const b = this.scene?.slicedBounds();
    if (!rig || !b || b.isEmpty()) return;
    const pose = poseForBox([b.min.toArray(), b.max.toArray()] as [[number, number, number], [number, number, number]], rig.pose, rig.camera, {
      margin: 1.35,
      outward: false,
      // Vertical slabs separate along x: view from the front, slightly turned so the cut faces show.
      theta: elevate ? 0.42 : undefined,
      phi: elevate ? Math.PI * 0.44 : undefined,
    });
    // Widely separated slabs can need more distance than the normal zoom-out limit.
    rig.maxRadius = Math.max(7, pose.radius * 1.25);
    this.flyTo(pose, { arc: false });
  }

  /** Smoothly frame a registry node, revealing its system if hidden. */
  focus(id: string, opts: { margin?: number; theta?: number; phi?: number } = {}): CameraPose | undefined {
    const reg = this.registry;
    const rig = this.rig;
    const rec = reg?.get(id);
    if (!reg || !rig || !rec) return undefined;
    const st = useApp.getState();
    if ((st.opacity[rec.system] ?? 0) < 0.3) st.setOpacity(rec.system, 1);
    const hiddenAnc = reg.ancestorIds(id).filter((a) => st.hidden.has(a));
    for (const a of hiddenAnc) st.toggleHidden(a);
    const live = this.scene?.liveBounds(id);
    const box = live && !live.isEmpty() ? ([live.min.toArray(), live.max.toArray()] as [[number, number, number], [number, number, number]]) : rec.bbox;
    const posterior = /vertebra|disk|sacrum|coccyx|back|spinal|glute|trapezius|latissimus|rhomboid|occipital|cerebell/i.test(rec.name) || /back/.test(id);
    let theta = opts.theta;
    if (theta === undefined && posterior && rec.kind !== 'system') {
      // Approach the dorsal side, choosing whichever posterolateral side is closer to the current view.
      const cur = rig.pose.theta;
      const a = Math.PI * 0.78;
      const cands = [a, -a, Math.PI];
      const wrapd = (x: number) => Math.abs(((((x - cur + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI);
      theta = cands.sort((p, q) => wrapd(p) - wrapd(q))[0]!;
      theta = cur + ((((theta - cur + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
    }
    const pose = poseForBox(box, rig.pose, rig.camera, { margin: opts.margin ?? (rec.kind === 'structure' ? 1.35 : 1.15), theta, phi: opts.phi });
    this.flyTo(pose);
    return pose;
  }

  /**
   * True when other opaque anatomy blocks the line of sight from a pose to the node's centre.
   * Needs the node's own meshes to be loaded; returns false when unsure.
   */
  isOccluded(id: string, pose: CameraPose): boolean {
    const reg = this.registry;
    const sc = this.scene;
    if (!reg || !sc) return false;
    const c = new THREE.Vector3(...reg.center(id));
    const dir = new THREE.Vector3(Math.sin(pose.phi) * Math.sin(pose.theta), Math.cos(pose.phi), Math.sin(pose.phi) * Math.cos(pose.theta));
    const eye = new THREE.Vector3(...pose.target).addScaledVector(dir, pose.radius);
    const to = c.clone().sub(eye);
    const h = sc.firstHit(eye, to, to.length() * 0.98);
    if (!h) return false;
    return !reg.isAncestorOrSelf(id, h.structureId) && reg.get(h.structureId)?.system !== 'integumentary';
  }

  /** Select + frame a node; offers to ghost occluding anatomy when the target is hidden behind it. */
  selectAndFocus(id: string) {
    const st = useApp.getState();
    st.select(id);
    // Show details beside the model on tablet/desktop (phones open the details sheet instead).
    if (st.layout !== 'phone' && !st.rightOpen && !st.immersive && !st.guided) st.setRightOpen(true);
    const pose = this.focus(id);
    if (!pose) return;
    window.setTimeout(() => {
      if (useApp.getState().selectedId !== id || useApp.getState().isolate) return;
      if (this.isOccluded(id, pose)) {
        const name = this.registry?.get(id)?.name ?? 'This structure';
        useApp.getState().showHint(`${name} is behind other structures from this angle.`, { label: 'Ghost others', kind: 'ghost-others', target: id });
      }
    }, 450);
  }
}

export const viewer = new ViewerApi();
