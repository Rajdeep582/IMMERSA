import type { CameraPose } from '../data/types';
import { viewer } from '../engine/viewer';
import { getRoute, isRestoring, lastNavPush, navHooks, pushExploreEntry, replaceExploreEntry } from '../learn/route';
import { useApp } from '../state/store';

const posePlain = (): CameraPose | undefined => {
  const p = viewer.rig?.pose;
  return p ? { target: [p.target[0], p.target[1], p.target[2]], radius: p.radius, theta: p.theta, phi: p.phi } : undefined;
};

let installed = false;

/**
 * Connects explorer state to the history trail: each new selection is a back-step, and going back
 * restores the earlier selection and camera. Selection changes within ~0.7 s collapse into one step
 * (drill-down clicks, a link that opens the explorer and selects in one go).
 */
export function installNav() {
  if (installed) return;
  installed = true;
  navHooks.snapshot = () => {
    const st = useApp.getState();
    return { sel: st.selectedId, model: st.bodyModel, pose: posePlain() };
  };
  navHooks.restore = (s) => {
    const st = useApp.getState();
    if (s.model && s.model !== st.bodyModel) return;
    const reg = viewer.registry;
    const sel = s.sel && reg?.get(s.sel) ? s.sel : null;
    st.select(sel);
    if (s.pose && viewer.rig) viewer.flyTo(s.pose as CameraPose);
  };
  useApp.subscribe((s, p) => {
    if (s.selectedId === p.selectedId || s.bodyModel !== p.bodyModel) return;
    if (isRestoring() || getRoute().view !== 'explore' || s.guided) return;
    const prev = { sel: p.selectedId, model: p.bodyModel, pose: posePlain() };
    if (performance.now() - lastNavPush() < 700) replaceExploreEntry();
    else pushExploreEntry(prev);
  });
}
