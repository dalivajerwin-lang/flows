// Minimal service worker — exists to satisfy PWA installability criteria
// (Chrome/Edge require a registered service worker with a fetch handler on
// some platforms before firing `beforeinstallprompt`). No caching: every
// request goes straight to the network, so dev HMR and deploys are unaffected.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Network passthrough. The handler's presence is what matters for
  // installability; not calling respondWith() lets the browser handle
  // the request normally.
});
