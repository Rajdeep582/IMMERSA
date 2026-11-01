/// <reference lib="webworker" />
/**
 * Splits a mesh along parallel cutting planes so that every output triangle lies inside exactly one
 * slab. Vertices created on a cut are duplicated (one copy per side) and every vertex carries its
 * slab index, so the vertex shader can move whole slabs rigidly and the cut edges stay exact.
 *
 * Planes are given in world space as x = y0 + j·h; the mesh's local→world x mapping is the affine
 * row `row` (world x = r0·px + r1·py + r2·pz + t), so all cutting happens in local space.
 */
export interface SliceJob {
  id: number;
  pos: ArrayBufferView;
  posNorm: boolean;
  posSize: number;
  nrm: ArrayBufferView | null;
  nrmNorm: boolean;
  idx: Uint16Array | Uint32Array | null;
  row: [number, number, number, number];
  y0: number;
  h: number;
  n: number;
}
export interface SliceResult {
  id: number;
  pos: Float32Array;
  nrm: Float32Array;
  idx: Uint32Array;
  slab: Float32Array;
}

function toFloat(a: ArrayBufferView, norm: boolean): Float32Array {
  if (a instanceof Float32Array) return a;
  const src = a as unknown as ArrayLike<number>;
  const out = new Float32Array(src.length);
  let s = 1;
  if (norm) {
    if (a instanceof Int8Array) s = 1 / 127;
    else if (a instanceof Uint8Array) s = 1 / 255;
    else if (a instanceof Int16Array) s = 1 / 32767;
    else if (a instanceof Uint16Array) s = 1 / 65535;
  }
  for (let i = 0; i < src.length; i++) out[i] = norm ? Math.max(src[i]! * s, -1) : src[i]!;
  return out;
}

export function splitMesh(job: SliceJob): SliceResult {
  const P = toFloat(job.pos, job.posNorm);
  const stride = job.posSize;
  const vcount = P.length / stride;
  const N = job.nrm ? toFloat(job.nrm, job.nrmNorm) : null;
  const nStride = N ? N.length / vcount : 3;
  const [r0, r1, r2, t] = job.row;
  const { y0, h, n } = job;
  const slabOf = (x: number) => Math.min(n - 1, Math.max(0, Math.floor((x - y0) / h)));

  // Output vertex buffers start with the original vertices.
  const pos: number[] = new Array(vcount * 3);
  const nrm: number[] = new Array(vcount * 3);
  const slab: number[] = new Array(vcount);
  const fx: number[] = new Array(vcount);
  for (let i = 0; i < vcount; i++) {
    const x = P[i * stride]!, y = P[i * stride + 1]!, z = P[i * stride + 2]!;
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
    if (N) {
      nrm[i * 3] = N[i * nStride]!;
      nrm[i * 3 + 1] = N[i * nStride + 1]!;
      nrm[i * 3 + 2] = N[i * nStride + 2]!;
    } else {
      nrm[i * 3] = 0;
      nrm[i * 3 + 1] = 1;
      nrm[i * 3 + 2] = 0;
    }
    fx[i] = r0 * x + r1 * y + r2 * z + t;
    slab[i] = slabOf(fx[i]!);
  }
  const out: number[] = [];
  const cutCache = new Map<string, [number, number]>();
  const addVertex = (u: number, v: number, s: number, k: number) => {
    const i = slab.length;
    for (let c = 0; c < 3; c++) {
      pos.push(pos[u * 3 + c]! + (pos[v * 3 + c]! - pos[u * 3 + c]!) * s);
      nrm.push(nrm[u * 3 + c]! + (nrm[v * 3 + c]! - nrm[u * 3 + c]!) * s);
    }
    fx.push(fx[u]! + (fx[v]! - fx[u]!) * s);
    slab.push(k);
    return i;
  };
  /** Cut point of edge u→v on plane j: [copy for slab j-1, copy for slab j]. */
  const cut = (u: number, v: number, j: number): [number, number] => {
    const key = u < v ? `${u}_${v}_${j}` : `${v}_${u}_${j}`;
    let c = cutCache.get(key);
    if (!c) {
      const a = u < v ? u : v;
      const b = u < v ? v : u;
      const plane = y0 + j * h;
      const s = (plane - fx[a]!) / (fx[b]! - fx[a]! || 1e-12);
      c = [addVertex(a, b, s, j - 1), addVertex(a, b, s, j)];
      cutCache.set(key, c);
    }
    return c;
  };
  const emit = (poly: number[]) => {
    for (let i = 1; i + 1 < poly.length; i++) out.push(poly[0]!, poly[i]!, poly[i + 1]!);
  };

  const idx = job.idx;
  const tcount = idx ? idx.length / 3 : vcount / 3;
  for (let ti = 0; ti < tcount; ti++) {
    const a = idx ? idx[ti * 3]! : ti * 3;
    const b = idx ? idx[ti * 3 + 1]! : ti * 3 + 1;
    const c = idx ? idx[ti * 3 + 2]! : ti * 3 + 2;
    const ka = slab[a]!, kb = slab[b]!, kc = slab[c]!;
    if (ka === kb && kb === kc) {
      out.push(a, b, c);
      continue;
    }
    // Walk the planes crossing this triangle left → right, peeling off one slab at a time.
    let poly = [a, b, c];
    const kmin = Math.min(ka, kb, kc), kmax = Math.max(ka, kb, kc);
    for (let j = kmin + 1; j <= kmax; j++) {
      const plane = y0 + j * h;
      const left: number[] = [], right: number[] = [];
      for (let i = 0; i < poly.length; i++) {
        const u = poly[i]!, v = poly[(i + 1) % poly.length]!;
        const uIn = fx[u]! < plane, vIn = fx[v]! < plane;
        if (uIn) left.push(u);
        else right.push(u);
        if (uIn !== vIn) {
          const [l, r] = cut(u, v, j);
          left.push(l);
          right.push(r);
        }
      }
      if (left.length >= 3) emit(left);
      poly = right;
      if (poly.length < 3) break;
    }
    if (poly.length >= 3) emit(poly);
  }
  // Re-normalise interpolated normals.
  const nOut = new Float32Array(nrm);
  for (let i = vcount * 3; i < nOut.length; i += 3) {
    const l = Math.hypot(nOut[i]!, nOut[i + 1]!, nOut[i + 2]!) || 1;
    nOut[i]! /= l;
    nOut[i + 1]! /= l;
    nOut[i + 2]! /= l;
  }
  return { id: job.id, pos: new Float32Array(pos), nrm: nOut, idx: new Uint32Array(out), slab: new Float32Array(slab) };
}

declare const WorkerGlobalScope: { new (): unknown } | undefined;
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof (WorkerGlobalScope as unknown as typeof Object)) {
  self.onmessage = (e: MessageEvent<SliceJob>) => {
    const r = splitMesh(e.data);
    (self as unknown as DedicatedWorkerGlobalScope).postMessage(r, [r.pos.buffer, r.nrm.buffer, r.idx.buffer, r.slab.buffer]);
  };
}
