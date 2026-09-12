const CACHE = 'turboclad-5060dbc4';
/* three.min.js is in the install list on purpose: the whole promise is that the
   app works with no signal, and a renderer that only turned up on the second
   open would break that on the one day it mattered. 132KB gzipped. */
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './three.min.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
/* Only a real copy of the app goes into the cache. 12 Sep 26, finding 28: the
   put was unconditional, so a 404/5xx from GitHub Pages (repo renamed, Pages
   outage, the 404 window mid-deploy) or a followed redirect replaced the
   cached index.html and was what the installed app showed with no signal. */
const keep = res => res && res.ok && !res.redirected && res.type === 'basic';
/* Signal but no throughput ("lie-fi" on site) used to hang the open until the
   browser gave up. Race the network against a timer: the cache answers, and
   the real response still lands in the cache when it finally arrives. */
const NET_MS = 6000;
self.addEventListener('fetch', e => {
  const isNav = e.request.mode === 'navigate' || (e.request.destination === 'document');
  if (isNav) {
    // network-first for the app itself: always freshest version when online
    const net = fetch(e.request);
    net.then(res => { if (keep(res)) { const cp = res.clone(), cp2 = res.clone(); caches.open(CACHE).then(c => { c.put(e.request, cp); c.put('./index.html', cp2); }); } }).catch(() => {});
    const timer = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), NET_MS));
    e.respondWith(Promise.race([net, timer])
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { if (keep(res)) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return res; }).catch(() => caches.match('./index.html'))));
  }
});
