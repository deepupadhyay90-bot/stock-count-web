// Keeps the Floral stock count app on the phone so it opens and works without internet.
// Counts saved offline wait in the phone's storage and upload to the master sheet when back online.
const VER = 'dcc-v1';
const CORE = ['./', 'index.html', 'items.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png', 'icon-maskable-512.png'];
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const BUNDLES = Array.from({ length: 41 }, (_, i) => `b/${i}.json`);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('dcc-') && k !== VER && k !== VER + '-img').map(k => caches.delete(k)));
    await self.clients.claim();
    precacheRest();
  })());
});

async function precacheRest() {
  const c = await caches.open(VER);
  try { if (!(await c.match(XLSX_URL))) { const r = await fetch(XLSX_URL, { mode: 'cors' }); if (r.ok) await c.put(XLSX_URL, r); } } catch (e) {}
  for (const b of BUNDLES) {
    try { if (!(await c.match(b))) { const r = await fetch(b); if (r.ok) await c.put(b, r); } } catch (e) {}
  }
  const all = await self.clients.matchAll();
  all.forEach(cl => cl.postMessage({ type: 'offline-progress' }));
}

self.addEventListener('message', e => { if (e.data === 'precache') precacheRest(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com')) return; // master sheet: never cached
  if (req.destination === 'image' && url.origin !== location.origin) {   // product photos from image links: keep a copy for offline
    e.respondWith(caches.open(VER + '-img').then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      const r = await fetch(req); if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r;
    }));
    return;
  }
  if (url.href === XLSX_URL) { e.respondWith(caches.match(XLSX_URL).then(r => r || fetch(req))); return; }
  if (url.origin !== location.origin) return;
  if (url.pathname.includes('/b/')) {            // photos: cache first
    e.respondWith(caches.open(VER).then(async c => {
      const hit = await c.match(req, { ignoreSearch: true });
      if (hit) return hit;
      const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r;
    }));
    return;
  }
  // page and item list: fresh when online, stored copy when offline
  e.respondWith(caches.open(VER).then(async c => {
    try {
      const r = await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' });   // always check for the newest version
      if (r.ok) c.put(req, r.clone());
      return r;
    } catch (err) {
      return (await c.match(req, { ignoreSearch: true })) || (await c.match('index.html')) || Response.error();
    }
  }));
});
