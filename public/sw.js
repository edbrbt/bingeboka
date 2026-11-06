// Service worker: gjør at appen åpner uten nett. API-kall mellomlagres ikke her
// (appen holder selv på dataene sine i localStorage).
const VERSJON = 'bingeboka-v1';
const SKALL = ['/', '/index.html', '/app.js', '/stil.css', '/ikon.svg', '/ikon-192.png', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSJON).then((c) => c.addAll(SKALL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((n) => Promise.all(n.filter((k) => k !== VERSJON).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  // Nett først (så nye versjoner kommer fram), mellomlager når nettet er borte.
  e.respondWith(
    fetch(e.request)
      .then((svar) => {
        const kopi = svar.clone();
        caches.open(VERSJON).then((c) => c.put(e.request, kopi));
        return svar;
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('/index.html')))
  );
});
