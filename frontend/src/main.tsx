import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/app/App';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { useVaultStore } from '@/store/useVaultStore';
import '@/index.css';

// Probe the Flask backend before first render.
// If connected: switches to live API repo and fetches real data.
// If offline: silently loads the mock data so the app always works.
useVaultStore.getState().initBackendConnection();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
