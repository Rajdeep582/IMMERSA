import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  // StrictMode is intentionally omitted: its dev-only double effect mount would
  // tear down and rebuild imperative WebGL scene state.
  <App />,
);

// Diagnostics handle for automated interaction tests and the browser console.
import { viewer } from './engine/viewer';
import { useApp } from './state/store';
import { useStats } from './state/stats';
declare global {
  interface Window {
    __immersa?: { viewer: typeof viewer; useApp: typeof useApp; useStats: typeof useStats };
  }
}
window.__immersa = { viewer, useApp, useStats };

// Production: cache meshes and data locally so repeat visits load from disk instead of the network.
declare const __BUILD_ID__: string;
declare const __ANDROID__: boolean;
// Android app: assets already ship inside the APK, so no service worker; native shell hooks load instead.
// `__ANDROID__` is a build-time constant, so the website bundle drops this branch entirely.
if (__ANDROID__) {
  void import('./native/android').then((m) => m.initAndroid());
} else if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js?v=${__BUILD_ID__}`).catch(() => undefined);
  });
}
