// Offline shell for the phone app. Only the app's own files and the pinned
// supabase-js bundle are cached; Supabase data and videos always go to the network.
const CACHE = "agency-shell-v1";
const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", SUPABASE_JS];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (request.url === SUPABASE_JS) {
    // pinned version never changes, so the cached copy is always right
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // the app's own files: fresh when online, cached when not
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match("index.html")))
  );
});
