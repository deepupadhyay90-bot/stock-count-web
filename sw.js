// Keeps the whole app on the phone so it opens without internet.
const CACHE='stock-count-10b338fcf9';
const FILES=["./", "index.html", "items.json", "xlsx.full.min.js", "zxing.min.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "img/a0.webp", "img/a1.webp", "img/a2.webp", "img/a3.webp", "img/a4.webp"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(async c=>{for(let i=0;i<FILES.length;i+=12)await c.addAll(FILES.slice(i,i+12))}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin) return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)));
});
