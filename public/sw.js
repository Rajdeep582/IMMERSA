// Asset cache for repeat visits: anatomy meshes (models/), registries (data/) and hashed bundles
// (assets/) are immutable within one build, so they are served cache-first. Each build registers
// with its own version and old caches are deleted on activation.
const VERSION = new URL(self.location.href).searchParams.get('v') || '0';
const CACHE = 'immersa-assets-' + VERSION;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('immersa-assets-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !/\/(models|data|assets)\//.test(url.pathname)) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && res.status === 200) cache.put(req, res.clone()).catch(() => undefined);
      return res;
    }),
  );
});
