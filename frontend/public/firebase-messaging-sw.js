/**
 * firebase-messaging-sw.js — Service Worker for Sentinel Vault FCM
 *
 * This file MUST be served from the root URL (/firebase-messaging-sw.js).
 * It handles push notifications when the Sentinel Vault tab is closed/backgrounded.
 *
 * NOTE: Service workers cannot access import.meta.env or Vite env vars.
 * The Firebase config is injected at dev/build time via the Vite plugin defined
 * in vite.config.ts (see __FIREBASE_CONFIG__ global replacement).
 * In development, Vite reads VITE_FIREBASE_* from frontend/.env.local.
 *
 * VAPID key is used only by the client SDK (firebase.ts), NOT here.
 */

// ── Firebase SDK via CDN ───────────────────────────────────────────────────────
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// ── Firebase Config ───────────────────────────────────────────────────────────
// These are injected by Vite at build time from VITE_FIREBASE_* env vars.
// The __FIREBASE_SW_CONFIG__ token is replaced by vite.config.ts.
// If running without Vite (e.g. in production dist), the config is embedded directly.
const firebaseConfig = self.__FIREBASE_SW_CONFIG__ || {
  apiKey:            "",
  authDomain:        "",
  projectId:         "",
  storageBucket:     "",
  messagingSenderId: "",
  appId:             "",
};

// Only initialise if we have a valid projectId — avoids crashing in demo mode
if (firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // ── Background Message Handler ───────────────────────────────────────────────
  messaging.onBackgroundMessage((payload) => {
    console.log('[sentinel-sw] Background message:', payload);

    const title = payload.notification?.title || '🚨 Sentinel Vault Alert';
    const options = {
      body: payload.notification?.body || 'Anomaly detected in your security log vault.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'sentinel-vault-alert',
      renotify: true,
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
      data: {
        url: self.location.origin,
        ...(payload.data || {}),
      },
      actions: [
        { action: 'investigate', title: '🔍 Investigate Now' },
        { action: 'dismiss',     title: 'Dismiss' },
      ],
    };

    self.registration.showNotification(title, options);
  });

  // ── Notification Click Handler ─────────────────────────────────────────────
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'dismiss') return;

    const targetUrl = event.notification.data?.url || self.location.origin;

    event.waitUntil(
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Focus existing tab if open
          for (const client of clientList) {
            if (client.url.startsWith(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          // Otherwise open a new tab
          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
        })
    );
  });
} else {
  console.warn('[sentinel-sw] Firebase projectId not configured — background push disabled.');
}
