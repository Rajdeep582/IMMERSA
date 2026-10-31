import * as THREE from 'three';
import type { CameraRig } from './cameraRig';

export interface RigInputHandlers {
  /** World-space point under a client position, or null when over empty background. */
  pick: (clientX: number, clientY: number) => THREE.Vector3 | null;
  onTap?: (clientX: number, clientY: number, pointerType: string) => void;
  onDoubleTap?: (clientX: number, clientY: number) => void;
  onHover?: (clientX: number, clientY: number) => void;
  onHoverEnd?: () => void;
  onGestureStart?: () => void;
  /** When true, a single primary drag pans instead of rotating. */
  panMode?: () => boolean;
}

interface Ptr {
  id: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
  t0: number;
  type: string;
  button: number;
}

/**
 * Pointer/wheel/touch wiring for a CameraRig on one DOM element. Listeners are confined to the
 * canvas element, so wheel and touch gestures over UI panels never move the model.
 */
export class RigInput {
  private ptrs = new Map<number, Ptr>();
  private mode: 'none' | 'rotate' | 'pan' | 'pinch' = 'none';
  private pinch = { dist: 0, mx: 0, my: 0, pivot: null as THREE.Vector3 | null };
  private samples: { t: number; dx: number; dy: number }[] = [];
  private lastTap = { t: 0, x: 0, y: 0 };
  private wheelPivot = { t: 0, x: 0, y: 0, p: null as THREE.Vector3 | null };
  private hoverRaf = 0;
  private hoverPos = { x: 0, y: 0 };
  private disposed = false;

  constructor(
    private el: HTMLElement,
    private rig: CameraRig,
    private h: RigInputHandlers,
  ) {
    el.addEventListener('pointerdown', this.down);
    el.addEventListener('pointermove', this.move);
    el.addEventListener('pointerup', this.up);
    el.addEventListener('pointercancel', this.up);
    el.addEventListener('pointerleave', this.leave);
    el.addEventListener('wheel', this.wheel, { passive: false });
    el.addEventListener('contextmenu', this.ctx);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.hoverRaf);
    const el = this.el;
    el.removeEventListener('pointerdown', this.down);
    el.removeEventListener('pointermove', this.move);
    el.removeEventListener('pointerup', this.up);
    el.removeEventListener('pointercancel', this.up);
    el.removeEventListener('pointerleave', this.leave);
    el.removeEventListener('wheel', this.wheel);
    el.removeEventListener('contextmenu', this.ctx);
  }

  private get h0() {
    return this.el.clientHeight || 600;
  }

  private ctx = (e: Event) => e.preventDefault();

  private down = (e: PointerEvent) => {
    try {
      this.el.setPointerCapture?.(e.pointerId);
    } catch {
      /* synthetic or already-released pointer: capture is an optimisation only */
    }
    this.ptrs.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t0: performance.now(), type: e.pointerType, button: e.button });
    this.rig.stopInertia();
    this.samples = [];
    this.h.onGestureStart?.();
    if (this.ptrs.size === 1) {
      const panBtn = e.button === 1 || e.button === 2 || e.shiftKey || e.ctrlKey || e.metaKey || !!this.h.panMode?.();
      this.mode = panBtn ? 'pan' : 'rotate';
    } else if (this.ptrs.size === 2) {
      this.startPinch();
    } else {
      this.mode = 'pan';
    }
  };

  private startPinch() {
    const [a, b] = [...this.ptrs.values()] as [Ptr, Ptr];
    this.mode = 'pinch';
    this.pinch.dist = Math.hypot(a.x - b.x, a.y - b.y);
    this.pinch.mx = (a.x + b.x) / 2;
    this.pinch.my = (a.y + b.y) / 2;
    this.pinch.pivot = this.h.pick(this.pinch.mx, this.pinch.my);
  }

  private move = (e: PointerEvent) => {
    const p = this.ptrs.get(e.pointerId);
    if (!p) {
      if (e.pointerType === 'mouse' && this.h.onHover) {
        this.hoverPos = { x: e.clientX, y: e.clientY };
        if (!this.hoverRaf)
          this.hoverRaf = requestAnimationFrame(() => {
            this.hoverRaf = 0;
            if (!this.disposed) this.h.onHover?.(this.hoverPos.x, this.hoverPos.y);
          });
      }
      return;
    }
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (this.mode === 'rotate') {
      this.rig.rotate(dx, dy, this.h0);
      this.samples.push({ t: performance.now(), dx, dy });
      if (this.samples.length > 6) this.samples.shift();
    } else if (this.mode === 'pan') {
      this.rig.pan(dx, dy, this.h0);
    } else if (this.mode === 'pinch' && this.ptrs.size >= 2) {
      const [a, b] = [...this.ptrs.values()] as [Ptr, Ptr];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      if (dist > 4 && this.pinch.dist > 4) this.rig.dollyAt(this.pinch.dist / dist, this.pinch.pivot);
      this.rig.pan(mx - this.pinch.mx, my - this.pinch.my, this.h0);
      this.pinch.dist = dist;
      this.pinch.mx = mx;
      this.pinch.my = my;
    }
  };

  private up = (e: PointerEvent) => {
    const p = this.ptrs.get(e.pointerId);
    if (!p) return;
    this.ptrs.delete(e.pointerId);
    const now = performance.now();
    const moved = Math.hypot(p.x - p.sx, p.y - p.sy);
    if (this.mode === 'rotate' && this.ptrs.size === 0) {
      const recent = this.samples.filter((s) => now - s.t < 90);
      if (recent.length >= 2) {
        const span = Math.max(16, now - recent[0]!.t) / 1000;
        const sx = recent.reduce((a, s) => a + s.dx, 0);
        const sy = recent.reduce((a, s) => a + s.dy, 0);
        const k = (Math.PI * 1.15) / Math.max(320, this.h0);
        this.rig.fling((-sx * k) / span, (-sy * k) / span);
      }
    }
    if (this.ptrs.size === 0 && e.type === 'pointerup' && moved < (p.type === 'touch' ? 10 : 5) && now - p.t0 < 400 && this.mode !== 'pinch') {
      const dbl = now - this.lastTap.t < 320 && Math.hypot(e.clientX - this.lastTap.x, e.clientY - this.lastTap.y) < 20;
      if (dbl) {
        this.lastTap.t = 0;
        this.h.onDoubleTap?.(e.clientX, e.clientY);
      } else {
        this.lastTap = { t: now, x: e.clientX, y: e.clientY };
        this.h.onTap?.(e.clientX, e.clientY, p.type);
      }
    }
    if (this.ptrs.size === 1) {
      this.mode = this.h.panMode?.() ? 'pan' : 'rotate';
      const rest = [...this.ptrs.values()][0]!;
      rest.sx = rest.x;
      rest.sy = rest.y;
    } else if (this.ptrs.size === 0) this.mode = 'none';
  };

  private leave = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && !this.ptrs.size) this.h.onHoverEnd?.();
  };

  private wheel = (e: WheelEvent) => {
    e.preventDefault();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= this.h0;
    // ctrlKey + wheel is how browsers report trackpad pinch: finer deltas, so a stronger gain.
    const gain = e.ctrlKey ? 0.012 : 0.0016;
    dy = THREE.MathUtils.clamp(dy, -240, 240);
    const factor = Math.exp(dy * gain);
    const now = performance.now();
    const wp = this.wheelPivot;
    if (now - wp.t > 140 || Math.hypot(e.clientX - wp.x, e.clientY - wp.y) > 4) {
      wp.p = this.h.pick(e.clientX, e.clientY);
      wp.x = e.clientX;
      wp.y = e.clientY;
    }
    wp.t = now;
    this.rig.dollyAt(factor, wp.p);
  };
}
