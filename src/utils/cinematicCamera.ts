import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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

export class CinematicCameraController {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private domElement: HTMLElement;
  private raycaster: THREE.Raycaster;
  private mousePos: THREE.Vector2;

  private activeTransition: CameraTransition | null = null;
  private currentLookAt: THREE.Vector3 = new THREE.Vector3(0, 0.85, 0);

  // Damped pointer zoom target
  private zoomTargetPoint: THREE.Vector3 | null = null;

  constructor(camera: THREE.PerspectiveCamera, controls: OrbitControls, domElement: HTMLElement) {
    this.camera = camera;
    this.controls = controls;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();
    this.mousePos = new THREE.Vector2();

    this.currentLookAt.copy(controls.target);
    this.setupPointerZoom();
  }

  private setupPointerZoom(): void {
    const handleWheel = (e: WheelEvent) => {
      // If pointer is over interactive UI or modifiers like Shift are pressed, let default handle
      if ((e.target as HTMLElement).closest('.ui-interactive-surface')) {
        return;
      }

      e.preventDefault();

      const rect = this.domElement.getBoundingClientRect();
      this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Determine zoom direction and intensity
      const delta = Math.sign(e.deltaY);
      const zoomFactor = delta > 0 ? 1.12 : 0.88;

      // Pointer-aware raycasting
      this.raycaster.setFromCamera(this.mousePos, this.camera);
      const sceneObjects = this.camera.parent?.children || [];
      const hits = this.raycaster.intersectObjects(sceneObjects, true);

      // Find first visible mesh hit (excluding platform/floor)
      let hitPoint: THREE.Vector3 | null = null;
      for (const hit of hits) {
        if (hit.object instanceof THREE.Mesh && hit.object.visible && !hit.object.name.includes('ground') && !hit.object.name.includes('platform')) {
          hitPoint = hit.point;
          break;
        }
      }

      if (hitPoint && delta < 0) {
        // Zooming in towards pointer hit point
        // Smoothly blend camera position and controls target towards hitPoint
        const camToHit = hitPoint.clone().sub(this.camera.position);
        const distance = camToHit.length();
        if (distance > 0.1) {
          const moveDist = distance * (1 - zoomFactor);
          this.camera.position.addScaledVector(camToHit.normalize(), moveDist);
          // Shift target smoothly towards the hit point
          this.controls.target.lerp(hitPoint, 0.15);
          this.currentLookAt.copy(this.controls.target);
          this.controls.update();
        }
      } else {
        // Zooming out or no surface hit: zoom relative to current controls.target along view ray
        const dir = this.camera.position.clone().sub(this.controls.target);
        const newDist = THREE.MathUtils.clamp(dir.length() * zoomFactor, 0.1, 8.0);
        this.camera.position.copy(this.controls.target).add(dir.normalize().multiplyScalar(newDist));
        this.controls.update();
      }

      // Cancel any ongoing transition if user manually wheels
      if (this.activeTransition) {
        this.activeTransition = null;
      }
    };

    this.domElement.addEventListener('wheel', handleWheel, { passive: false });
  }

  /**
   * Smoothly interpolates camera and orbit target to look at a structure with continuous easing.
   */
  public transitionTo(
    targetPos: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    durationMs = 950,
    onComplete?: () => void
  ): void {
    this.activeTransition = {
      startPos: this.camera.position.clone(),
      targetPos: targetPos.clone(),
      startLookAt: this.controls.target.clone(),
      targetLookAt: targetLookAt.clone(),
      startTime: performance.now(),
      duration: durationMs,
      onComplete,
    };
  }

  /**
   * Focuses on a 3D bounding box with automatic distance calculation.
   */
  public focusBoundingBox(box: THREE.Box3, preferredAngle?: THREE.Vector3, durationMs = 1000): void {
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    let distance = (maxDim / 2) / Math.tan(fov / 2);
    // Add comfortable framing padding (1.8x)
    distance = Math.max(0.08, distance * 1.8);

    const angle = preferredAngle ? preferredAngle.clone().normalize() : new THREE.Vector3(0.2, 0.1, 1).normalize();
    const eyePos = center.clone().addScaledVector(angle, distance);

    this.transitionTo(eyePos, center, durationMs);
  }

  /**
   * Transitions to standard anatomical perspectives.
   */
  public setStandardView(view: StandardView, targetLookAt?: THREE.Vector3, durationMs = 900): void {
    const look = targetLookAt || this.controls.target.clone();
    const dist = THREE.MathUtils.clamp(this.camera.position.distanceTo(look), 1.2, 3.8);

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
   * Called on every animation frame to advance active transitions with smooth cubic-bezier easing.
   */
  public update(): boolean {
    if (!this.activeTransition) {
      return false;
    }

    const now = performance.now();
    const elapsed = now - this.activeTransition.startTime;
    const progress = Math.min(1.0, elapsed / this.activeTransition.duration);

    // Smooth quintic / cubic easing: t * t * (3 - 2 * t)
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    this.camera.position.lerpVectors(this.activeTransition.startPos, this.activeTransition.targetPos, eased);
    this.controls.target.lerpVectors(this.activeTransition.startLookAt, this.activeTransition.targetLookAt, eased);
    this.controls.update();

    if (progress >= 1.0) {
      const cb = this.activeTransition.onComplete;
      this.activeTransition = null;
      if (cb) cb();
      return true;
    }

    return true;
  }
}

