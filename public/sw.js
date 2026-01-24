// Enhanced Service Worker for Furama Resort Digital Concierge PWA
// Version 2.0 - Improved caching strategies

const CACHE_NAME = 'furama-concierge-v2.0';
const STATIC_CACHE_NAME = 'furama-static-v2.0';
const DYNAMIC_CACHE_NAME = 'furama-dynamic-v2.0';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo.png',
    '/icon-192x192.png',
    '/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
            })
            .catch((error) => {
                console.error('[Service Worker] Failed to cache static assets:', error);
            })
    );
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete old caches
                    if (cacheName !== STATIC_CACHE_NAME && 
                        cacheName !== DYNAMIC_CACHE_NAME &&
                        cacheName.startsWith('furama-')) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Take control of all pages immediately
    return self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests (unless they're for our API)
    if (url.origin !== location.origin && !url.pathname.startsWith('/api/')) {
        return;
    }

    // Strategy 1: Cache First for static assets (images, fonts, CSS, JS)
    if (isStaticAsset(request.url)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Strategy 2: Network First for API calls and dynamic content
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Strategy 3: Network First with fallback for HTML pages
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirstWithFallback(request));
        return;
    }

    // Default: Network First
    event.respondWith(networkFirst(request));
});

// Helper: Check if request is for static asset
function isStaticAsset(url) {
    const staticExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.css', '.js'];
    return staticExtensions.some(ext => url.includes(ext));
}

// Cache First Strategy - for static assets
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('[Service Worker] Cache First error:', error);
        // Return a fallback if available
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        // Return offline page or error response
        return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Network First Strategy - for API calls
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] Network failed, trying cache:', error);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        // Return error response for API calls
        return new Response(JSON.stringify({ 
            error: 'Offline', 
            message: 'No internet connection. Please check your connection and try again.' 
        }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Network First with Fallback - for HTML pages
async function networkFirstWithFallback(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] Network failed, trying cache:', error);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        // Fallback to index.html for SPA routing
        const indexResponse = await caches.match('/index.html');
        if (indexResponse) {
            return indexResponse;
        }
        return new Response('Offline - Please check your internet connection', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

// Background sync for offline actions (optional enhancement)
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Implement background sync logic here if needed
    console.log('[Service Worker] Background sync triggered');
}

// Push notifications (optional enhancement)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            vibrate: [200, 100, 200],
            tag: data.tag || 'furama-notification',
            data: data.data || {}
        };
        event.waitUntil(
            self.registration.showNotification(data.title || 'Furama Resort', options)
        );
    }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});
