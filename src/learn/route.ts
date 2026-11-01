import { useSyncExternalStore } from 'react';

/** Hash routes: "#/learn" (hub), "#/learn/<topic>" (page); anything else is the 3D explorer. */
export type Route = { view: 'explore' } | { view: 'learn'; topic: string | null; section?: string };

function parse(hash: string): Route {
  const m = hash.match(/^#\/learn(?:\/([\w-]+))?(?:\/([\w-]+))?/);
  if (!m) return { view: 'explore' };
  return { view: 'learn', topic: m[1] ?? null, section: m[2] };
}

let current = parse(location.hash);
const listeners = new Set<() => void>();
window.addEventListener('hashchange', () => {
  current = parse(location.hash);
  listeners.forEach((l) => l());
});

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

export function openLearn(topic?: string | null, section?: string) {
  location.hash = topic ? `#/learn/${topic}${section ? '/' + section : ''}` : '#/learn';
}

/** Back to the 3D explorer without leaving a dangling "#". */
export function openExplorer() {
  if (location.hash) history.pushState(null, '', location.pathname + location.search);
  current = { view: 'explore' };
  listeners.forEach((l) => l());
}
