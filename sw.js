const CACHE_NAME = "goldenbuddy-cache-v2";
const STATIC_ASSETS = [
  "/", // root
  "/index.html",
  "/style.css",
  "/app.js",
  "/favicon.ico",
  "/manifest.json"
];

// Install: cache static assets
self.addEventListener("install", event => {
  console.log("[SW] Installing…");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); // Activate SW immediately
});

// Activate: clean old caches
self.addEventListener("activate", event => {
  console.log("[SW] Activating…");
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for app.js/index.html, cache-first for other assets
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  if (STATIC_ASSETS.includes(url.pathname) || url.pathname === "/") {
    // Network-first for core files
    event.respondWith(
      fetch(event.request)
        .then(res => {
          // update cache
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first for other assets
    event.respondWith(
      caches.match(event.request).then(res => res || fetch(event.request))
    );
  }
});

// Listen for skipWaiting message (used to update SW immediately)
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

