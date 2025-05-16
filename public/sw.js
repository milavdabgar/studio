
const CACHE_NAME = 'polymanager-cache-v1';
const OFFLINE_URL = '/offline.html';
// Add more assets to cache as your app grows
const CORE_ASSETS = [
  '/',
  '/offline.html',
  // Add paths to your main CSS and JS bundles if you know them
  // e.g., '/_next/static/css/main.css', '/_next/static/chunks/main-app.js'
  // For Next.js, these paths are dynamic. A more robust solution uses next-pwa.
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting()) // Force activation
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  // Remove old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          const networkResponse = await fetch(event.request);
          // Optionally cache successful navigation responses
          // if (networkResponse.ok) {
          //   const cache = await caches.open(CACHE_NAME);
          //   cache.put(event.request, networkResponse.clone());
          // }
          return networkResponse;
        } catch (error) {
          console.log('[Service Worker] Fetch failed; returning offline page instead.', error);
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(OFFLINE_URL);
          return cachedResponse;
        }
      })()
    );
  } else if (CORE_ASSETS.includes(event.request.url) || event.request.destination === 'style' || event.request.destination === 'script' || event.request.destination === 'image') {
    // Cache-first strategy for core assets and static resources
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then(c => c.put(event.request, networkResponse.clone()));
          }
          return networkResponse;
        }).catch(async (error) => {
          console.log('[Service Worker] Fetch failed for non-navigation request; returning offline page if appropriate.', error);
          // For non-navigation assets, we might not want to return offline.html
          // but this depends on the asset type. For simplicity, we don't for now.
          // Consider returning a placeholder image/style if it's an image/style request
          const cache = await caches.open(CACHE_NAME);
          if (event.request.url.endsWith('.png') || event.request.url.endsWith('.jpg') || event.request.url.endsWith('.jpeg')) {
             // Could return a placeholder image from cache
          }
          return new Response(null, { status: 404, statusText: 'Not Found In Cache' });
        });
      })
    );
  }
});
