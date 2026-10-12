// Keeps the whole app on the phone so it opens without internet.
const CACHE='stock-count-c134ee93cb';
const FILES=["./", "index.html", "items.json", "xlsx.full.min.js", "zxing.min.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "img/a0-79fd877b.webp", "img/a1-beadf3cf.webp", "img/a2-c48bf9a9.webp", "img/a3-2fa0b7ea.webp", "img/a4-e88c8415.webp"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(async c=>{for(let i=0;i<FILES.length;i+=12)await Promise.all(FILES.slice(i,i+12).map(f=>fetch(new Request(f,{cache:'reload'})).then(r=>{if(!r.ok)throw new Error(f);return c.put(f,r)})))}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin) return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)));
});
