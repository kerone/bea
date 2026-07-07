/* =============================================================
 * PRECISSA INSTITUTE · Service Worker
 * Estrategia:
 *   · HTML → network-first (siempre fresco; caché solo como fallback offline)
 *   · JS/CSS same-origin y jsdelivr → stale-while-revalidate (rápido, y el
 *     deploy llega en la siguiente visita aunque nadie suba CACHE_VERSION)
 *   · resto de estáticos (imágenes, fuentes) → cache-first
 * Bypass total a Supabase y FormSubmit (datos dinámicos, no se cachean).
 * ============================================================= */

const CACHE_VERSION = 'v30';
const CACHE_NAME = 'precissa-' + CACHE_VERSION;

// Assets críticos pre-cacheados en install (la primera visita ya queda
// offline-ready). Solo lo pequeño e imprescindible: los favicons grandes
// (512/maskable, ~430 KB) los pide el instalador PWA cuando toca y se
// cachean on-demand; precachearlos competía con la carga inicial en móvil.
const PRECACHE_URLS = [
  '/',
  '/cursos/',
  '/cursos/plasmapen-valencia/',
  '/cursos/electroestetica-valencia/',
  '/manifest.webmanifest',
  '/assets/favicon-32.png',
  '/assets/seal-ss.webp',
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
  // jsdelivr sirve supabase-js y marked: sin él en caché, la materia de los
  // cursos no funciona offline aunque el resto de la PWA sí.
  const isJsdelivr = url.hostname === 'cdn.jsdelivr.net';
  if (!isSameOrigin && !isFontCdn && !isJsdelivr) return;

  const accept = req.headers.get('accept') || '';
  const isHtml = req.mode === 'navigate' || accept.includes('text/html');

  if (isHtml) {
    // Network-first para HTML: contenido siempre fresco si hay red.
    // Fallback offline: la propia página si se visitó, o la home.
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

  const isCode = /\.(js|css)($|\?)/.test(url.pathname) || isJsdelivr;

  if (isCode) {
    // Stale-while-revalidate para JS/CSS: se responde al instante desde
    // caché pero SIEMPRE se revalida en segundo plano. Antes era
    // cache-first puro y un deploy que cambiara un JS era invisible para
    // visitantes recurrentes hasta subir CACHE_VERSION a mano.
    event.respondWith(
      caches.match(req).then((cached) => {
        const refresh = fetch(req).then((resp) => {
          if (resp && resp.ok && (resp.type === 'basic' || resp.type === 'cors')) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => null);
          }
          return resp;
        }).catch(() => cached);
        return cached || refresh;
      })
    );
    return;
  }

  // Cache-first para el resto (imágenes, fuentes): rápido y offline
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
