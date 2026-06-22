/*
 * Ager service worker — installability + a cached static shell.
 *
 * Scope: only same-origin GET requests for build-immutable static assets
 * (/_next/static, /brand) are cached (cache-first). HTML navigations and /api/*
 * always hit the network, so personalized feeds and auth are never served stale.
 */
const STATIC_CACHE = "ager-static-v1";
const STATIC_PREFIXES = ["/_next/static", "/brand"];

self.addEventListener("install", () => {
  // Activate this worker as soon as it finishes installing.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  const isStatic = STATIC_PREFIXES.some((prefix) =>
    url.pathname.startsWith(prefix),
  );
  if (!isStatic) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    })(),
  );
});
