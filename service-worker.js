const CACHE_NAME = 'cims-cache-v1';
const APP_BASE_PATH = '/creatix-app'; // Define your subfolder path here

// List of files to be cached. All paths must now be absolute, including the subfolder.
const urlsToCache = [
    APP_BASE_PATH + '/',
    APP_BASE_PATH + '/index.html',
    APP_BASE_PATH + '/manifest.json',
    APP_BASE_PATH + '/Creatix.png' // Assuming your icon is in the same folder
    // Add any other CSS/JS bundles with the APP_BASE_PATH prefix here
];

// Installation: Caches the initial assets
self.addEventListener('install', event => {
    // Perform installation steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and cached essential files');
                // This operation will fail if any URL in urlsToCache is invalid.
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('Failed to cache files during install:', err);
            })
    );
});

// Activation: Cleans up old caches (This part is correct)
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
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

    // Use URL object to check the path
    const url = new URL(event.request.url);

    // 1. Skip the external Google Apps Script URL (API endpoint)
    if (event.request.url.includes('script.google.com/macros')) {
        return fetch(event.request);
    }
    
    // 2. Explicitly map the PWA launch/navigation paths to the cached index file
    // This resolves the "file not found" issue when launching the installed PWA.
    if (url.pathname === APP_BASE_PATH + '/' || url.pathname === APP_BASE_PATH + '/index.html') {
        event.respondWith(
            // Return the cached index.html using its correct cache key
            caches.match(APP_BASE_PATH + '/index.html')
                .then(response => {
                    // Serve cached response, or fallback to network if not found
                    return response || fetch(event.request);
                })
        );
        return; // Stop processing and use the response above
    }

    // 3. Default Cache-First strategy for all other assets
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // Fallback to network
                return fetch(event.request);
            })
    );
});
