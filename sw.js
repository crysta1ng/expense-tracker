// Offline cache + controlled updates for the Expense Tracker PWA.
// VERSION is bumped automatically on every build so clients pick up new releases.
const VERSION = '20260619-101217';
const CACHE = 'expense-tracker-' + VERSION;
const ASSETS = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  // Note: we do NOT skipWaiting here. The new worker waits until the user
  // taps "Update" in the app (or all tabs close), so updates are never jarring.
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The app posts this when the user taps "Update".
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Cache-first, fall back to network, fall back to cached shell when offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
