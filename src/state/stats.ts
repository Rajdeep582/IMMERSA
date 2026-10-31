import { create } from 'zustand';

export interface Stats {
  fps: number;
  frameMs: number;
  calls: number;
  triangles: number;
  dpr: number;
  units: number;
  geometries: number;
  radius: number;
}

/** Render diagnostics, sampled twice per second by the main viewport. */
export const useStats = create<Stats>(() => ({ fps: 0, frameMs: 0, calls: 0, triangles: 0, dpr: 1, units: 0, geometries: 0, radius: 0 }));
