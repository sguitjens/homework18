'use strict';

// Update cache names any time any of the cached files change.
const CACHE_NAME = 'static-cache-v3';
const DATA_CACHE_NAME = 'data-cache-v3';

// Add list of files to cache here.
const FILES_TO_CACHE = [
  '/',
  '/index.js',
  '/index.html',
  '/db.js',
  '/styles.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// INSTALL
self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');
  // Precache static resources here.
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
  // Remove previous cached data from disk.
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// FETCH
// self.addEventListener("fetch", evt => {
//     evt.respondWith(fetch(event.request).catch(function() { // error here: event is not defined
//       return caches.match(event.request)
//       .then(function(response) {
//         if (response) {
//           return response;
//         } else if (event.request.headers.get("accept").includes("text/html")) {
//           return caches.match("/index.html");
//         }
//       });
//     }));
// });


// FETCH
self.addEventListener("fetch", evt => {
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }
            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
              return cache.match(evt.request); // ERROR: chart is not defined
            
          });
      }).catch(err => {
        console.log(err)
      })
    );

    return;
  }

  evt.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(evt.request)
      .then(response => {
        return response || fetch(evt.request);
      });
    })
  );
});
