
const CACHE_NAME = 'gpp-next-cache-v3';
const OFFLINE_URL = '/offline.html';

// Define different cache types for better organization
const STATIC_CACHE = 'gpp-static-v3';
const STUDENT_DATA_CACHE = 'gpp-student-data-v3';
const IMAGES_CACHE = 'gpp-images-v3';

// Core assets to cache immediately (excluding root to prevent cache issues)
const CORE_ASSETS = [
  '/offline.html',
  '/manifest.json',
];

// Student-specific pages that should work offline
const STUDENT_PAGES = [
  '/student/dashboard',
  '/student/profile',
  '/student/timetable',
  '/student/courses',
  '/student/assessments',
  '/student/results',
  '/login',
];

// API endpoints that should be cached for offline access
const CACHEABLE_API_ROUTES = [
  '/api/students',
  '/api/courses',
  '/api/timetables',
  '/api/assessments',
  '/api/results'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      }),
      caches.open(STUDENT_DATA_CACHE).then((cache) => {
        console.log('[Service Worker] Pre-caching student pages');
        return cache.addAll(STUDENT_PAGES.map(page => page + '?offline=true'));
      })
    ]).then(() => self.skipWaiting()) // Force activation
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  // Remove old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![STATIC_CACHE, STUDENT_DATA_CACHE, IMAGES_CACHE].includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients
  );
});

// Helper function to check if a request can be cached
function canCache(request) {
  return request.url.startsWith('http://') || request.url.startsWith('https://');
}

// Helper function to determine cache strategy based on request
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // Images - cache first with long expiry
  if (request.destination === 'image') {
    return 'cache-first-images';
  }
  
  // Student pages - network first, fallback to cache
  if (STUDENT_PAGES.some(page => url.pathname.startsWith(page))) {
    return 'network-first-student';
  }
  
  // API routes for student data - network first with cache fallback
  if (CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route))) {
    return 'network-first-api';
  }
  
  // Static assets - cache first
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'font') {
    return 'cache-first-static';
  }
  
  // Navigation requests
  if (request.mode === 'navigate') {
    return 'network-first-navigation';
  }
  
  return 'network-only';
}

self.addEventListener('fetch', (event) => {
  if (!canCache(event.request)) {
    return;
  }

  const strategy = getCacheStrategy(event.request);
  
  switch (strategy) {
    case 'cache-first-images':
      event.respondWith(cacheFirstStrategy(event.request, IMAGES_CACHE));
      break;
      
    case 'network-first-student':
      event.respondWith(networkFirstStrategy(event.request, STUDENT_DATA_CACHE));
      break;
      
    case 'network-first-api':
      event.respondWith(networkFirstStrategy(event.request, STUDENT_DATA_CACHE, { maxAge: 300000 })); // 5 minutes
      break;
      
    case 'cache-first-static':
      event.respondWith(cacheFirstStrategy(event.request, STATIC_CACHE));
      break;
      
    case 'network-first-navigation':
      event.respondWith(navigationStrategy(event.request));
      break;
      
    default:
      // Network only - don't cache
      break;
  }
});

// Cache-first strategy
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Cache-first fetch failed:', error);
    return new Response(null, { status: 404, statusText: 'Not Found' });
  }
}

// Network-first strategy
async function networkFirstStrategy(request, cacheName, options = {}) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      // Add timestamp for cache invalidation
      const responseToCache = networkResponse.clone();
      if (options.maxAge) {
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cache-timestamp', Date.now().toString());
        const body = await responseToCache.blob();
        const cachedResponse = new Response(body, { headers });
        cache.put(request, cachedResponse);
      } else {
        cache.put(request, responseToCache);
      }
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network-first fetch failed, trying cache:', error);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && options.maxAge) {
      const timestamp = cachedResponse.headers.get('sw-cache-timestamp');
      if (timestamp && (Date.now() - parseInt(timestamp)) > options.maxAge) {
        console.log('[Service Worker] Cached response expired');
        return new Response(null, { status: 504, statusText: 'Gateway Timeout' });
      }
    }
    
    return cachedResponse || new Response(null, { status: 504, statusText: 'Gateway Timeout' });
  }
}

// Navigation strategy with offline fallback (more conservative)
async function navigationStrategy(request) {
  try {
    // Always try network first for navigation
    const networkResponse = await fetch(request, {
      cache: 'no-cache'
    });
    
    // Cache successful student pages only
    if (networkResponse.ok) {
      const url = new URL(request.url);
      if (STUDENT_PAGES.some(page => url.pathname.startsWith(page))) {
        const cache = await caches.open(STUDENT_DATA_CACHE);
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Navigation fetch failed, checking for cached version:', error);
    
    // Try to find cached version of the specific page
    const cache = await caches.open(STUDENT_DATA_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Only show offline page if we're truly offline (check navigator.onLine)
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const staticCache = await caches.open(STATIC_CACHE);
      return staticCache.match(OFFLINE_URL);
    }
    
    // If we're online but request failed, return a generic error instead of offline page
    return new Response('Network Error', {
      status: 504,
      statusText: 'Gateway Timeout',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
