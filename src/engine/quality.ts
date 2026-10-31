import type { QualityTier } from '../state/store';

export interface QualityProfile {
  tier: QualityTier;
  maxDpr: number;
  minDpr: number;
  antialias: boolean;
  hiResInMainView: boolean;
  prefetchLazySystems: boolean;
  hiChunkBudget: number;
}

/** Coarse device classification. Refined at runtime by the adaptive-DPR controller. */
export function detectQuality(): QualityProfile {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const touch = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(screen.width, screen.height) < 820;
  const mem = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  let gpu = '';
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    if (gl && ext) gpu = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
  } catch {
    /* ignore */
  }
  const weakGpu = /mali-4|mali-t|adreno \(tm\) [3-5]\d\d|powervr|intel\(r\) hd graphics [2-5]\d{3}|swiftshader|llvmpipe/i.test(gpu);
  let tier: QualityTier = 'high';
  if ((touch && small) || mem <= 4 || cores <= 4) tier = 'medium';
  if (weakGpu || mem <= 2 || (touch && small && cores <= 4)) tier = 'low';
  // Manual override for testing or user preference: ?quality=low|medium|high
  const forced = new URLSearchParams(location.search).get('quality');
  if (forced === 'low' || forced === 'medium' || forced === 'high') tier = forced;
  const dpr = window.devicePixelRatio || 1;
  return {
    tier,
    maxDpr: Math.min(dpr, tier === 'high' ? 2 : tier === 'medium' ? 1.6 : 1.25),
    minDpr: tier === 'low' ? 0.6 : 0.75,
    antialias: tier !== 'low',
    hiResInMainView: tier !== 'low',
    prefetchLazySystems: tier === 'high',
    hiChunkBudget: tier === 'high' ? 6 : tier === 'medium' ? 3 : 1,
  };
}

export function webgl2Available(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}
