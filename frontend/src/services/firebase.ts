/**
 * firebase.ts — Firebase client initialization for Sentinel Vault
 *
 * Provides:
 *  - requestNotificationPermission() → asks user for permission + returns FCM token
 *  - onForegroundMessage()           → handles messages when app is in foreground
 *  - getNotificationPermission()     → returns current browser permission state
 *
 * All Firebase config values and the VAPID key are read from Vite environment
 * variables (VITE_ prefix). They are never hardcoded in source files.
 * Set them in frontend/.env.local — see frontend/.env.example for the full list.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
  MessagePayload,
} from 'firebase/messaging';

// ── Firebase Configuration (read from Vite env — never hardcoded) ─────────────
// Values come from frontend/.env.local (development) or hosting env vars (production).
// All variables must be prefixed with VITE_ so Vite exposes them to the browser bundle.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// ── VAPID Key (read from Vite env) ────────────────────────────────────────────
// Set VITE_FIREBASE_VAPID_KEY in frontend/.env.local
// Source: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY: string = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;

// ── Runtime config guard (dev only) ──────────────────────────────────────────
if (import.meta.env.DEV && !VAPID_KEY) {
  console.warn(
    '[Sentinel Vault] VITE_FIREBASE_VAPID_KEY is not set.\n' +
    'Push notifications will not work.\n' +
    'Add it to frontend/.env.local — see frontend/.env.example for reference.'
  );
}

// ── App Singleton ─────────────────────────────────────────────────────────────
let app: FirebaseApp;
let messagingInstance: Messaging | null = null;

function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
}

function getFirebaseMessaging(): Messaging | null {
  if (messagingInstance) return messagingInstance;
  try {
    const firebaseApp = getFirebaseApp();
    messagingInstance = getMessaging(firebaseApp);
    return messagingInstance;
  } catch (err) {
    console.warn('[Sentinel Vault] Firebase Messaging not available:', err);
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Request notification permission from the browser and obtain an FCM token.
 * The VAPID key is sourced from VITE_FIREBASE_VAPID_KEY env variable.
 * Returns the token string on success, or null if denied / unavailable.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (!('Notification' in window)) {
      console.warn('[Sentinel Vault] Notifications not supported.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Sentinel Vault] Notification permission denied.');
      return null;
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    // Register service worker explicitly
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('[Sentinel Vault] Service worker registered:', swRegistration.scope);
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,                      // ← from VITE_FIREBASE_VAPID_KEY env var
      serviceWorkerRegistration: swRegistration,
    });

    console.log('[Sentinel Vault] FCM Token obtained (first 20 chars):', token.slice(0, 20) + '…');
    return token;
  } catch (err) {
    console.error('[Sentinel Vault] Failed to get FCM token:', err);
    return null;
  }
}

/**
 * Subscribe to foreground messages (app is open in browser tab).
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(
  handler: (payload: MessagePayload) => void
): () => void {
  const messaging = getFirebaseMessaging();
  if (!messaging) return () => { };
  return onMessage(messaging, handler);
}

/**
 * Check current notification permission status.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
