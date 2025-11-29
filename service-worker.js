const CACHE_NAME = 'cims-cache-v1';

// List of files to be cached. This includes the main HTML, manifest, and the Tailwind CDN script.
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://cdn.tailwindcss.com'
];

// Installation: Caches the initial assets
self.addEventListener('install', event => {
    // Perform installation steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and cached essential files');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('Failed to cache files during install:', err);
            })
    );
});

// Activation: Cleans up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Delete old caches
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch: Handles requests, serving from cache first, then network
self.addEventListener('fetch', event => {
    // We only cache GET requests
    if (event.request.method !== 'GET') return;

    // Skip the external Google Apps Script URL as it's an API endpoint, not a static asset to cache.
    // The web app relies on dynamic data from this endpoint.
    if (event.request.url.includes('script.google.com/macros')) {
        return fetch(event.request);
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // Fallback to network
                return fetch(event.request);
            }
        )
    );
});
