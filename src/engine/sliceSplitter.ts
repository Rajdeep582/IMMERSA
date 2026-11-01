import * as THREE from 'three';
import { cores } from './threads';
import type { SliceJob, SliceResult } from './sliceWorker';

/**
 * Pool of slice workers (one per spare CPU core). Geometry is cut off the main thread so the
 * dissection stays smooth on phones and tablets while every core does part of the work.
 */
class SliceSplitter {
  private workers: Worker[] = [];
  private idle: Worker[] = [];
  private queue: { job: SliceJob; transfer: Transferable[]; resolve: (r: SliceResult) => void; reject: (e: unknown) => void }[] = [];
  private pending = new Map<number, { resolve: (r: SliceResult) => void; reject: (e: unknown) => void }>();
  private seq = 0;
  private failed = false;

  private ensure() {
    if (this.workers.length || this.failed) return;
    const n = Math.max(1, Math.min(8, cores() - 1));
    try {
      for (let i = 0; i < n; i++) {
        const w = new Worker(new URL('./sliceWorker.ts', import.meta.url), { type: 'module', name: `slice-${i}` });
        w.onmessage = (e: MessageEvent<SliceResult>) => {
          const p = this.pending.get(e.data.id);
          this.pending.delete(e.data.id);
          this.idle.push(w);
          this.pump();
          p?.resolve(e.data);
        };
        w.onerror = (e) => {
          // A broken worker rejects everything it was given; the scene falls back to shader-only slicing.
          for (const [id, p] of this.pending) {
            p.reject(e);
            this.pending.delete(id);
          }
        };
        this.workers.push(w);
        this.idle.push(w);
      }
    } catch {
      this.failed = true;
    }
  }

  private pump() {
    while (this.idle.length && this.queue.length) {
      const w = this.idle.pop()!;
      const q = this.queue.shift()!;
      this.pending.set(q.job.id, q);
      w.postMessage(q.job, q.transfer);
    }
  }

  /** Cancel queued (not yet started) jobs, e.g. when the slab layout changes. */
  clearQueue() {
    for (const q of this.queue) q.reject(new Error('cancelled'));
    this.queue = [];
  }

  split(geometry: THREE.BufferGeometry, matrixWorld: THREE.Matrix4, layout: { y0: number; h: number; n: number }): Promise<THREE.BufferGeometry> {
    this.ensure();
    if (this.failed) return Promise.reject(new Error('workers unavailable'));
    const pa = geometry.getAttribute('position') as THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
    const na = geometry.getAttribute('normal') as THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined;
    const flat = (a: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): { arr: ArrayBufferView; norm: boolean; size: number } => {
      if (a instanceof THREE.InterleavedBufferAttribute) {
        const out = new Float32Array(a.count * 3);
        for (let i = 0; i < a.count; i++) {
          out[i * 3] = a.getX(i);
          out[i * 3 + 1] = a.getY(i);
          out[i * 3 + 2] = a.getZ(i);
        }
        return { arr: out, norm: false, size: 3 };
      }
      return { arr: (a.array as unknown as { slice(): ArrayBufferView }).slice(), norm: a.normalized, size: a.itemSize };
    };
    const p = flat(pa);
    const nn = na ? flat(na) : null;
    const idx = geometry.index ? ((geometry.index.array as Uint16Array | Uint32Array).slice() as Uint16Array | Uint32Array) : null;
    const e = matrixWorld.elements;
    const job: SliceJob = {
      id: ++this.seq,
      pos: p.arr,
      posNorm: p.norm,
      posSize: p.size,
      nrm: nn?.arr ?? null,
      nrmNorm: nn?.norm ?? false,
      idx,
      row: [e[0]!, e[4]!, e[8]!, e[12]!],
      ...layout,
    };
    const transfer: Transferable[] = [(p.arr as Float32Array).buffer];
    if (nn) transfer.push((nn.arr as Float32Array).buffer);
    if (idx) transfer.push(idx.buffer);
    return new Promise<SliceResult>((resolve, reject) => {
      this.queue.push({ job, transfer, resolve, reject });
      this.pump();
    }).then((r) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(r.pos, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(r.nrm, 3));
      g.setAttribute('aSlab', new THREE.BufferAttribute(r.slab, 1));
      g.setIndex(new THREE.BufferAttribute(r.idx, 1));
      g.boundingBox = geometry.boundingBox?.clone() ?? null;
      g.boundingSphere = geometry.boundingSphere?.clone() ?? null;
      if (!g.boundingBox) g.computeBoundingBox();
      if (!g.boundingSphere) g.computeBoundingSphere();
      return g;
    });
  }
}

export const sliceSplitter = new SliceSplitter();
