/**
 * Android (Capacitor) shell integration. Only compiled into `vite build --mode android`
 * (guarded by the `__ANDROID__` build constant), so the website bundle never contains it.
 */
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter-tight/latin-400.css';
import '@fontsource/inter-tight/latin-500.css';
import '@fontsource/inter-tight/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useApp } from '../state/store';
import { getRoute, navBack, navIndex } from '../learn/route';

export function initAndroid() {
  if (!Capacitor.isNativePlatform()) return;
  document.documentElement.classList.add('native-android');

  // Hardware back: leave Learn pages → close slice dock → clear isolate/selection → background the app
  // (minimise, not exit, so loaded meshes survive a quick return).
  void App.addListener('backButton', () => {
    const s = useApp.getState();
    if (getRoute().view === 'learn') {
      navBack();
      return;
    }
    if (s.guided) {
      s.setGuided(null);
      return;
    }
    if (s.sliceOpen) {
      s.setSliceOpen(false);
      return;
    }
    if (s.isolate) {
      s.setIsolate(null);
      return;
    }
    if (navIndex() > 0) {
      navBack();
      return;
    }
    if (s.selectedId) {
      s.select(null);
      return;
    }
    void App.minimizeApp();
  });
}
