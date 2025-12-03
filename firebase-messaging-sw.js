importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyB6yxt2JX4ubnFsiYf2stfdnHeqjNySiJc",
  authDomain: "lfcsd-days.firebaseapp.com",
  projectId: "lfcsd-days",
  storageBucket: "lfcsd-days.appspot.com",
  messagingSenderId: "520576481150",
  appId: "1:520576481150:web:b08a50be7b0d15e113e52f"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  const notification = payload.notification;
  self.registration.showNotification(notification.title, {
    body: notification.body,
    icon: notification.icon || '/icon.png',
    data: { url: notification.click_action || '/' }
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
