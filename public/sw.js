// public/sw.js
const STATIC_CACHE = "tenacious-static-v1";
const RUNTIME_CACHE = "tenacious-runtime-v1";

const PRECACHE_ASSETS = ["/", "/manifest.json", "/favicon.ico"];

// 1. Install event: Precache core shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      }),
  );
});

// 2. Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        // Claim clients immediately so the service worker controls them without a reload
        return self.clients.claim();
      }),
  );
});

// 3. Fetch event: Optimize caching strategies per request type
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests (e.g. POST, PUT, DELETE mutations)
  if (request.method !== "GET") {
    return;
  }

  // Skip non-http/https protocols (e.g. chrome-extension, data URIs)
  if (!request.url.startsWith("http")) {
    return;
  }

  const url = new URL(request.url);

  // A. Navigation Requests (Page reloads or transitions to other paths)
  //    Network-first, fallback to cached '/' (App Shell)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match("/");
      }),
    );
    return;
  }

  // B. Supabase REST API queries can contain sensitive CRM data. Always let
  // them hit the network/browser HTTP cache policy instead of Cache Storage.
  if (url.pathname.includes("/rest/v1/")) {
    return;
  }

  // C. Static Assets & Local files (scripts, stylesheets, web fonts, local images)
  //    Stale-While-Revalidate: return cache instantly, fetch and update cache in background
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      });

      return cachedResponse || fetchPromise;
    }),
  );
});
