// Verhoog dit nummer bij elke wijziging aan de bestanden, dan haalt de app de nieuwe versie op.
const CACHE = 'plantmagneten-v17';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './planten.json',
  './vendor/jspdf.umd.min.js',
  './fonts/AtkinsonHyperlegible-Regular.ttf',
  './fonts/AtkinsonHyperlegible-Bold.ttf',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Eerst het netwerk (zodat updates meteen zichtbaar zijn), zonder internet de opgeslagen versie.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
