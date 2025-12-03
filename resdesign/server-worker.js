// service-worker.js

// Listen to push events from the browser
self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "LFCSD Days", body: event.data.text() };
  }

  const options = {
    body: data.body || 'No message content',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    tag: data.tag || 'lfcsd-days', // avoid duplicates
    renotify: true,
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'LFCSD Days', options)
  );
});

// Optional: handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Focus existing tab or open a new one
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

// Optional: handle push subscription updates
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('Push subscription changed:', event);
});
