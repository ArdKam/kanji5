const CACHE = "kanji5-shell-v15";
const DATA_CACHE = "kanji5-data-v9";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./v1.3-p0.js", "./v1.3-production-ui.js", "./v1.3-p1.js", "./v1.2-enhancements.js", "./v1.2-runtime-fixes.js", "./supabase-config.js", "./supabase-sync.js"];
const DATA_URL = new URL("./kanji-data.json", self.location.href).href;

self.addEventListener("install", event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE).then(cache => cache.addAll(SHELL)),
      caches.open(DATA_CACHE).then(cache => cache.add("./kanji-data.json"))
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith("kanji5-") && key !== CACHE && key !== DATA_CACHE)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

async function cacheFirst(request, cacheName, fallbackRequest = request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(fallbackRequest);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (_) {
    return (await cache.match(fallbackRequest)) || Response.error();
  }
}

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
    event.respondWith((async () => {
      const response = await networkFirst(request, CACHE, "./index.html");
      try {
        const html = await response.text();
        let injected = html;
        if (!html.includes('src="./v1.3-production-ui.js"')) {
          injected = injected.replace('<script src="./v1.3-p1.js"></script>', '<script src="./v1.3-production-ui.js"></script><script src="./v1.3-p1.js"></script>');
        }
        if (!html.includes('src="./v1.3-p0.js"')) {
          injected = injected.replace("<script type=\"module\">", '<script src="./v1.3-p0.js"></script><script type="module">');
        }
        injected = injected.replace(
          'const mod=await Promise.race([import(FSRS_URL),new Promise((_,reject)=>setTimeout(()=>reject(new Error("FSRS_LOAD_TIMEOUT")),10000))]);',
          'const mod=await Promise.race([window.__KANJI5_P0_FSRS_PROMISE || import(FSRS_URL),new Promise((_,reject)=>setTimeout(()=>reject(new Error("FSRS_LOAD_TIMEOUT")),10000))]);'
        );
        if (injected !== html) {
          const headers = new Headers(response.headers);
          headers.delete("content-length");
          headers.set("cache-control", "no-cache");
          return new Response(injected, {status: response.status, statusText: response.statusText, headers});
        }
      } catch (_) {}
      return response;
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (url.href === DATA_URL) {
    event.respondWith(cacheFirst(request, DATA_CACHE, "./kanji-data.json"));
    return;
  }

  event.respondWith(caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    });
  }));
});
