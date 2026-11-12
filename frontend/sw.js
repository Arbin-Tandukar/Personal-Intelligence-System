// PIS Service Worker for PWA Home Screen Installation & Offline App Shell
const CACHE_NAME = 'pis-v1.0.0';
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/css/style.css',
    '/js/api.js',
    '/js/app.js',
    '/js/auth.js',
    '/js/dashboard.js',
    '/js/profile.js',
    '/js/study.js',
    '/js/fitness.js',
    '/js/habits.js',
    '/js/finance.js',
    '/js/tasks.js',
    '/js/journal.js',
    '/js/analytics.js',
    '/js/ai.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('Some static assets failed to precache:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API calls always go to network directly
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Network-first for dynamic navigation, cache fallback
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // If good response and GET, optionally update cache
                if (response && response.status === 200 && event.request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }
                });
            })
    );
});
