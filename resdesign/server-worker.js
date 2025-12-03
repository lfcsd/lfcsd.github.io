// service-worker.js
const CACHE_NAME = 'lfcsd-shell-v1';
const OFFLINE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/logo.png',
  // add any other assets you want cached
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // network-first for dynamic data (let browser handle), fallback to cache
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Show a notification for incoming push messages
self.addEventListener('push', function(event) {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    payload = { title: 'LFCSD', body: event.data?.text() || 'Update' };
  }
  const title = payload.title || 'LFCSD Update';
  const options = {
    body: payload.body || 'Tap to open.',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data || {}
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// respond to messages from page (for immediate notifications)
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'show-notification') {
    const title = data.title || 'LFCSD';
    const options = { body: data.body || '', icon: '/logo.png' };
    self.registration.showNotification(title, options);
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
