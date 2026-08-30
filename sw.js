const CACHE = "kanji5-shell-v3";
const DATA_CACHE = "kanji5-data-v1";
const APP = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];
const DATA_HOSTS = new Set([
  "raw.githubusercontent.com",
  "kanjiapi.dev"
]);

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith("kanji5-") && key !== CACHE && key !== DATA_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // Always prefer fresh HTML so a newly published version is not hidden
  // behind the previous Service Worker cache.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(response => response || caches.match("./index.html")))
    );
    return;
  }

  // Same-origin static assets: serve cache immediately, then refresh them.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request).then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Cache the large Kanji dataset and example-word responses for offline use.
  // Network-first keeps data reasonably fresh while falling back to cache offline.
  if (DATA_HOSTS.has(url.hostname)) {
    event.respondWith(
      caches.open(DATA_CACHE).then(cache =>
        fetch(request)
          .then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cache.match(request))
      )
    );
  }
});
