/* PEA service worker: makes the app installable and fast, without ever
   serving stale market data. */
const CACHE = "pea-v1";
const SHELL = ["/", "/leaderboard", "/feed", "/tokens", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle our own origin; let the browser fetch the explorer, fonts and
  // any external API directly (never cache live data).
  if (url.origin !== self.location.origin) return;
  // Never cache API route handlers, keep market data fresh.
  if (url.pathname.startsWith("/api/")) return;

  // HTML navigations: network-first, fall back to cache (offline shell).
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Static assets: cache-first, then network (and cache it).
  const isStatic =
    url.pathname.startsWith("/_next/") ||
    /\.(?:png|jpe?g|svg|webp|gif|ico|css|js|woff2?|ttf)$/.test(url.pathname);
  if (!isStatic) return;

  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached),
    ),
  );
});
