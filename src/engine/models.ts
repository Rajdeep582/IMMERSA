import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { workerCount } from './threads';
import type { BodyModel, SystemId } from '../data/types';

/** One BodyParts3D element mesh as delivered in a glTF file (geometry + its dequantisation transform). */
export interface LoadedUnit {
  fj: string;
  geometry: THREE.BufferGeometry;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

const loader = new GLTFLoader();
// Decompress meshes on worker threads (one per spare core, up to 4) instead of the main thread.
MeshoptDecoder.useWorkers(workerCount(4));
loader.setMeshoptDecoder(MeshoptDecoder);

async function fetchWithProgress(url: string, signal: AbortSignal | undefined, onProgress?: (f: number) => void): Promise<ArrayBuffer> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const total = Number(res.headers.get('content-length') ?? 0);
  if (!res.body || !total || !onProgress) return res.arrayBuffer();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.byteLength;
    onProgress(Math.min(1, got / total));
  }
  const out = new Uint8Array(got);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.byteLength;
  }
  return out.buffer;
}

async function parseUnits(buf: ArrayBuffer): Promise<Map<string, LoadedUnit>> {
  const gltf = await loader.parseAsync(buf, '');
  const out = new Map<string, LoadedUnit>();
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    // Our writer emits one primitive per node, so the mesh carries the node (unit) name.
    const fj = m.name || m.parent?.name || '';
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    m.matrixWorld.decompose(position, quaternion, scale);
    m.geometry.computeBoundingSphere();
    m.geometry.computeBoundingBox();
    out.set(fj, { fj, geometry: m.geometry, position, quaternion, scale });
  });
  return out;
}

/**
 * Loads and caches anatomy meshes. Body-view meshes are fetched per system; full-resolution
 * meshes are fetched per regional chunk on demand and evicted LRU to bound GPU/CPU memory.
 */
export class ModelLibrary {
  private base: string;
  constructor(readonly model: BodyModel) {
    this.base = `${import.meta.env.BASE_URL}models/${model}/`;
  }
  private systems = new Map<SystemId, Promise<Map<string, LoadedUnit>>>();
  private hi = new Map<string, { p: Promise<Map<string, LoadedUnit>>; used: number; ctrl: AbortController; settled: boolean }>();
  private maxHiChunks = 6;
  private pins = new Map<string, number>();
  /** Optional sink so evicted hi-res geometry is removed from any scene before disposal. */
  onEvictHi?: (chunk: string, units: Map<string, LoadedUnit>) => void;

  loadSystem(sys: SystemId, file: string, onProgress?: (f: number) => void): Promise<Map<string, LoadedUnit>> {
    const hit = this.systems.get(sys);
    if (hit) return hit;
    const p = fetchWithProgress(this.base + file, undefined, onProgress).then(parseUnits);
    this.systems.set(sys, p);
    p.catch(() => this.systems.delete(sys));
    return p;
  }

  isHiCached(chunk: string): boolean {
    return this.hi.has(chunk);
  }

  loadHi(chunk: string): Promise<Map<string, LoadedUnit>> {
    const hit = this.hi.get(chunk);
    if (hit) {
      hit.used = performance.now();
      return hit.p;
    }
    const ctrl = new AbortController();
    const p = fetchWithProgress(`${this.base}hi/${chunk}.glb`, ctrl.signal).then(parseUnits);
    const entry = { p, used: performance.now(), ctrl, settled: false };
    this.hi.set(chunk, entry);
    p.then(
      () => {
        entry.settled = true;
        this.evict(chunk);
      },
      () => this.hi.get(chunk) === entry && this.hi.delete(chunk),
    );
    this.evict(chunk);
    return p;
  }

  /** Pinned chunks are never evicted (they are on screen in some viewport). */
  pin(chunk: string) {
    this.pins.set(chunk, (this.pins.get(chunk) ?? 0) + 1);
  }

  unpin(chunk: string) {
    const n = (this.pins.get(chunk) ?? 0) - 1;
    if (n <= 0) this.pins.delete(chunk);
    else this.pins.set(chunk, n);
  }

  setHiBudget(n: number) {
    this.maxHiChunks = n;
  }

  private evict(protect: string) {
    if (this.hi.size <= this.maxHiChunks) return;
    // Only finished downloads are evicted: aborting an in-flight chunk would fail whichever view is
    // about to use it (the inspector then stayed on the simplified mesh).
    const sorted = [...this.hi.entries()].filter(([k, e]) => k !== protect && e.settled && !this.pins.has(k)).sort((a, b) => a[1].used - b[1].used);
    while (this.hi.size > this.maxHiChunks && sorted.length) {
      const [k, e] = sorted.shift()!;
      this.hi.delete(k);
      e.p
        .then((units) => {
          this.onEvictHi?.(k, units);
          for (const u of units.values()) u.geometry.dispose();
        })
        .catch(() => undefined);
    }
  }
}

const libraries = new Map<BodyModel, ModelLibrary>();
/** One cache per body model; switching models keeps the other model's meshes cached for a quick switch back. */
export function libraryFor(model: BodyModel): ModelLibrary {
  let l = libraries.get(model);
  if (!l) {
    l = new ModelLibrary(model);
    libraries.set(model, l);
  }
  return l;
}
