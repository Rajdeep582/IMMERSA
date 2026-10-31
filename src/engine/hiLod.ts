import type { Registry } from '../data/registry';
import type { AnatomyScene } from './anatomyScene';
import type { CameraRig } from './cameraRig';
import type { ModelLibrary } from './models';

const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

/** Human label for a full-resolution chunk id (system + top-level region). */
export function chunkLabel(registry: Registry, chunk: string): string {
  const [sys, part] = chunk.split('__');
  for (const s of registry.structures.values()) {
    if (s.system === sys && s.parent === `sys:${sys}` && slug(s.id) === part) return s.name;
  }
  return sys ?? chunk;
}

/**
 * Progressive level of detail for the main view: when the camera settles close to the anatomy,
 * the regional full-resolution meshes around the focus point replace the simplified body meshes
 * (identical coordinate frame, so the swap is seamless). Moving back out restores the body LOD
 * and releases the chunks to the library's LRU cache.
 */
export class HiLodController {
  private active = new Set<string>();
  private pending = new Set<string>();
  private last = 0;
  enabled = true;
  maxChunks = 2;
  enterRadius = 0.17;
  exitRadius = 0.34;
  onChange?: (labels: string[]) => void;

  constructor(
    private registry: Registry,
    private scene: AnatomyScene,
    private rig: CameraRig,
    private library: ModelLibrary,
    private invalidate: () => void,
  ) {
    library.onEvictHi = (chunk) => this.release(chunk);
  }

  update(now: number) {
    if (now - this.last < 220) return;
    this.last = now;
    const r = this.rig.radius;
    if (!this.enabled || r > this.exitRadius) {
      if (this.active.size) for (const c of [...this.active]) this.release(c);
      return;
    }
    if (this.rig.isMoving || this.rig.isAnimating || r > this.enterRadius) return;
    const near = this.scene.unitsNear(this.rig.target, Math.max(0.03, r * 0.9));
    const counts = new Map<string, number>();
    for (const fj of near) {
      const c = this.scene.chunkOf(fj);
      if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const wanted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, this.maxChunks).map(([c]) => c);
    for (const c of [...this.active]) if (!wanted.includes(c)) this.release(c);
    for (const c of wanted) if (!this.active.has(c) && !this.pending.has(c)) this.acquire(c);
  }

  private acquire(chunk: string) {
    this.pending.add(chunk);
    this.library.pin(chunk);
    this.onChange?.(this.labels());
    this.library
      .loadHi(chunk)
      .then((units) => {
        if (!this.pending.has(chunk)) return; // released while loading
        this.pending.delete(chunk);
        this.active.add(chunk);
        for (const u of units.values()) this.scene.setUnitGeometry(u.fj, u.geometry, u);
        this.onChange?.(this.labels());
        this.invalidate();
      })
      .catch(() => {
        this.pending.delete(chunk);
        this.library.unpin(chunk);
        this.onChange?.(this.labels());
      });
  }

  release(chunk: string) {
    const wasActive = this.active.delete(chunk);
    const wasPending = this.pending.delete(chunk);
    if (!wasActive && !wasPending) return;
    if (wasActive) {
      for (const fj of this.scene.hiActiveUnits()) if (this.scene.chunkOf(fj) === chunk) this.scene.setUnitGeometry(fj, null);
    }
    this.library.unpin(chunk);
    this.onChange?.(this.labels());
    this.invalidate();
  }

  get loading() {
    return this.pending.size > 0;
  }

  labels(): string[] {
    return [...this.active].map((c) => chunkLabel(this.registry, c));
  }
}
