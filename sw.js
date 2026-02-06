const CACHE_VERSION = "proofflow-v3";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

/* ---------- INSTALL ---------- */
self.addEventListener("install", event => {
  self.skipWaiting(); // activate immediately

  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

/* ---------- ACTIVATE ---------- */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (!key.startsWith(CACHE_VERSION)) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim(); // control open tabs
});

/* ---------- FETCH ---------- */
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  /* 🔴 Always revalidate core logic */
  if (
    url.pathname.endsWith("index.html") ||
    url.pathname.endsWith("app.js") ||
    url.pathname.endsWith(".json")
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  /* 🟢 Static assets: cache first */
  if (
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  /* Default */
  event.respondWith(networkFirst(request));
});

/* ---------- STRATEGIES ---------- */

async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await caches.match(request);
    return cached || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const fresh = await fetch(request);
  const cache = await caches.open(STATIC_CACHE);
  cache.put(request, fresh.clone());
  return fresh;
}
