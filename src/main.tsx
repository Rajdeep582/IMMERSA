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
