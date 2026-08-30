const CACHE = "kanji5-shell-v8";
const DATA_CACHE = "kanji5-data-v5";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./v1.2-enhancements.js", "./v1.2-runtime-fixes.js"];
const DATA_URL = new URL("./kanji-data.json", self.location.href).href;

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key.startsWith("kanji5-") && key !== CACHE && key !== DATA_CACHE)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheName, fallbackRequest = request) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (_) {
    return (await cache.match(fallbackRequest)) || Response.error();
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, CACHE, "./index.html"));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (url.href === DATA_URL) {
    event.respondWith(networkFirst(request, DATA_CACHE, request));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
