import { useSyncExternalStore } from 'react';

/**
 * App navigation on top of the browser history, so the in-app back button, the browser back button
 * and the Android hardware back key all walk the same trail.
 *
 * Routes: "#/learn" (hub), "#/learn/<topic>[/<section>][/@<structureId>]" (guide page, optionally
 * opened for one structure); anything else is the 3D explorer.
 * Every entry carries `{ imm, idx }`; explorer entries also carry the selection and camera pose to
 * restore when the user comes back to them.
 */
export type Route = { view: 'explore' } | { view: 'learn'; topic: string | null; section?: string; focusId?: string };

export interface NavState {
  imm: 1;
  idx: number;
  view: 'explore' | 'learn';
  /** Explorer entries: selection + camera to restore. */
  sel?: string | null;
  model?: string;
  pose?: unknown;
  /** Learn entries: index of the explorer entry the user came from. */
  from?: number;
}

function parse(hash: string): Route {
  const m = hash.match(/^#\/learn(?:\/([\w-]+))?(?:\/([\w-]+))?(?:\/@(.+))?$/);
  if (!m) {
    const lone = hash.match(/^#\/learn\/@(.+)$/);
    if (lone) return { view: 'learn', topic: null, focusId: decodeURIComponent(lone[1]!) };
    return /^#\/learn/.test(hash) ? { view: 'learn', topic: null } : { view: 'explore' };
  }
  return { view: 'learn', topic: m[1] ?? null, section: m[2], focusId: m[3] ? decodeURIComponent(m[3]) : undefined };
}

let current = parse(location.hash);
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const navState = (): NavState | null => {
  const s = history.state as NavState | null;
  return s && s.imm === 1 ? s : null;
};
/** History index of the entry on screen. */
export const navIndex = () => navState()?.idx ?? 0;

// Tag the entry the app was opened on.
if (!navState()) history.replaceState({ imm: 1, idx: 0, view: current.view } satisfies NavState, '');

/** Hooks the explorer uses to save / restore its selection and camera with history entries. */
export const navHooks: {
  snapshot: () => Pick<NavState, 'sel' | 'model' | 'pose'>;
  restore: (s: NavState) => void;
} = { snapshot: () => ({}), restore: () => undefined };

let restoring = false;
/** True while a history entry is being restored (selection changes then must not create entries). */
export const isRestoring = () => restoring;

function sync() {
  current = parse(location.hash);
  emit();
}

window.addEventListener('popstate', () => {
  sync();
  const s = navState();
  if (s && current.view === 'explore') {
    restoring = true;
    try {
      navHooks.restore(s);
    } finally {
      // Selection subscribers run synchronously; release on the next task to be safe.
      window.setTimeout(() => (restoring = false), 0);
    }
  }
});
// Manually edited URLs.
window.addEventListener('hashchange', () => {
  if (parse(location.hash).view !== current.view || location.hash !== '') sync();
});

/** Save the explorer's current selection/camera into the entry on screen (before leaving it). */
function stampCurrent() {
  const s = navState();
  if (s?.view === 'explore') history.replaceState({ ...s, ...navHooks.snapshot() }, '');
}

let lastPush = 0;
/** Time of the last history push (successive explorer changes within a moment collapse into one entry). */
export const lastNavPush = () => lastPush;

function push(view: 'explore' | 'learn', url: string, extra: Partial<NavState> = {}) {
  stampCurrent();
  lastPush = performance.now();
  const idx = navIndex() + 1;
  history.pushState({ imm: 1, idx, view, ...extra } satisfies NavState, '', url);
  sync();
}

export function useRoute(): Route {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
}

export const getRoute = () => current;

/** Can the back button go anywhere inside the app? */
export function useCanGoBack(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => navIndex() > 0,
  );
}

export function learnHash(topic?: string | null, section?: string, focusId?: string) {
  let h = '#/learn';
  if (topic) h += `/${topic}${section ? '/' + section : ''}`;
  if (focusId) h += `/@${encodeURIComponent(focusId)}`;
  return h;
}

/** Open the study hub, a guide page, or a guide page focused on one structure. */
export function openLearn(topic?: string | null, section?: string, focusId?: string) {
  const s = navState();
  const from = s?.view === 'explore' ? s.idx : s?.from;
  push('learn', location.pathname + location.search + learnHash(topic, section, focusId), { from });
}

/** Back to the 3D explorer, returning to the explorer entry the user came from when possible. */
export function openExplorer() {
  const s = navState();
  if (s?.view === 'learn' && typeof s.from === 'number' && s.from < s.idx) {
    history.go(s.from - s.idx);
    return;
  }
  push('explore', location.pathname + location.search);
}

/** Leave Learn for the explorer without returning (used when a link selects a new structure). */
export function openExplorerFresh() {
  push('explore', location.pathname + location.search);
}

/** One step back through the in-app trail. */
export function navBack() {
  if (navIndex() > 0) history.back();
  else if (current.view === 'learn') openExplorer();
}

/**
 * Record a new explorer state (selection change) as its own history entry. `prev` is the state being
 * left (selection before the change, camera before it starts moving) and is saved into the old entry.
 */
export function pushExploreEntry(prev: Pick<NavState, 'sel' | 'model' | 'pose'>) {
  if (restoring || current.view !== 'explore') return;
  const s = navState();
  if (s) history.replaceState({ ...s, ...prev }, '');
  lastPush = performance.now();
  history.pushState({ imm: 1, idx: navIndex() + 1, view: 'explore', ...navHooks.snapshot() } satisfies NavState, '', location.pathname + location.search);
  emit();
}

/** Replace the explorer entry on screen (rapid successive changes collapse into one step). */
export function replaceExploreEntry() {
  if (restoring || current.view !== 'explore') return;
  const s = navState();
  if (s) history.replaceState({ ...s, ...navHooks.snapshot() }, '');
}

/** Notify route listeners that the back-availability may have changed. */
export const navChanged = emit;
