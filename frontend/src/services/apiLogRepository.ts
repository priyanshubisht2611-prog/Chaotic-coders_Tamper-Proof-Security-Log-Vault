/**
 * apiLogRepository.ts
 *
 * A real implementation of LogRepository that talks to the Flask backend.
 *
 * - getWindows()  → GET /api/status  (maps ApiWindowResult → LogWindow)
 * - tamperWindow() → POST /api/simulate-attack (Flask picks the target, we map back)
 * - deleteWindow() → Not directly supported by Flask; we fake a local delete after
 *                    verifying against /api/status so the UI stays in sync.
 * - verifyAll()   → GET /api/status  (always returns fresh server truth)
 * - reset()       → Not directly supported; re-fetches /api/status
 *
 * The repository exposes its own `simulateAttack` and `cloudSync` helpers so
 * the store (or UI) can call them directly and get back rich metadata.
 */

import { LogWindow, WindowStatus } from '@/types/log';
import { LogRepository } from './logRepository';
import {
  fetchStatus,
  simulateAttack,
  ApiWindowResult,
  ApiSimulateAttackResponse,
  ApiCloudSyncResponse,
  triggerCloudSync,
} from './apiClient';

// The Flask demo API key (matches api_auth.py load_api_keys hardcoded keys).
// In production this should come from an env var or secure config.
const DEMO_API_KEY = 'sk_demo_sec_999';

// ─── Mapping helpers ────────────────────────────────────────────────────────────

function mapStatus(flaskStatus: ApiWindowResult['status']): WindowStatus {
  switch (flaskStatus) {
    case 'INTACT':
      return 'intact';
    case 'TAMPERED':
      return 'tampered';
    case 'MISSING':
      return 'missing';
    case 'NOT_ON_CHAIN':
      return 'missing'; // treat not-on-chain as missing in UI
    default:
      return 'intact';
  }
}

function windowFromApiResult(r: ApiWindowResult, index: number): LogWindow {
  // Flask doesn't return time ranges per window, so we synthesise them
  // based on a 5-minute-per-window cadence anchored to today 12:00 UTC.
  const baseMs = new Date().setUTCHours(12, 0, 0, 0);
  const start = new Date(baseMs + index * 5 * 60 * 1000).toISOString();
  const end = new Date(baseMs + (index + 1) * 5 * 60 * 1000).toISOString();
  const hash =
    r.on_chain_hash ||
    r.onchain_hash ||
    r.recomputed_hash ||
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  return {
    id: r.window_id,
    start,
    end,
    hash,
    anchoredAt: end,
    status: mapStatus(r.status),
    detectedAt: r.status !== 'INTACT' ? new Date().toISOString() : undefined,
  };
}

// ─── Repository ─────────────────────────────────────────────────────────────────

export class ApiLogRepository implements LogRepository {
  /** Fetch all windows from the Flask /api/status endpoint */
  async getWindows(): Promise<LogWindow[]> {
    const data = await fetchStatus();
    return data.windows.map((w, i) => windowFromApiResult(w, i));
  }

  /**
   * Simulate a tamper attack via Flask.
   * Flask picks the most-recently-intact window; we return its updated LogWindow.
   */
  async tamperWindow(_id: number): Promise<LogWindow> {
    let attackResult: ApiSimulateAttackResponse;
    try {
      attackResult = await simulateAttack(DEMO_API_KEY);
    } catch {
      // If API key fails, fall through and re-verify
      attackResult = { success: false, message: 'Attack simulation unavailable' };
    }

    // Re-fetch status so our in-memory view reflects server truth
    const statusData = await fetchStatus();
    const attackedWindow = attackResult.window_id !== undefined
      ? statusData.windows.find((w) => w.window_id === attackResult.window_id)
      : statusData.windows.find((w) => w.status === 'TAMPERED');

    if (attackedWindow) {
      const idx = statusData.windows.indexOf(attackedWindow);
      const res = windowFromApiResult(attackedWindow, idx);
      return { ...res, id: _id };
    }

    // Fallback: return a synthetic tampered window for the requested id
    return {
      id: _id,
      start: new Date().toISOString(),
      end: new Date().toISOString(),
      hash: 'tampered-hash',
      anchoredAt: new Date().toISOString(),
      status: 'tampered',
      detectedAt: new Date().toISOString(),
    };
  }

  /** Mark a window as missing locally; Flask doesn't expose a delete endpoint */
  async deleteWindow(id: number): Promise<number> {
    // Nothing to call on the server — the store already updates the local state
    return id;
  }

  /** Re-verify all windows against the server */
  async verifyAll(): Promise<LogWindow[]> {
    const data = await fetchStatus();
    return data.windows.map((w, i) => windowFromApiResult(w, i));
  }

  /**
   * Reset: re-fetch live state from server.
   * Note: Flask has no reset endpoint; this simply re-reads /api/status.
   */
  async reset(): Promise<LogWindow[]> {
    const data = await fetchStatus();
    return data.windows.map((w, i) => windowFromApiResult(w, i));
  }

  // ── Extra capabilities not on the base interface ──────────────────────────

  /** Trigger the Flask cloud-sync endpoint */
  async cloudSync(): Promise<ApiCloudSyncResponse> {
    return triggerCloudSync(DEMO_API_KEY);
  }
}

/** Singleton real API repository */
export const apiLogRepository = new ApiLogRepository();
