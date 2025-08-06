// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules

// Names of the two caches used in this version of the service worker.
// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';
const DATA_CACHE = 'data-cache-v1';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  'index.html',
  './', // Alias for index.html
  './static/css/',
  './static/js/',
  './manifest.json',
  './favicon.ico',
  './logo192.png',
  './logo512.png',
  './offline.html',
  './sounds/',
  './sounds/celebration.mp3',
  './sounds/ticking.mp3',
  './sounds/welcome-good-luck.mp3',
  './sounds/tsehay.mp3'
];

// The install handler takes care of precaching the resources we always need.
/* eslint-disable no-restricted-globals */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(async cache => {
        // First try to add all URLs as specified
        try {
          await cache.addAll(PRECACHE_URLS);
        } catch (error) {
          console.error('Error during precaching:', error);
          
          // If there's an error, try to add each URL individually
          for (const url of PRECACHE_URLS) {
            try {
              await cache.add(url);
            } catch (individualError) {
              console.error(`Error caching ${url}:`, individualError);
            }
          }
        }
      })
      .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
  const currentCaches = [PRECACHE, RUNTIME, DATA_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {
  // Skip cross-origin requests, like those for Google Analytics.
  if (event.request.url.startsWith(self.location.origin)) {
    // Special handling for audio files with special characters
    if (event.request.url.includes('/sounds/') && event.request.url.includes('%')) {
      // Try to match the decoded URL against our cache
      const decodedUrl = decodeURIComponent(event.request.url);
      event.respondWith(
        caches.match(new Request(decodedUrl)).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If not in cache with decoded URL, try the original request
          return caches.match(event.request).then(originalCachedResponse => {
            if (originalCachedResponse) {
              return originalCachedResponse;
            }
            // If still not found, fetch from network
            return fetch(event.request);
          });
        })
      );
      return;
    }
    // For API requests, try the network first, fall back to the cache, then the offline page
    if (event.request.url.includes('/api/')) {
      event.respondWith(
        caches.open(DATA_CACHE).then(async cache => {
          try {
            const response = await fetch(event.request);
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          } catch (err) {
            // Network request failed, try to get it from the cache.
            const cachedResponse = await cache.match(event.request);
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If we're offline and don't have cached data for this API request,
            // return a custom offline response
            return new Response(JSON.stringify({
              isOffline: true,
              message: 'You are currently offline. Some features may be unavailable.'
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        })
      );
    } else {
      // For non-API requests, stale-while-revalidate
      event.respondWith(
        caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            // If we have a matching response in the cache, return it, but also
            // fetch an update for next time.
            fetch(event.request).then(response => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                caches.open(RUNTIME).then(cache => {
                  cache.put(event.request, response.clone());
                });
              }
            });
            return cachedResponse;
          }

          // If we don't have a cached response, fetch and cache
          return fetch(event.request).then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              const responseToCache = response.clone();
              caches.open(RUNTIME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          }).catch(() => {
            // If the fetch fails (e.g., because we're offline), return the offline page
            if (event.request.mode === 'navigate') {
              return caches.match('index.html');
            }
            // For other requests, just return a simple offline response
            return new Response('You are offline and this resource is not cached.');
          });
        })
      );
    }
  }
});

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
/* eslint-enable no-restricted-globals */