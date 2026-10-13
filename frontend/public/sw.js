/* Sohrab Air — offline/fast cache.
 * - /_next/static/* and images/fonts: cache-first (file names are content-hashed, never change)
 * - pages and data: stale-while-revalidate (show cached instantly, refresh in background)
 * - /api/*: never cached (live backend data)
 */
const VERSION = "sohrab-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const PRECACHE = ["/", "/hajj-umrah/", "/ticketing/", "/recruitment/", "/group-leader/", "/admin/", "/brand-logo.svg", "/favicon.svg"].map(p => BASE + p);

self.addEventListener("install", event => {
  event.waitUntil(caches.open(PAGES).then(c => Promise.allSettled(PRECACHE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const isStatic = url => url.pathname.includes("/_next/static/") || /\.(?:js|css|woff2?|svg|png|jpe?g|webp|gif|ico)$/i.test(url.pathname);

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith(BASE + "/api/")) return;

  if (isStatic(url)) {
    event.respondWith(caches.open(STATIC).then(async cache => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === "opaque") cache.put(req, res.clone());
      return res;
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;
  event.respondWith(caches.open(PAGES).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || network;
  }));
});
