/* =============================================================
 * PRECISSA INSTITUTE · Service Worker
 * Estrategia: network-first para HTML (siempre fresco), cache-first
 * para assets estaticos (rapido y offline). Bypass total a Supabase
 * y FormSubmit (datos dinamicos, no se cachean).
 * ============================================================= */

const CACHE_VERSION = 'v25';
const CACHE_NAME = 'precissa-' + CACHE_VERSION;

// Assets criticos pre-cacheados en install (la primera visita ya
// queda offline-ready). El resto se cachea on-demand.
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/assets/favicon-32.png',
  '/assets/favicon-180.png',
  '/assets/favicon-192.png',
  '/assets/favicon-512.png',
  '/assets/favicon-192-maskable.png',
  '/assets/favicon-512-maskable.png',
  '/assets/seal-ss.webp',
  '/assets/seal-ss-lg.webp',
  '/assets/legal.css',
  '/assets/legal.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function isBypassed(url) {
  // Nunca cachear estos hosts: contenido dinamico / auth / formularios
  return url.hostname.includes('supabase')
      || url.hostname.includes('formsubmit')
      || url.hostname.includes('google.com')
      || url.hostname.includes('googletagmanager')
      || url.hostname.includes('googleapis.com') && url.pathname.includes('oauth');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  if (isBypassed(url)) return; // deja pasar a la red sin tocar

  const isSameOrigin = url.origin === self.location.origin;
  const isFontCdn = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!isSameOrigin && !isFontCdn) return;

  const accept = req.headers.get('accept') || '';
  const isHtml = req.mode === 'navigate' || accept.includes('text/html');

  if (isHtml) {
    // Network-first para HTML: contenido siempre fresco si hay red
    event.respondWith(
      fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => null);
        return resp;
      }).catch(() =>
        caches.match(req).then((m) => m || caches.match('/'))
      )
    );
    return;
  }

  // Cache-first para todo lo demas: rapido y offline
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        if (resp && resp.ok && (resp.type === 'basic' || resp.type === 'cors')) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => null);
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
