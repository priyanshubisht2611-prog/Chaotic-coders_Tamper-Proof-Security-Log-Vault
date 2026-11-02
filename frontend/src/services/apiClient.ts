/**
 * apiClient.ts
 *
 * Typed HTTP client for the Sentinel Vault Flask backend.
 * All API calls go through these helpers so error handling and
 * request/response types are kept in one place.
 *
 * The Vite dev-server proxies /api/* → http://127.0.0.1:5000
 * In production the Flask app itself serves the built frontend.
 */

// ─── Response Types ────────────────────────────────────────────────────────────

export interface ApiWindowResult {
  window_id: number;
  status: 'INTACT' | 'TAMPERED' | 'MISSING' | 'NOT_ON_CHAIN';
  num_lines: number;
  on_chain_hash?: string;
  onchain_hash?: string;
  recomputed_hash?: string;
}

export interface ApiStatusResponse {
  windows: ApiWindowResult[];
  summary: {
    total: number;
    intact: number;
    tampered: number;
    missing: number;
    not_on_chain: number;
  };
  warning: string | null;
}

export interface ApiLlmStatusResponse {
  available: boolean;
  model: string | null;
}

export interface ApiAiExplanation {
  window_id: number;
  status: string;
  explanation: string;
}

export interface ApiAiInvestigateResponse {
  success: boolean;
  message?: string;
  error?: string;
  investigation: ApiAiExplanation[] | null;
  recommendation: string | null;
}

export interface ApiSimulateAttackResponse {
  success: boolean;
  window_id?: number;
  original_line?: string;
  tampered_line?: string;
  message: string;
}

export interface ApiCloudSyncResponse {
  success: boolean;
  synced_count: number;
  message: string;
}

export interface UserScoreDetail {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  events: number;
  top_event: string | null;
}

export interface ApiUserScoresResponse {
  [user: string]: UserScoreDetail;
}

export interface ApiAuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  details: Record<string, unknown>;
}

export interface ApiAuditResponse {
  entries: ApiAuditEntry[];
  total: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const BASE = ''; // Relative to current origin; Vite proxy handles /api/*

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`GET ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: unknown, apiKey?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['X-API-Key'] = apiKey;

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── API Methods ───────────────────────────────────────────────────────────────

/** Fetch live verification status for all anchored windows */
export const fetchStatus = () => get<ApiStatusResponse>('/api/status');

/** Check whether a local Ollama LLM is available */
export const fetchLlmStatus = () => get<ApiLlmStatusResponse>('/api/llm-status');

/**
 * Request an AI investigation report.
 * Pass windowId to investigate a specific window; omit to investigate all problematic windows.
 */
export const fetchAiInvestigation = (windowId?: number) =>
  get<ApiAiInvestigateResponse>(
    windowId !== undefined ? `/api/ai-investigate?window_id=${windowId}` : '/api/ai-investigate',
  );

/** Simulate a tamper attack on an intact window (requires API key) */
export const simulateAttack = (apiKey: string) =>
  post<ApiSimulateAttackResponse>('/api/simulate-attack', {}, apiKey);

/** Trigger a cloud DB sync (requires API key) */
export const triggerCloudSync = (apiKey: string) =>
  post<ApiCloudSyncResponse>('/api/cloud-sync', {}, apiKey);

/** Fetch user behaviour risk scores */
export const fetchUserScores = () => get<ApiUserScoresResponse>('/api/user-scores');

/** Fetch immutable audit trail entries */
export const fetchAuditTrail = (limit = 50) =>
  get<ApiAuditResponse>(`/api/audit?limit=${limit}`);

// ─── Firebase / Push Notification Endpoints ────────────────────────────────────

export interface FcmRegisterResponse {
  success: boolean;
  message: string;
  registered_count?: number;
}

export interface FcmSendAlertResponse {
  success: boolean;
  sent?: number;
  errors?: string[];
  message: string;
  fcm_available?: boolean;
}

/** Register an FCM token with the backend */
export const registerFcmToken = (token: string) =>
  post<FcmRegisterResponse>('/api/register-fcm-token', { token });

/** Send a push alert via the backend */
export const sendPushAlert = (payload: {
  token?: string;
  title: string;
  body: string;
  severity: 'breach' | 'warning' | 'info' | 'test';
}) => post<FcmSendAlertResponse>('/api/send-alert', payload);

