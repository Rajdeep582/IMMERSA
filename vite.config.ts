import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * `vite build` → website (unchanged). `vite build --mode android` → bundle for the Capacitor app:
 * fonts bundled locally (works offline), no Google Fonts requests, no service worker.
 */
const androidHtml = (): Plugin => ({
  name: 'immersa-android-html',
  transformIndexHtml: (html) => html.replace(/\s*<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>/g, ''),
});

export default defineConfig(({ mode }) => {
  const android = mode === 'android';
  return {
    plugins: [react(), ...(android ? [androidHtml()] : [])],
    define: {
      __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
      __ANDROID__: JSON.stringify(android),
    },
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 1200,
      outDir: android ? 'dist-android' : 'dist',
    },
  };
});
