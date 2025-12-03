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

messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Received background message: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png' // optional
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
