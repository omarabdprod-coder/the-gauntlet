/* The Gauntlet — service worker. Stale-while-revalidate for assets (instant
   repeat loads + offline), network-first for the page (so deploys show up).
   Bump CACHE when you ship a big change to force a clean refresh. */
const CACHE = 'gauntlet-v1';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest',
  'css/styles.css', 'css/skin.css',
  'js/core.js', 'js/data.js', 'js/players_generated.js', 'js/iconic_bestof.js',
  'js/sim.js', 'js/run.js', 'js/sound.js', 'js/store.js', 'js/ui.js', 'js/app.js',
  'assets/icon-192.png', 'assets/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return; // let the browser handle fonts / 3rd-party
  // network-first for the page itself so new deploys are picked up
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    e.respondWith(fetch(req).then(function (r) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); return r; }).catch(function () { return caches.match(req).then(function (m) { return m || caches.match('index.html'); }); }));
    return;
  }
  // stale-while-revalidate for static assets
  e.respondWith(caches.match(req).then(function (m) {
    var net = fetch(req).then(function (r) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); return r; }).catch(function () { return m; });
    return m || net;
  }));
});
