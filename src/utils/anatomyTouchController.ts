import * as THREE from 'three';
import { StandardView } from '../types/anatomy';

export interface CameraTransition {
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startLookAt: THREE.Vector3;
  targetLookAt: THREE.Vector3;
  startTime: number;
  duration: number;
  onComplete?: () => void;
}

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
}

export class AnatomyTouchController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private raycaster: THREE.Raycaster;

  // Authoritative camera state
  public target: THREE.Vector3 = new THREE.Vector3(0, 0.865, 0);
  private spherical: THREE.Spherical = new THREE.Spherical();
  private targetSpherical: THREE.Spherical = new THREE.Spherical();

  // Damping and velocities
  private sphericalDelta: THREE.Spherical = new THREE.Spherical();
  private panOffset: THREE.Vector3 = new THREE.Vector3();

  // Multi-touch tracking
  private activeTouches: Map<number, TouchPoint> = new Map();
  private prevPinchDistance = 0;
  private prevPinchCenter = new THREE.Vector2();
  private isGestureActive = false;
  private touchMode: 'none' | 'rotate' | 'pinch_pan' = 'none';

  // Tuned sensitivities
  private readonly touchRotateSpeed = 0.0028; // Radians per pixel (controlled, non-aggressive)
  private readonly mouseRotateSpeed = 0.0035;
  private readonly dampingFactor = 0.085;     // Smooth rotation settling
  private readonly zoomDampingFactor = 0.24;  // Fast, responsive zoom tracking
  private readonly minDistance = 0.035;       // Prevent clipping
  private readonly maxDistance = 6.5;
  private readonly minPolarAngle = 0.05;      // Prevent gimbal lock
  private readonly maxPolarAngle = Math.PI * 0.95;

  // Active smooth transitions
  private activeTransition: CameraTransition | null = null;

  // Auto-rotation
  public autoRotate = false;
  public autoRotateSpeed = 0.6;

  // Event callbacks
  public onChange?: () => void;
  public onSelectHit?: (x: number, y: number) => void;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();

    // Ensure touch-action is strictly none on the 3D canvas so browser gestures never fight WebGL
    this.domElement.style.touchAction = 'none';

    // Synchronize initial spherical coordinates from camera
    this.syncFromCamera();
    this.bindEvents();
  }

  public syncFromCamera(): void {
    const offset = this.camera.position.clone().sub(this.target);
    this.spherical.setFromVector3(offset);
    this.targetSpherical.copy(this.spherical);
  }

  private bindEvents(): void {
    this.domElement.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    this.domElement.addEventListener('pointermove', this.onPointerMove, { passive: false });
    this.domElement.addEventListener('pointerup', this.onPointerUp, { passive: false });
    this.domElement.addEventListener('pointercancel', this.onPointerCancel, { passive: false });
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    this.domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  public dispose(): void {
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('pointercancel', this.onPointerCancel);
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
    this.activeTouches.forEach((touch) => {
      try {
        this.domElement.releasePointerCapture(touch.id);
      } catch {
        // Pointer capture may already have been released by the browser.
      }
    });
    this.activeTouches.clear();
  }

  private onContextMenu = (e: Event): void => e.preventDefault();

  private onPointerDown = (e: PointerEvent): void => {
    // If pointer is over interactive UI overlays, don't hijack
    if ((e.target as HTMLElement).closest('.ui-interactive-surface')) {
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    // Stop any ongoing cinematic camera animation immediately without glitching
    if (this.activeTransition) {
      this.activeTransition = null;
      this.syncFromCamera();
    }

    this.activeTouches.set(e.pointerId, {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
    });

    try {
      this.domElement.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }

    if (this.activeTouches.size === 1) {
      this.touchMode = 'rotate';
      this.isGestureActive = true;
    } else if (this.activeTouches.size === 2) {
      this.touchMode = 'pinch_pan';
      this.isGestureActive = true;
      this.updatePinchBaseline();
    }
  };

  private updatePinchBaseline(): void {
    const touches = Array.from(this.activeTouches.values());
    if (touches.length >= 2) {
      const dx = touches[0].x - touches[1].x;
      const dy = touches[0].y - touches[1].y;
      this.prevPinchDistance = Math.hypot(dx, dy);
      this.prevPinchCenter.set((touches[0].x + touches[1].x) * 0.5, (touches[0].y + touches[1].y) * 0.5);
    }
  }

  private onPointerMove = (e: PointerEvent): void => {
    const touch = this.activeTouches.get(e.pointerId);
    if (!touch) return;

    e.preventDefault();

    const prevX = touch.x;
    const prevY = touch.y;
    touch.x = e.clientX;
    touch.y = e.clientY;

    if (this.touchMode === 'rotate' && this.activeTouches.size === 1) {
      // Single finger or left mouse drag: gentle, controlled rotation
      const deltaX = e.clientX - prevX;
      const deltaY = e.clientY - prevY;

      const speed = e.pointerType === 'touch' ? this.touchRotateSpeed : this.mouseRotateSpeed;
      // Damped spherical rotation update
      this.targetSpherical.theta -= deltaX * speed;
      this.targetSpherical.phi -= deltaY * speed;
      this.targetSpherical.phi = THREE.MathUtils.clamp(this.targetSpherical.phi, this.minPolarAngle, this.maxPolarAngle);

      this.onChange?.();
    } else if (this.touchMode === 'pinch_pan' && this.activeTouches.size >= 2) {
      // Two fingers: Fast, responsive Pinch-to-zoom and two-finger pan
      const touches = Array.from(this.activeTouches.values());
      const dx = touches[0].x - touches[1].x;
      const dy = touches[0].y - touches[1].y;
      const currentPinchDistance = Math.hypot(dx, dy);
      const currentCenter = new THREE.Vector2((touches[0].x + touches[1].x) * 0.5, (touches[0].y + touches[1].y) * 0.5);

      if (this.prevPinchDistance > 1 && currentPinchDistance > 1) {
        const pinchRatio = currentPinchDistance / this.prevPinchDistance;
        // Fast, punchy pinch zoom responsiveness (4.6x sensitivity)
        const pinchSensitivity = 4.6;
        const zoomMultiplier = Math.exp(-Math.log(pinchRatio) * pinchSensitivity);

        this.targetSpherical.radius = THREE.MathUtils.clamp(
          this.targetSpherical.radius * zoomMultiplier,
          this.minDistance,
          this.maxDistance
        );

        // Two-finger pan (midpoint translation)
        const panDeltaX = currentCenter.x - this.prevPinchCenter.x;
        const panDeltaY = currentCenter.y - this.prevPinchCenter.y;
        if (Math.hypot(panDeltaX, panDeltaY) > 1.0) {
          const panFactor = THREE.MathUtils.clamp(this.targetSpherical.radius / 2.0, 0.3, 1.2) * 0.0018;
          this.applyScreenPan(panDeltaX, panDeltaY, panFactor);
        }

        this.onChange?.();
      }
      this.prevPinchDistance = currentPinchDistance;
      this.prevPinchCenter.copy(currentCenter);
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    const touch = this.activeTouches.get(e.pointerId);
    if (touch) {
      // Tap detection: only trigger structure picking if finger didn't drag significantly
      const totalDist = Math.hypot(e.clientX - touch.startX, e.clientY - touch.startY);
      const totalTime = performance.now() - touch.startTime;
      if (totalDist < 6 && totalTime < 350 && this.activeTouches.size === 1) {
        this.onSelectHit?.(e.clientX, e.clientY);
      }
    }

    try {
      this.domElement.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    this.activeTouches.delete(e.pointerId);

    if (this.activeTouches.size === 1) {
      // Transitioned from 2 fingers down to 1 finger: seamlessly switch to rotate without jump
      this.touchMode = 'rotate';
      const remaining = Array.from(this.activeTouches.values())[0];
      remaining.startX = remaining.x;
      remaining.startY = remaining.y;
    } else if (this.activeTouches.size === 0) {
      this.touchMode = 'none';
      this.isGestureActive = false;
    }
  };

  private onPointerCancel = (e: PointerEvent): void => {
    this.activeTouches.delete(e.pointerId);
    if (this.activeTouches.size === 1) {
      this.touchMode = 'rotate';
      const remaining = Array.from(this.activeTouches.values())[0];
      remaining.startX = remaining.x;
      remaining.startY = remaining.y;
      this.updatePinchBaseline();
    } else if (this.activeTouches.size === 0) {
      this.touchMode = 'none';
      this.isGestureActive = false;
    } else {
      this.touchMode = 'pinch_pan';
      this.updatePinchBaseline();
    }
  };

  private onWheel = (e: WheelEvent): void => {
    if ((e.target as HTMLElement).closest('.ui-interactive-surface')) {
      return;
    }

    e.preventDefault();

    // Cancel active transition if user scrolls
    if (this.activeTransition) {
      this.activeTransition = null;
      this.syncFromCamera();
    }

    const rect = this.domElement.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const deltaScale = e.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 28
      : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? rect.height
        : 1;
    const delta = e.deltaY * deltaScale;
    const currentRadius = this.targetSpherical.radius;

    // Fast, responsive wheel zoom:
    // Increased zoom step from 0.0012 to 0.0032 for snappy, rapid zoom travel
    const zoomStep = 0.0032;
    const zoomFactor = Math.exp(THREE.MathUtils.clamp(delta * zoomStep, -0.75, 0.75));

    // Pointer-aware raycasting when zooming in
    if (delta < 0) {
      this.raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);
      const sceneObjects = this.camera.parent?.children || [];
      const hits = this.raycaster.intersectObjects(sceneObjects, true);

      let hitPoint: THREE.Vector3 | null = null;
      for (const hit of hits) {
        if (hit.object instanceof THREE.Mesh && hit.object.visible && !hit.object.name.includes('ground') && !hit.object.name.includes('platform')) {
          hitPoint = hit.point;
          break;
        }
      }

      if (hitPoint) {
        // Shift target smoothly toward hit surface (16% per notch)
        this.target.lerp(hitPoint, 0.16);
      }
    }

    this.targetSpherical.radius = THREE.MathUtils.clamp(
      currentRadius * zoomFactor,
      this.minDistance,
      this.maxDistance
    );

    this.onChange?.();
  };

  /**
   * Rapid discrete zoom-in step (used by toolbar buttons or keyboard shortcuts).
   */
  public zoomIn(factor = 0.72): void {
    if (this.activeTransition) {
      this.activeTransition = null;
      this.syncFromCamera();
    }
    this.targetSpherical.radius = THREE.MathUtils.clamp(
      this.targetSpherical.radius * factor,
      this.minDistance,
      this.maxDistance
    );
    this.onChange?.();
  }

  /**
   * Rapid discrete zoom-out step.
   */
  public zoomOut(factor = 1.38): void {
    if (this.activeTransition) {
      this.activeTransition = null;
      this.syncFromCamera();
    }
    this.targetSpherical.radius = THREE.MathUtils.clamp(
      this.targetSpherical.radius * factor,
      this.minDistance,
      this.maxDistance
    );
    this.onChange?.();
  }

  private applyScreenPan(deltaX: number, deltaY: number, factor: number): void {
    const vLeft = new THREE.Vector3(-1, 0, 0).applyQuaternion(this.camera.quaternion);
    const vUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);

    vLeft.multiplyScalar(deltaX * factor);
    vUp.multiplyScalar(-deltaY * factor);

    this.target.add(vLeft).add(vUp);
  }

  /**
   * Smoothly transitions camera and lookAt target to frame a structure.
   */
  public transitionTo(
    targetPos: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    durationMs = 900,
    onComplete?: () => void
  ): void {
    this.activeTransition = {
      startPos: this.camera.position.clone(),
      targetPos: targetPos.clone(),
      startLookAt: this.target.clone(),
      targetLookAt: targetLookAt.clone(),
      startTime: performance.now(),
      duration: durationMs,
      onComplete,
    };
  }

  /**
   * Automatically calculates optimal framing for any 3D bounding box.
   */
  public focusBoundingBox(box: THREE.Box3, preferredAngle?: THREE.Vector3, durationMs = 950): void {
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    let distance = (maxDim / 2) / Math.tan(fovRad / 2);
    // Add comfortable padding
    distance = Math.max(0.065, distance * 1.65);

    const angle = preferredAngle ? preferredAngle.clone().normalize() : new THREE.Vector3(0.2, 0.1, 1).normalize();
    const eyePos = center.clone().addScaledVector(angle, distance);

    this.transitionTo(eyePos, center, durationMs);
  }

  /**
   * Transitions to standard anatomical perspectives.
   */
  public setStandardView(view: StandardView, targetLookAt?: THREE.Vector3, durationMs = 850): void {
    const look = targetLookAt || this.target.clone();
    const dist = THREE.MathUtils.clamp(this.camera.position.distanceTo(look), 1.0, 3.6);

    let eyeOffset = new THREE.Vector3();
    switch (view) {
      case 'anterior':
        eyeOffset.set(0, 0.05, dist);
        break;
      case 'posterior':
        eyeOffset.set(0, 0.05, -dist);
        break;
      case 'left':
        eyeOffset.set(-dist, 0.05, 0);
        break;
      case 'right':
        eyeOffset.set(dist, 0.05, 0);
        break;
      case 'superior':
        eyeOffset.set(0, dist * 0.98, 0.01);
        break;
      case 'inferior':
        eyeOffset.set(0, -dist * 0.98, 0.01);
        break;
      case 'isometric':
      default:
        eyeOffset.set(dist * 0.55, dist * 0.25, dist * 0.8).normalize().multiplyScalar(dist);
        break;
    }

    const eyePos = look.clone().add(eyeOffset);
    this.transitionTo(eyePos, look, durationMs);
  }

  /**
   * Called on every animation frame. Provides authoritative camera updates.
   */
  public update(dt: number): boolean {
    if (this.activeTransition) {
      const now = performance.now();
      const elapsed = now - this.activeTransition.startTime;
      const progress = Math.min(1.0, elapsed / this.activeTransition.duration);

      // Smooth hermite / quintic easing
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.lerpVectors(this.activeTransition.startPos, this.activeTransition.targetPos, eased);
      this.target.lerpVectors(this.activeTransition.startLookAt, this.activeTransition.targetLookAt, eased);
      this.camera.lookAt(this.target);
      this.syncFromCamera();

      if (progress >= 1.0) {
        const cb = this.activeTransition.onComplete;
        this.activeTransition = null;
        if (cb) cb();
      }
      return true;
    }

    // Auto-rotation when idle
    if (this.autoRotate && !this.isGestureActive) {
      this.targetSpherical.theta += this.autoRotateSpeed * dt * 0.5;
    }

    // Smooth exponential damping toward targetSpherical
    const rotFactor = 1.0 - Math.exp(-this.dampingFactor * dt * 60);
    const zoomFactor = 1.0 - Math.exp(-this.zoomDampingFactor * dt * 60);
    this.spherical.theta = THREE.MathUtils.lerp(this.spherical.theta, this.targetSpherical.theta, rotFactor);
    this.spherical.phi = THREE.MathUtils.lerp(this.spherical.phi, this.targetSpherical.phi, rotFactor);
    this.spherical.radius = THREE.MathUtils.lerp(this.spherical.radius, this.targetSpherical.radius, zoomFactor);

    // Compute final camera position from spherical coordinates + target
    const offset = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);

    // Check if camera is still actively settling
    const dTheta = Math.abs(this.spherical.theta - this.targetSpherical.theta);
    const dPhi = Math.abs(this.spherical.phi - this.targetSpherical.phi);
    const dRadius = Math.abs(this.spherical.radius - this.targetSpherical.radius);

    return dTheta > 0.0001 || dPhi > 0.0001 || dRadius > 0.0001 || this.autoRotate;
  }
}

