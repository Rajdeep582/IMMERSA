import type { SystemId } from '../data/types';

/**
 * Start-up progress weighted by file size, so the bar moves with the bytes actually arriving instead of
 * jumping per system (ten small systems used to reach ~89% while the two largest files were still
 * downloading). Per system: download 0–0.7, decoded 0.85, meshes added → 1.
 */
const weight = new Map<SystemId, number>();
const done = new Map<SystemId, number>();
const listeners = new Set<() => void>();
let finalStage = 0; // 0..1 across batching + GPU upload after every system is in

export const loadProgress = {
  register(sys: SystemId, bytes: number) {
    if (!weight.has(sys)) weight.set(sys, Math.max(1, bytes));
    if (!done.has(sys)) done.set(sys, 0);
  },
  set(sys: SystemId, f: number) {
    const prev = done.get(sys) ?? 0;
    if (f <= prev) return;
    done.set(sys, Math.min(1, f));
    listeners.forEach((l) => l());
  },
  setFinal(f: number) {
    finalStage = Math.max(finalStage, Math.min(1, f));
    listeners.forEach((l) => l());
  },
  /** Overall 0..1 (systems weighted by bytes, then the final GPU stage). */
  overall(): number {
    let W = 0;
    let D = 0;
    for (const [s, w] of weight) {
      W += w;
      D += w * (done.get(s) ?? 0);
    }
    const sys = W ? D / W : 0;
    return 0.04 + 0.86 * sys + 0.095 * finalStage;
  },
  /** The unfinished system with the most remaining work (for the status label). */
  busiest(): SystemId | null {
    let best: SystemId | null = null;
    let rem = 0;
    for (const [s, w] of weight) {
      const r = w * (1 - (done.get(s) ?? 0));
      if (r > rem + 1e-9) {
        rem = r;
        best = s;
      }
    }
    return best;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
};
