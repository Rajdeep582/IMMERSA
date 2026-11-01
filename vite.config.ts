import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleMurphy } from './server/murphy/handler';

/**
 * `vite build` → website (unchanged). `vite build --mode android` → bundle for the Capacitor app:
 * fonts bundled locally (works offline), no Google Fonts requests, no service worker.
 */
const androidHtml = (): Plugin => ({
  name: 'immersa-android-html',
  transformIndexHtml: (html) => html.replace(/\s*<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>/g, ''),
});

/**
 * Doctor Murphy during `npm run dev` / `npm run preview`: serves /api/murphy with the same handler the
 * Vercel/Netlify function uses, reading GEMINI_API_KEY from .env.local (never bundled into the app).
 */
const murphyDev = (env: Record<string, string>): Plugin => {
  const mount = (use: (path: string, fn: (req: IncomingMessage, res: ServerResponse) => void) => void) =>
    use('/api/murphy', async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
      const request = new Request(`http://${req.headers.host ?? 'localhost'}/api/murphy`, { method: req.method, headers, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined });
      const response = await handleMurphy(request, { ...process.env, ...env });
      res.statusCode = response.status;
      response.headers.forEach((v, k) => res.setHeader(k, v));
      if (!response.body) return res.end();
      const reader = response.body.getReader();
      req.on('close', () => void reader.cancel());
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    });
  return {
    name: 'immersa-murphy-dev',
    configureServer(s) {
      mount((p, f) => void s.middlewares.use(p, f));
    },
    configurePreviewServer(s) {
      mount((p, f) => void s.middlewares.use(p, f));
    },
  };
};

export default defineConfig(({ mode }) => {
  const android = mode === 'android';
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), murphyDev(env), ...(android ? [androidHtml()] : [])],
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
