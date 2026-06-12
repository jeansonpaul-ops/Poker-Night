/* Poker Night — service worker (cache-first, version simple) */
var CACHE = 'pokernight-v1';
var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  /* Réseau d'abord pour Firestore / Google, cache d'abord pour le reste */
  if (e.request.url.indexOf('googleapis') !== -1 || e.request.url.indexOf('gstatic') !== -1) return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      return cached || fetch(e.request).then(function (resp) {
        if (e.request.method === 'GET' && resp.ok) {
          var clone = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        }
        return resp;
      });
    })
  );
});
