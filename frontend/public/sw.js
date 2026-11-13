// ===== Service worker básico de MiReporte (PWA) =====
// - La página y sus archivos se guardan en caché para que abra rápido y aun sin señal.
// - Los datos de emergencias (API) y el tiempo real NUNCA se guardan: siempre deben estar frescos.
// - Los cuadros del mapa (OpenStreetMap) se guardan un tiempo para ahorrar datos móviles.
const VERSION = 'mireporte-v1';
const CACHE_APP = `${VERSION}-app`;
const CACHE_MAPA = `${VERSION}-mapa`;
const MAX_TESELAS = 300;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_APP).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icono-192.png'])));
  self.skipWaiting();
});

// Al activarse, borra cachés de versiones anteriores
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function limitarCache(nombre, maximo) {
  const cache = await caches.open(nombre);
  const claves = await cache.keys();
  for (let i = 0; i < claves.length - maximo; i++) await cache.delete(claves[i]);
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // API, fotos y Socket.IO: directo a la red (sin caché)
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io') || url.pathname.startsWith('/uploads')) return;

  // Teselas del mapa: primero caché, si no hay, red
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    e.respondWith(
      caches.open(CACHE_MAPA).then(async (cache) => {
        const guardada = await cache.match(request);
        if (guardada) return guardada;
        const resp = await fetch(request);
        if (resp.ok) { cache.put(request, resp.clone()); limitarCache(CACHE_MAPA, MAX_TESELAS); }
        return resp;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Navegación (abrir la página): primero red, si no hay señal, la versión guardada
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((resp) => { caches.open(CACHE_APP).then((c) => c.put('/', resp.clone())); return resp; })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Archivos de la app (JS, CSS, íconos): caché primero y se actualiza en segundo plano
  e.respondWith(
    caches.open(CACHE_APP).then(async (cache) => {
      const guardada = await cache.match(request);
      const red = fetch(request).then((resp) => { if (resp.ok) cache.put(request, resp.clone()); return resp; }).catch(() => guardada);
      return guardada || red;
    })
  );
});
