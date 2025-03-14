const CACHE_NAME = 'dino-tamagotchi-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/assets/egg_green.png',
  '/assets/dino_trex_level1.png',
  '/assets/dino_trex_green_eating.png',
  '/assets/dino_trex_green_playing.png',
  '/assets/dino_trex_green_washing.png',
  '/assets/dino_trex_green_sleeping.png',
  '/assets/dino_trex_green_hatching.png',
  '/assets/dino_trex_green_hungry.png',
  '/assets/dino_trex_green_bored.png',
  '/assets/dino_trex_green_smells.png',
  '/assets/dino_trex_green_happy.png',
  '/assets/background.png',
  '/assets/status_icons/hungry.png',
  '/assets/status_icons/happiness.png',
  '/assets/status_icons/cleaness.png',
  '/assets/status_icons/sleepiness.png',
  '/assets/action_icons/feeding.png',
  '/assets/action_icons/playing.png',
  '/assets/action_icons/bathing.png',
  '/assets/action_icons/sleep.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        // Make network request and cache the response
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the fetched response
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
  );
}); 