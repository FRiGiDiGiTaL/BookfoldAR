const CACHE_VERSION = 'bookfoldar-v2.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Files to cache immediately (critical resources)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/glassmorphism.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('💾 [SW] Install');

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('📦 [SW] Precaching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('⚠️ [SW] Failed to precache some assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🔄 [SW] Activate');

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (!key.startsWith(CACHE_VERSION)) {
            console.log('🗑️ [SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    // Always try network first for HTML pages
    event.respondWith(networkFirst(request, STATIC_CACHE));
  } else if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    // Stale-while-revalidate for styles/scripts
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  } else if (url.pathname.startsWith('/api/') || url.pathname.endsWith('.pdf')) {
    // Network-first for APIs and PDFs
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else {
    // Default: Cache-first with network fallback
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
  }
});

// Strategies
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const networkResp = await fetch(request);
    if (networkResp.ok) cache.put(request, networkResp.clone());
    return networkResp;
  } catch {
    return new Response('Offline - Resource unavailable', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const networkResp = await fetch(request);
    if (networkResp.ok) cache.put(request, networkResp.clone());
    return networkResp;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Offline - Network unavailable', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResp) => {
      if (networkResp.ok) cache.put(request, networkResp.clone());
      return networkResp;
    })
    .catch(() => null);

  return cached || fetchPromise;
}
