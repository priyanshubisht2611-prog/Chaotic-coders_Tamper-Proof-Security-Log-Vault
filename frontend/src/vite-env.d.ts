/// <reference types="vite/client" />

/**
 * Augment Vite's ImportMetaEnv interface to declare all VITE_-prefixed
 * environment variables used by Sentinel Vault.
 *
 * Values are loaded from frontend/.env.local in development.
 * See frontend/.env.example for the full list and descriptions.
 */
interface ImportMetaEnv {
  // ── Firebase Client Config ─────────────────────────────────────────────────
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;

  // ── Firebase Web Push VAPID Key ────────────────────────────────────────────
  readonly VITE_FIREBASE_VAPID_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
