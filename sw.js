// Service Worker for notifications and caching
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('finzapp-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/css/styles.css',
        '/css/auth.css',
        '/js/app.js'
      ]);
    })
  );
  
  // Force activation
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Take control of all clients
      clients.claim(),
      
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== 'finzapp-v1')
            .map(cacheName => caches.delete(cacheName))
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Clone the request - request can only be used once
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response - response can only be used once
          const responseToCache = response.clone();
          
          caches.open('finzapp-v1').then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
  );
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icon.png',
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'view',
        title: 'Ver detalle'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('FinzApp', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    // Open specific view based on notification data
    clients.openWindow('/vencimientos');
  } else {
    // Default action - open app
    clients.openWindow('/');
  }
});