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
  button: number; // 0: primary (left), 1: auxiliary (middle), 2: secondary (right)
  pointerType: 'mouse' | 'touch' | 'pen';
}

export class AnatomyTouchController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private scene?: THREE.Scene;
  private raycaster: THREE.Raycaster;

  // Authoritative camera lookAt target (point around which camera orbits and zooms)
  public target: THREE.Vector3 = new THREE.Vector3(0, 0.865, 0);
  private spherical: THREE.Spherical = new THREE.Spherical();
  private targetSpherical: THREE.Spherical = new THREE.Spherical();

  // Interaction Mode: 'rotate' (default orbit) or 'pan' (model translation)
  public interactionMode: 'rotate' | 'pan' = 'rotate';

  // Multi-touch tracking
  private activeTouches: Map<number, TouchPoint> = new Map();
  private prevPinchDistance = 0;
  private prevPinchCenter = new THREE.Vector2();
  public isGestureActive = false;

  // Tuned sensitivities & limits
  private readonly touchRotateSpeed = 0.0042; // Radians per pixel for touch
  private readonly mouseRotateSpeed = 0.0038; // Radians per pixel for mouse
  private readonly dampingFactor = 0.095;     // Smooth rotation settling
  private readonly zoomDampingFactor = 0.22;  // Fast, responsive zoom tracking
  private readonly minDistance = 0.035;       // 35mm micro inspection minimum
  private readonly maxDistance = 6.5;         // 6.5m maximum zoom-out distance
  private readonly minPolarAngle = 0.02;      // Near zenith (top-down superior view)
  private readonly maxPolarAngle = Math.PI - 0.02; // Near nadir (bottom-up inferior view)

  // Anatomical target panning boundaries (prevents user from flinging camera to infinity)
  private readonly panBounds = {
    minX: -2.2,
    maxX: 2.2,
    minY: -1.0,
    maxY: 2.6,
    minZ: -2.2,
    maxZ: 2.2,
  };

  // Active smooth transitions
  private activeTransition: CameraTransition | null = null;

  // Auto-rotation
  public autoRotate = false;
  public autoRotateSpeed = 0.6;

  // Event callbacks
  public onChange?: () => void;
  public onSelectHit?: (x: number, y: number) => void;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, scene?: THREE.Scene) {
    this.camera = camera;
    this.domElement = domElement;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();

    // Prevent default browser touch scrolling/pinching inside the 3D viewport canvas
    this.domElement.style.touchAction = 'none';
    this.updateCursor();

    // Synchronize initial spherical coordinates from camera
    this.syncFromCamera();
    this.bindEvents();
  }

  public setInteractionMode(mode: 'rotate' | 'pan'): void {
    this.interactionMode = mode;
    this.updateCursor();
  }

  public getInteractionMode(): 'rotate' | 'pan' {
    return this.interactionMode;
  }

  private updateCursor(): void {
    if (!this.domElement) return;
    this.domElement.style.cursor = this.interactionMode === 'pan' ? 'all-scroll' : 'grab';
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
        // Ignored
      }
    });
    this.activeTouches.clear();
  }

  private onContextMenu = (e: Event): void => {
    // Prevent default browser right-click menu so right-click can be used freely for panning
    e.preventDefault();
  };

  private onPointerDown = (e: PointerEvent): void => {
    // Don't hijack clicks on top of UI overlay controls
    if ((e.target as HTMLElement).closest('.ui-interactive-surface')) {
      return;
    }

    // Accept primary (0), middle (1), and secondary (2) buttons for mouse
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1 && e.button !== 2) {
      return;
    }

    // Stop ongoing transition immediately if user interacts manually
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
      button: e.button,
      pointerType: e.pointerType as 'mouse' | 'touch' | 'pen',
    });

    try {
      this.domElement.setPointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    this.isGestureActive = true;
    if (this.domElement) {
      this.domElement.style.cursor = 'grabbing';
    }

    if (this.activeTouches.size === 2) {
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

    const deltaX = e.clientX - prevX;
    const deltaY = e.clientY - prevY;

    if (this.activeTouches.size === 1) {
      // Single pointer manipulation (mouse or 1 finger)
      // PAN CONDITIONS:
      // - Right mouse button (button 2)
      // - Middle mouse button (button 1)
      // - Shift key held on desktop
      // - Interaction mode explicitly set to 'pan'
      const isPan =
        touch.button === 1 ||
        touch.button === 2 ||
        e.shiftKey ||
        this.interactionMode === 'pan';

      if (isPan) {
        this.pan(deltaX, deltaY);
      } else {
        // ROTATE: Orbit horizontally and vertically around the target
        const speed = e.pointerType === 'touch' ? this.touchRotateSpeed : this.mouseRotateSpeed;
        this.targetSpherical.theta -= deltaX * speed;
        this.targetSpherical.phi -= deltaY * speed;
        this.targetSpherical.phi = THREE.MathUtils.clamp(
          this.targetSpherical.phi,
          this.minPolarAngle,
          this.maxPolarAngle
        );
        this.onChange?.();
      }
    } else if (this.activeTouches.size >= 2) {
      // TWO-FINGER GESTURES ON MOBILE & TABLET:
      // 1. Simultaneous, natural Two-Finger Panning
      // 2. Smooth Two-Finger Pinch-to-Zoom
      const touches = Array.from(this.activeTouches.values());
      const dx = touches[0].x - touches[1].x;
      const dy = touches[0].y - touches[1].y;
      const currentDistance = Math.hypot(dx, dy);
      const currentCenter = new THREE.Vector2(
        (touches[0].x + touches[1].x) * 0.5,
        (touches[0].y + touches[1].y) * 0.5
      );

      // Two-Finger Pan: translation of the midpoint between fingers
      const panDeltaX = currentCenter.x - this.prevPinchCenter.x;
      const panDeltaY = currentCenter.y - this.prevPinchCenter.y;
      if (Math.hypot(panDeltaX, panDeltaY) > 0.25) {
        this.pan(panDeltaX, panDeltaY);
      }

      // Two-Finger Zoom (Pinch): ratio of finger separation
      if (this.prevPinchDistance > 10 && currentDistance > 10) {
        const pinchRatio = this.prevPinchDistance / currentDistance;
        this.targetSpherical.radius = THREE.MathUtils.clamp(
          this.targetSpherical.radius * pinchRatio,
          this.minDistance,
          this.maxDistance
        );
        this.onChange?.();
      }

      this.prevPinchDistance = currentDistance;
      this.prevPinchCenter.copy(currentCenter);
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    const touch = this.activeTouches.get(e.pointerId);
    if (touch) {
      const totalDist = Math.hypot(e.clientX - touch.startX, e.clientY - touch.startY);
      const totalTime = performance.now() - touch.startTime;

      // Tap / Click Selection Detection:
      // - Must be primary button (Left click or Touch tap: touch.button === 0)
      // - Must NOT be a drag gesture (totalDist < 8 pixels)
      // - Must NOT be holding Shift (pan modifier)
      // - Quick tap (< 450ms)
      // - Must be single pointer
      // - Distinguishes click/tap from drag in both Rotate and Pan modes
      if (
        touch.button === 0 &&
        !e.shiftKey &&
        totalDist < 8 &&
        totalTime < 450 &&
        this.activeTouches.size === 1
      ) {
        this.onSelectHit?.(e.clientX, e.clientY);
      }
    }

    try {
      this.domElement.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    this.activeTouches.delete(e.pointerId);

    if (this.activeTouches.size === 1) {
      const remaining = Array.from(this.activeTouches.values())[0];
      remaining.startX = remaining.x;
      remaining.startY = remaining.y;
    } else if (this.activeTouches.size === 0) {
      this.isGestureActive = false;
      this.updateCursor();
    } else {
      this.updatePinchBaseline();
    }
  };

  private onPointerCancel = (e: PointerEvent): void => {
    try {
      this.domElement.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    this.activeTouches.delete(e.pointerId);
    if (this.activeTouches.size === 0) {
      this.isGestureActive = false;
      this.updateCursor();
    } else {
      this.updatePinchBaseline();
    }
  };

  private onWheel = (e: WheelEvent): void => {
    if ((e.target as HTMLElement).closest('.ui-interactive-surface')) {
      return;
    }

    e.preventDefault();

    if (this.activeTransition) {
      this.activeTransition = null;
      this.syncFromCamera();
    }

    const rect = this.domElement.getBoundingClientRect();
    const deltaScale =
      e.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 24
        : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? rect.height
        : 1;
    const delta = e.deltaY * deltaScale;
    const currentRadius = this.targetSpherical.radius;

    // Smooth, progressive wheel zoom
    const zoomStep = 0.0022;
    const zoomFactor = Math.exp(THREE.MathUtils.clamp(delta * zoomStep, -0.65, 0.65));

    this.targetSpherical.radius = THREE.MathUtils.clamp(
      currentRadius * zoomFactor,
      this.minDistance,
      this.maxDistance
    );

    this.onChange?.();
  };

  /**
   * 1:1 Screen-space to World-space Panning.
   * Moves the lookAt target and camera together so the entire body model
   * glides smoothly under the cursor or fingers in world coordinates.
   */
  public pan(deltaX: number, deltaY: number): void {
    if (!this.domElement) return;

    // Target distance dictates how much world distance corresponds to 1 screen pixel
    const targetDistance = this.camera.position.distanceTo(this.target);
    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    const halfHeight = targetDistance * Math.tan(fovRad * 0.5);

    const clientHeight = this.domElement.clientHeight || window.innerHeight;
    const factor = (2.0 * halfHeight) / clientHeight;

    // Camera local coordinate axes in world space
    // vRight is the camera's local X-axis (column 0 of matrixWorld)
    const vRight = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
    // vUp is the camera's local Y-axis (column 1 of matrixWorld)
    const vUp = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1);

    // Delta mapping:
    // deltaX > 0 (dragging right): camera moves left (-vRight) so model shifts right
    // deltaY > 0 (dragging down): camera moves up (+vUp) so model shifts down
    const panOffset = new THREE.Vector3();
    panOffset.addScaledVector(vRight, -deltaX * factor);
    panOffset.addScaledVector(vUp, deltaY * factor);

    this.target.add(panOffset);

    // Clamp target within generous anatomical envelope
    this.target.x = THREE.MathUtils.clamp(this.target.x, this.panBounds.minX, this.panBounds.maxX);
    this.target.y = THREE.MathUtils.clamp(this.target.y, this.panBounds.minY, this.panBounds.maxY);
    this.target.z = THREE.MathUtils.clamp(this.target.z, this.panBounds.minZ, this.panBounds.maxZ);

    this.onChange?.();
  }

  /**
   * Fast discrete zoom-in step (used by toolbar buttons and keyboard shortcuts).
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
   * Fast discrete zoom-out step.
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

  /**
   * Resets camera target and orientation to canonical adult whole-body framing.
   */
  public resetCamera(durationMs = 800): void {
    const defaultTarget = new THREE.Vector3(0, 0.865, 0);
    const defaultEye = new THREE.Vector3(0, 0.88, 3.1);
    this.transitionTo(defaultEye, defaultTarget, durationMs);
  }

  /**
   * Smoothly transitions camera and lookAt target.
   */
  public transitionTo(
    targetPos: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    durationMs = 850,
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
    this.onChange?.();
  }

  /**
   * Automatically calculates optimal framing for any 3D bounding box.
   */
  public focusBoundingBox(box: THREE.Box3, preferredAngle?: THREE.Vector3, durationMs = 900): void {
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    let distance = (maxDim / 2) / Math.tan(fovRad / 2);
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
