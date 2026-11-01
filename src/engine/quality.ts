import type { QualityTier } from '../state/store';

export interface QualityProfile {
  tier: QualityTier;
  maxDpr: number;
  minDpr: number;
  antialias: boolean;
  hiResInMainView: boolean;
  prefetchLazySystems: boolean;
  hiChunkBudget: number;
  /** Systems fetched/decoded in parallel during start-up. */
  loadConcurrency: number;
  apple: boolean;
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
    // Release the probe context right away (iOS limits live contexts and counts their memory).
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    /* ignore */
  }
  const weakGpu = /mali-4|mali-t|adreno \(tm\) [3-5]\d\d|powervr|intel\(r\) hd graphics [2-5]\d{3}|swiftshader|llvmpipe/i.test(gpu);
  // iPadOS Safari reports itself as a Mac; detect it through touch support. Apple GPUs (tile-based,
  // unified memory) handle full Retina resolution and MSAA well, so iPads/iPhones get the high tier.
  const ua = navigator.userAgent;
  const iPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1);
  const apple = iPad || /iPhone|iPod/.test(ua) || /apple (gpu|m\d|a\d)/i.test(gpu);
  let tier: QualityTier = 'high';
  if ((touch && small) || mem <= 4 || cores <= 4) tier = 'medium';
  if (weakGpu || mem <= 2 || (touch && small && cores <= 4)) tier = 'low';
  if (apple && !weakGpu) tier = iPad || !small ? 'high' : 'medium';
  // Manual override for testing or user preference: ?quality=low|medium|high
  const forced = new URLSearchParams(location.search).get('quality');
  if (forced === 'low' || forced === 'medium' || forced === 'high') tier = forced;
  const dpr = window.devicePixelRatio || 1;
  // Resting frames always render at least one pixel per CSS pixel (never blurry); only frames drawn
  // while the camera moves may use the lower adaptive resolution, and the view re-sharpens on settle.
  const maxDpr = Math.min(dpr, tier === 'high' ? 2 : tier === 'medium' ? 2 : 1.5);
  return {
    tier,
    maxDpr,
    minDpr: Math.min(maxDpr, Math.max(1, tier === 'low' ? 1 : 1.25)),
    antialias: tier !== 'low' || apple,
    hiResInMainView: tier !== 'low',
    prefetchLazySystems: tier === 'high',
    hiChunkBudget: tier === 'high' ? 6 : tier === 'medium' ? 4 : 2,
    loadConcurrency: tier === 'low' ? 2 : tier === 'medium' ? 3 : 4,
    apple,
  };
}

export function webgl2Available(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}
