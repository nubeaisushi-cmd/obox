/*
  Service worker de Obox: recibe los avisos al celular aunque la app esté cerrada.
  Lee tus datos de Firebase desde firebase-config.js (no hay que pegar nada acá).
*/
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
self.window = self;
importScripts('firebase-config.js');

if (self.FIREBASE_CONFIG && self.FIREBASE_CONFIG.projectId) {
  firebase.initializeApp(self.FIREBASE_CONFIG);
  // Con un mensaje de tipo "notification" el navegador muestra el aviso solo.
  firebase.messaging();
}

// Al tocar el aviso: abre Obox (o vuelve a la pestaña que ya está abierta).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const fcm = data.FCM_MSG && data.FCM_MSG.fcmOptions ? data.FCM_MSG.fcmOptions.link : '';
  const target = data.link || fcm || self.registration.scope;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) { c.focus(); if ('navigate' in c) { try { c.navigate(target); } catch (e) {} } return; } }
      return self.clients.openWindow(target);
    })
  );
});
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
