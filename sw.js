const CACHE = 'cladmate-3027e109';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const isNav = e.request.mode === 'navigate' || (e.request.destination === 'document');
  if (isNav) {
    // network-first for the app itself: always freshest version when online
    e.respondWith(fetch(e.request).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => { c.put(e.request, cp); c.put('./index.html', res.clone()); }); return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res; }).catch(() => caches.match('./index.html'))));
  }
});
