import * as THREE from 'three';
import type { Box3Tuple, CameraPose, Vec3 } from '../data/types';

const TAU = Math.PI * 2;
const wrap = (a: number) => ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface RigState {
  target: THREE.Vector3;
  logR: number;
  theta: number;
  phi: number;
}

interface Tween {
  from: RigState;
  to: RigState;
  t: number;
  dur: number;
  bump: number;
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/**
 * Spherical orbit camera with time-based exponential damping, pointer-anchored dolly,
 * inertia and retargetable cinematic transitions. Pure logic: input wiring lives in RigInput.
 */
export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;
  minRadius = 0.022;
  maxRadius = 7;
  minPhi = 0.04;
  maxPhi = Math.PI - 0.04;
  /** Damping time constant for direct manipulation (seconds). Small = responsive. */
  tau = 0.075;
  bounds = new THREE.Box3(new THREE.Vector3(-1.2, -1.4, -1), new THREE.Vector3(1.2, 1.4, 1));
  onUserInput?: () => void;
  /** Fired when the user hits the minimum radius (model detail limit). */
  onDetailLimit?: () => void;

  private cur: RigState;
  private goal: RigState;
  private tween: Tween | null = null;
  private vTheta = 0;
  private vPhi = 0;
  private lastLimitNotice = -Infinity;
  private moving = false;

  constructor(camera: THREE.PerspectiveCamera, pose: CameraPose) {
    this.camera = camera;
    this.cur = this.fromPose(pose);
    this.goal = this.clone(this.cur);
    this.apply();
  }

  private fromPose(p: CameraPose): RigState {
    return { target: new THREE.Vector3(...p.target), logR: Math.log(p.radius), theta: p.theta, phi: p.phi };
  }
  private clone(s: RigState): RigState {
    return { target: s.target.clone(), logR: s.logR, theta: s.theta, phi: s.phi };
  }

  get pose(): CameraPose {
    return { target: this.cur.target.toArray() as Vec3, radius: Math.exp(this.cur.logR), theta: this.cur.theta, phi: this.cur.phi };
  }
  get goalPose(): CameraPose {
    return { target: this.goal.target.toArray() as Vec3, radius: Math.exp(this.goal.logR), theta: this.goal.theta, phi: this.goal.phi };
  }
  get radius() {
    return Math.exp(this.cur.logR);
  }
  get target() {
    return this.cur.target;
  }
  get isAnimating() {
    return this.tween !== null;
  }
  get isMoving() {
    return this.moving;
  }

  /** Cancel any cinematic transition, freezing goals at the current interpolated state (no jump). */
  interrupt() {
    if (this.tween) {
      this.tween = null;
      this.goal = this.clone(this.cur);
    }
  }

  private userTouched() {
    this.interrupt();
    this.followTau = null;
    this.onUserInput?.();
  }

  rotate(dxPx: number, dyPx: number, viewportH: number) {
    this.userTouched();
    const k = (Math.PI * 1.15) / Math.max(320, viewportH);
    this.goal.theta -= dxPx * k;
    this.goal.phi = THREE.MathUtils.clamp(this.goal.phi - dyPx * k, this.minPhi, this.maxPhi);
  }

  /** Feed instantaneous angular velocity (rad/s) on release for inertial glide. */
  fling(vTheta: number, vPhi: number) {
    if (prefersReducedMotion()) return;
    const cap = 6;
    this.vTheta = THREE.MathUtils.clamp(vTheta, -cap, cap);
    this.vPhi = THREE.MathUtils.clamp(vPhi, -cap, cap);
  }

  stopInertia() {
    this.vTheta = 0;
    this.vPhi = 0;
  }

  pan(dxPx: number, dyPx: number, viewportH: number) {
    this.userTouched();
    const r = Math.exp(this.goal.logR);
    const worldPerPx = (2 * r * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) / Math.max(1, viewportH);
    const { right, up } = this.basis(this.goal);
    this.goal.target.addScaledVector(right, -dxPx * worldPerPx).addScaledVector(up, dyPx * worldPerPx);
    this.goal.target.clamp(this.bounds.min, this.bounds.max);
  }

  /**
   * Dolly by `factor` (<1 = closer) while keeping `pivot` fixed on screen.
   * Scaling the target and the camera about the pivot leaves its projection unchanged.
   */
  dollyAt(factor: number, pivot: THREE.Vector3 | null) {
    this.userTouched();
    const r0 = Math.exp(this.goal.logR);
    const r1 = THREE.MathUtils.clamp(r0 * factor, this.minRadius, this.maxRadius);
    if (r1 <= this.minRadius * 1.0001 && factor < 1) {
      const now = performance.now();
      if (now - this.lastLimitNotice > 2500) {
        this.lastLimitNotice = now;
        this.onDetailLimit?.();
      }
    }
    if (Math.abs(r1 - r0) < 1e-9) return;
    const s = r1 / r0;
    if (pivot) {
      const t = this.goal.target.clone().sub(pivot).multiplyScalar(s).add(pivot);
      this.goal.target.copy(t).clamp(this.bounds.min, this.bounds.max);
    }
    this.goal.logR = Math.log(r1);
  }

  /** Jump-free programmatic move with optional cinematic arc. New calls retarget from the current state. */
  flyTo(pose: CameraPose, opts: { duration?: number; arc?: boolean } = {}) {
    this.stopInertia();
    this.followTau = null;
    const from = this.clone(this.cur);
    const to = this.fromPose(pose);
    to.logR = THREE.MathUtils.clamp(to.logR, Math.log(this.minRadius), Math.log(this.maxRadius));
    to.phi = THREE.MathUtils.clamp(to.phi, this.minPhi, this.maxPhi);
    to.theta = from.theta + wrap(to.theta - from.theta);
    const r0 = Math.exp(from.logR);
    const r1 = Math.exp(to.logR);
    const dist = from.target.distanceTo(to.target);
    const reduced = prefersReducedMotion();
    const zoomOrders = Math.abs(from.logR - to.logR) / Math.LN10;
    const ang = Math.abs(to.theta - from.theta) + Math.abs(to.phi - from.phi);
    const dur =
      opts.duration ??
      (reduced ? 0.22 : THREE.MathUtils.clamp(0.5 + 0.32 * Math.log2(1 + dist / (r0 + r1)) + 0.28 * zoomOrders + 0.12 * ang, 0.45, 1.7));
    // Arc: pull back proportionally when travelling far relative to the framing distances.
    const bump = opts.arc === false || reduced ? 0 : Math.max(0, Math.log((dist + r0 + r1) / (r0 + r1)) * 0.55);
    this.tween = { from, to, t: 0, dur, bump };
  }

  /** Track an externally driven pose with damping (used by scroll-scrubbed journeys). */
  follow(pose: CameraPose, tau = 0.16) {
    this.tween = null;
    this.stopInertia();
    const g = this.fromPose(pose);
    g.theta = this.cur.theta + wrap(g.theta - this.cur.theta);
    this.goal = g;
    this.followTau = tau;
  }
  private followTau: number | null = null;

  setImmediate(pose: CameraPose) {
    this.tween = null;
    this.cur = this.fromPose(pose);
    this.goal = this.clone(this.cur);
    this.apply();
  }

  update(dt: number): boolean {
    dt = Math.min(dt, 0.1);
    let changed = false;
    if (this.tween) {
      const tw = this.tween;
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const e = easeInOut(tw.t);
      this.cur.target.lerpVectors(tw.from.target, tw.to.target, e);
      this.cur.logR = THREE.MathUtils.lerp(tw.from.logR, tw.to.logR, e) + tw.bump * Math.sin(Math.PI * e);
      this.cur.theta = THREE.MathUtils.lerp(tw.from.theta, tw.to.theta, e);
      this.cur.phi = THREE.MathUtils.lerp(tw.from.phi, tw.to.phi, e);
      this.goal = this.clone(this.cur);
      if (tw.t >= 1) {
        this.tween = null;
        this.goal = this.clone(tw.to);
      }
      changed = true;
    } else {
      if (Math.abs(this.vTheta) + Math.abs(this.vPhi) > 1e-3) {
        this.goal.theta += this.vTheta * dt;
        this.goal.phi = THREE.MathUtils.clamp(this.goal.phi + this.vPhi * dt, this.minPhi, this.maxPhi);
        const decay = Math.exp(-dt / 0.22);
        this.vTheta *= decay;
        this.vPhi *= decay;
      } else {
        this.vTheta = this.vPhi = 0;
      }
      const tau = this.followTau ?? this.tau;
      const a = 1 - Math.exp(-dt / tau);
      const c = this.cur;
      const g = this.goal;
      const dT = c.target.distanceTo(g.target);
      const dR = Math.abs(c.logR - g.logR);
      const dA = Math.abs(c.theta - g.theta) + Math.abs(c.phi - g.phi);
      if (dT > 1e-6 || dR > 1e-5 || dA > 1e-5) {
        c.target.lerp(g.target, a);
        c.logR += (g.logR - c.logR) * a;
        c.theta += (g.theta - c.theta) * a;
        c.phi += (g.phi - c.phi) * a;
        changed = true;
      }
    }
    this.moving = changed;
    if (changed) this.apply();
    return changed;
  }

  private basis(s: RigState) {
    const forward = new THREE.Vector3(Math.sin(s.phi) * Math.sin(s.theta), Math.cos(s.phi), Math.sin(s.phi) * Math.cos(s.theta)).negate();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();
    return { forward, right, up };
  }

  apply() {
    const c = this.cur;
    const r = Math.exp(c.logR);
    const dir = new THREE.Vector3(Math.sin(c.phi) * Math.sin(c.theta), Math.cos(c.phi), Math.sin(c.phi) * Math.cos(c.theta));
    this.camera.position.copy(c.target).addScaledVector(dir, r);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(c.target);
    const near = THREE.MathUtils.clamp(r * 0.03, 0.0008, 0.08);
    const far = r + 4;
    if (Math.abs(this.camera.near - near) / near > 0.05 || Math.abs(this.camera.far - far) > 0.1) {
      this.camera.near = near;
      this.camera.far = far;
      this.camera.updateProjectionMatrix();
    }
  }

  /** Called by input layer to revert follow-mode damping to direct-manipulation damping. */
  releaseFollow() {
    this.followTau = null;
  }
}

/** Camera distance that fits a bounding sphere of radius `rad` into the view frustum. */
export function fitDistance(rad: number, camera: THREE.PerspectiveCamera, margin = 1.25) {
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  const fov = Math.min(vfov, hfov);
  return (rad * margin) / Math.sin(fov / 2);
}

export interface FramingOpts {
  /** Prefer to approach from outside the body toward the structure. */
  outward?: boolean;
  theta?: number;
  phi?: number;
  margin?: number;
}

/**
 * Inspection pose for a bounding box. Keeps the current orientation unless the structure faces
 * clearly away (then rotates the short way round), so selections never cause gratuitous spins.
 */
export function poseForBox(box: Box3Tuple, current: CameraPose, camera: THREE.PerspectiveCamera, opts: FramingOpts = {}): CameraPose {
  const c: Vec3 = [(box[0][0] + box[1][0]) / 2, (box[0][1] + box[1][1]) / 2, (box[0][2] + box[1][2]) / 2];
  const size = new THREE.Vector3(box[1][0] - box[0][0], box[1][1] - box[0][1], box[1][2] - box[0][2]);
  const rad = Math.max(0.012, size.length() / 2);
  let theta = opts.theta ?? current.theta;
  let phi = opts.phi ?? current.phi;
  if (opts.theta === undefined && opts.outward !== false) {
    const off = Math.hypot(c[0], c[2] - 0.0);
    if (off > 0.05) {
      const out = Math.atan2(c[0], c[2]);
      const d = wrap(out - current.theta);
      if (Math.abs(d) > THREE.MathUtils.degToRad(65)) theta = current.theta + d * 0.85;
    }
  }
  if (opts.phi === undefined) phi = THREE.MathUtils.clamp(phi, Math.PI * 0.3, Math.PI * 0.62);
  return { target: c, radius: fitDistance(rad, camera, opts.margin ?? 1.2), theta, phi };
}

export const HOME_POSE: CameraPose = { target: [0, -0.015, 0], radius: 4.3, theta: 0.42, phi: Math.PI * 0.47 };

export const STANDARD_VIEWS: { id: string; label: string; key: string; theta: number; phi: number }[] = [
  { id: 'anterior', label: 'Anterior', key: '1', theta: 0, phi: Math.PI / 2 },
  { id: 'posterior', label: 'Posterior', key: '2', theta: Math.PI, phi: Math.PI / 2 },
  { id: 'left', label: 'Left lateral', key: '3', theta: Math.PI / 2, phi: Math.PI / 2 },
  { id: 'right', label: 'Right lateral', key: '4', theta: -Math.PI / 2, phi: Math.PI / 2 },
  { id: 'superior', label: 'Superior', key: '5', theta: 0, phi: 0.06 },
  { id: 'inferior', label: 'Inferior', key: '6', theta: 0, phi: Math.PI - 0.06 },
];
