/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development/production) from frontend/
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [
      react(),
      // ── Service Worker Firebase Config Injector ──────────────────────────
      // Service workers cannot use import.meta.env, so we inject the Firebase
      // config into firebase-messaging-sw.js at dev-serve and build time by
      // replacing the __FIREBASE_SW_CONFIG__ placeholder with the real values
      // from VITE_FIREBASE_* environment variables.
      {
        name: 'inject-firebase-sw-config',
        // Hook runs after bundle is written (build) or on file serve (dev)
        transformIndexHtml: undefined,
        configureServer(server) {
          // In dev mode: intercept requests to /firebase-messaging-sw.js
          server.middlewares.use((req, res, next) => {
            if (req.url !== '/firebase-messaging-sw.js') return next();

            const swPath = path.resolve(__dirname, 'public/firebase-messaging-sw.js');
            let content = fs.readFileSync(swPath, 'utf-8');

            const firebaseSwConfig = JSON.stringify({
              apiKey:            env.VITE_FIREBASE_API_KEY            || '',
              authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN        || '',
              projectId:         env.VITE_FIREBASE_PROJECT_ID         || '',
              storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET     || '',
              messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
              appId:             env.VITE_FIREBASE_APP_ID             || '',
            });

            // Replace placeholder token with real config
            content = content.replace(
              'self.__FIREBASE_SW_CONFIG__',
              firebaseSwConfig,
            );

            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Service-Worker-Allowed', '/');
            res.end(content);
          });
        },
        // In production build: transform the copied public file
        closeBundle() {
          const swDist = path.resolve(__dirname, 'dist/firebase-messaging-sw.js');
          if (!fs.existsSync(swDist)) return;

          let content = fs.readFileSync(swDist, 'utf-8');

          const firebaseSwConfig = JSON.stringify({
            apiKey:            env.VITE_FIREBASE_API_KEY            || '',
            authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN        || '',
            projectId:         env.VITE_FIREBASE_PROJECT_ID         || '',
            storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET     || '',
            messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
            appId:             env.VITE_FIREBASE_APP_ID             || '',
          });

          content = content.replace(
            'self.__FIREBASE_SW_CONFIG__',
            firebaseSwConfig,
          );

          fs.writeFileSync(swDist, content, 'utf-8');
          console.log('[vite] Firebase SW config injected into dist/firebase-messaging-sw.js');
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: true,
      allowedHosts: true,
      proxy: {
        // Proxy all /api/* requests to the Flask backend on port 5000
        '/api': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      emptyOutDir: false,
    },
    test: {
      globals: true,
      environment: 'node',
    },
  };
});
