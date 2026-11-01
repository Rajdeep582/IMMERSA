import { loadRegistry } from '../data/registry';
import { SYSTEMS } from '../data/systems';
import type { BodyModel } from '../data/types';
import { libraryFor } from './models';
import type { QualityTier } from '../state/store';

const started = new Set<BodyModel>();

/**
 * Fetch and decode the other body model in the background (one system at a time, idle priority),
 * so switching male ⇄ female is instant. Low-end devices only preload the core systems.
 */
export function preloadModel(model: BodyModel, tier: QualityTier) {
  if (started.has(model)) return;
  started.add(model);
  const core = new Set(['integumentary', 'skeletal', 'nervous', 'digestive', 'respiratory']);
  loadRegistry(model)
    .then(async (reg) => {
      const lib = libraryFor(model);
      const order = ['integumentary', 'skeletal', 'nervous', 'cardiovascular', 'muscular', 'digestive', 'respiratory', 'urinary', 'reproductive', 'endocrine', 'lymphatic', 'sensory'];
      const ids = SYSTEMS.map((s) => s.id).sort((a, b) => order.indexOf(a) - order.indexOf(b));
      for (const sys of ids) {
        if (tier === 'low' && !core.has(sys)) continue;
        const m = reg.manifest.systems[sys];
        if (!m) continue;
        await idle();
        await lib.loadSystem(sys, m.file).catch(() => undefined);
      }
    })
    .catch(() => started.delete(model));
}

const idle = () =>
  new Promise<void>((r) => {
    const ric = (window as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) ric(() => r(), { timeout: 1500 });
    else setTimeout(r, 120);
  });
