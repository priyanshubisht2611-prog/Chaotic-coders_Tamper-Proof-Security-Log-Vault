import { create } from 'zustand';
import { LogWindow } from '@/types/log';
import { LogRepository } from '@/services/logRepository';
import { defaultLogRepository } from '@/services/mockLogRepository';

const SESSION_STORAGE_KEY = 'vault_villain_played';

export const getInitialVillainPlayed = (): boolean => {
  try {
    return typeof window !== 'undefined' && sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setStoredVillainPlayed = (played: boolean): void => {
  try {
    if (typeof window !== 'undefined') {
      if (played) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
};

export interface VaultEvent {
  id: string;
  timestamp: string; // HH:mm:ss format
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

const formatEventTime = (): string => {
  const now = new Date();
  return now.toTimeString().split(' ')[0]; // HH:mm:ss
};

export interface VaultState {
  windows: LogWindow[];
  loading: boolean;
  error: string | null;
  selectedId: number | null;
  hoveredId: number | null;
  repository: LogRepository;
  villainPlayed: boolean;
  heroVideoPlaying: boolean;
  isAttackOverlayOpen: boolean;
  attackKind: 'tamper' | 'delete';
  isModifying: boolean;
  glitchActive: boolean;
  cardGlitchId: number | null;
  toastMessage: string | null;

  // Verification & Events (Phase 4)
  events: VaultEvent[];
  isScanning: boolean;
  scanningIndex: number | null; // 1 to 12

  // Filtering & Search
  statusFilter: 'all' | 'intact' | 'tampered' | 'missing';
  windowSearchQuery: string;

  // Safeguard & Confirmation
  pendingSimulationAction: 'tamper' | 'delete' | null;
  skipSimulationConfirm: boolean;

  setSelectedId: (id: number | null) => void;
  setHoveredId: (id: number | null) => void;
  setRepository: (repo: LogRepository) => void;
  setVillainPlayed: (played: boolean) => void;
  setHeroVideoPlaying: (playing: boolean) => void;
  setIsAttackOverlayOpen: (open: boolean) => void;
  setToastMessage: (msg: string | null) => void;
  setIsModifying: (modifying: boolean) => void;
  addEvent: (message: string, type?: VaultEvent['type']) => void;
  clearEvents: () => void;
  setStatusFilter: (filter: 'all' | 'intact' | 'tampered' | 'missing') => void;
  setWindowSearchQuery: (query: string) => void;
  setPendingSimulationAction: (action: 'tamper' | 'delete' | null) => void;
  setSkipSimulationConfirm: (skip: boolean) => void;

  triggerModification: (kind: 'tamper' | 'delete') => Promise<void>;
  simulateDeletion: () => Promise<void>;
  startVerification: () => Promise<void>;
  fetchWindows: () => Promise<void>;
  tamperWindow: (id: number) => Promise<void>;
  deleteWindow: (id: number) => Promise<void>;
  verifyAll: () => Promise<void>;
  reset: () => Promise<void>;
  fullReset: () => Promise<void>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  windows: [],
  loading: false,
  error: null,
  selectedId: null,
  hoveredId: null,
  repository: defaultLogRepository,
  villainPlayed: getInitialVillainPlayed(),
  heroVideoPlaying: false,
  isAttackOverlayOpen: false,
  attackKind: 'tamper',
  isModifying: false,
  glitchActive: false,
  cardGlitchId: null,
  toastMessage: null,

  events: [
    {
      id: 'init-1',
      timestamp: formatEventTime(),
      message: 'Cryptographic ledger initialized: 12 intervals anchored',
      type: 'info',
    },
  ],
  isScanning: false,
  scanningIndex: null,

  statusFilter: 'all',
  windowSearchQuery: '',
  pendingSimulationAction: null,
  skipSimulationConfirm: false,

  setSelectedId: (id) => set({ selectedId: id }),
  setHoveredId: (id) => set({ hoveredId: id }),
  setRepository: (repo) => set({ repository: repo }),
  setVillainPlayed: (played) => {
    setStoredVillainPlayed(played);
    set({ villainPlayed: played });
  },
  setHeroVideoPlaying: (playing) => set({ heroVideoPlaying: playing }),
  setIsAttackOverlayOpen: (open) => set({ isAttackOverlayOpen: open }),
  setToastMessage: (msg) => set({ toastMessage: msg }),
  setIsModifying: (modifying) => set({ isModifying: modifying }),

  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setWindowSearchQuery: (query) => set({ windowSearchQuery: query }),
  setPendingSimulationAction: (action) => set({ pendingSimulationAction: action }),
  setSkipSimulationConfirm: (skip) => set({ skipSimulationConfirm: skip }),

  clearEvents: () => set({ events: [] }),

  addEvent: (message: string, type = 'info') => {
    const newEvent: VaultEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: formatEventTime(),
      message,
      type,
    };
    set((state) => ({
      events: [newEvent, ...state.events].slice(0, 50), // keep latest 50
    }));
  },

  triggerModification: async (kind: 'tamper' | 'delete') => {
    const { isModifying, isScanning, villainPlayed, tamperWindow, deleteWindow, setSelectedId, addEvent } = get();
    // Safety rule: repeated clicks or scanning clicks are ignored
    if (isModifying || isScanning) return;

    if (!villainPlayed) {
      // First modification: play villain cinematic
      setStoredVillainPlayed(true);
      addEvent('Intrusion alert: unauthorized modifier connected', 'warning');
      set({
        isModifying: true,
        villainPlayed: true,
        attackKind: kind,
        isAttackOverlayOpen: true,
        glitchActive: true,
      });
      setTimeout(() => set({ glitchActive: false }), 400);
    } else {
      // Subsequent call: no video. Immediate 0.4s red glitch and toast
      set({ isModifying: true, glitchActive: true, cardGlitchId: 7, attackKind: kind });

      try {
        if (kind === 'tamper') {
          await tamperWindow(7);
          addEvent('Window 7 hash mismatch detected', 'error');
        } else {
          await deleteWindow(7);
          addEvent('Window 7 record missing', 'warning');
        }
        setSelectedId(7);

        if (typeof document !== 'undefined') {
          const card7 = document.getElementById('window-card-7');
          if (card7) {
            card7.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }

        const win7 = get().windows.find((w) => w.id === 7);
        const time = win7?.anchoredAt
          ? new Date(win7.anchoredAt).toLocaleTimeString()
          : new Date().toLocaleTimeString();

        const message =
          kind === 'tamper'
            ? `Window tampered. Original hash recorded at ${time}.`
            : 'Window deleted. Record marked as missing.';

        set({ toastMessage: message });
      } finally {
        set({ isModifying: false });
        setTimeout(() => {
          set({ glitchActive: false, cardGlitchId: null });
        }, 400);
      }
    }
  },

  simulateDeletion: async () => {
    const { isModifying, isScanning, windows, deleteWindow, setSelectedId, addEvent } = get();
    if (isModifying || isScanning) return;

    // Set a random intact window to "missing" with a red glitch on that card only (no villain video)
    const intactWindows = windows.filter((w) => w.status === 'intact');
    if (intactWindows.length === 0) {
      set({ toastMessage: 'No intact windows available to delete' });
      return;
    }

    const randomWindow = intactWindows[Math.floor(Math.random() * intactWindows.length)];
    const targetId = randomWindow.id;

    set({ isModifying: true, glitchActive: true, cardGlitchId: targetId });

    try {
      await deleteWindow(targetId);
      setSelectedId(targetId);
      addEvent(`Window ${targetId} record deleted / missing`, 'warning');

      if (typeof document !== 'undefined') {
        const cardEl = document.getElementById(`window-card-${targetId}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      set({ toastMessage: `Window ${targetId} deleted. Record marked as missing.` });
    } finally {
      set({ isModifying: false });
      setTimeout(() => {
        set({ glitchActive: false, cardGlitchId: null });
      }, 400);
    }
  },

  startVerification: async () => {
    const { isScanning, isModifying, repository, addEvent } = get();
    if (isScanning || isModifying) return;

    set({ isScanning: true, scanningIndex: 1 });
    addEvent('Verification started: ledger ScanBeam active', 'info');

    // Sweep across 12 windows over ~2 seconds (170ms per window = ~2040ms)
    for (let i = 1; i <= 12; i++) {
      set({ scanningIndex: i });
      await new Promise((resolve) => setTimeout(resolve, 170));
    }

    try {
      const verified = await repository.verifyAll();
      const detectedNow = new Date().toISOString();

      // Ensure detectedAt is populated for any tampered or missing windows
      const updatedWindows = verified.map((w) => {
        if (w.status !== 'intact' && !w.detectedAt) {
          return { ...w, detectedAt: detectedNow };
        }
        return w;
      });

      set({ windows: updatedWindows });

      const intactCount = updatedWindows.filter((w) => w.status === 'intact').length;
      const tamperedCount = updatedWindows.filter((w) => w.status === 'tampered').length;
      const missingCount = updatedWindows.filter((w) => w.status === 'missing').length;

      // Log specific detected issues
      updatedWindows.forEach((w) => {
        if (w.status === 'tampered') {
          addEvent(`Window ${w.id} hash mismatch detected`, 'error');
        } else if (w.status === 'missing') {
          addEvent(`Window ${w.id} record missing`, 'warning');
        }
      });

      const summary = `Scan complete: ${tamperedCount} tampered, ${missingCount} missing, ${intactCount} intact`;
      addEvent(summary, tamperedCount > 0 || missingCount > 0 ? 'warning' : 'success');
      set({ toastMessage: summary });
    } finally {
      set({ isScanning: false, scanningIndex: null });
    }
  },

  fetchWindows: async () => {
    set({ loading: true, error: null });
    try {
      const windows = await get().repository.getWindows();
      set({ windows, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch', loading: false });
    }
  },

  tamperWindow: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const tampered = await get().repository.tamperWindow(id);
      set((state) => ({
        windows: state.windows.map((w) => (w.id === id ? tampered : w)),
        loading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to tamper', loading: false });
    }
  },

  deleteWindow: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await get().repository.deleteWindow(id);
      set((state) => ({
        windows: state.windows.map((w) =>
          w.id === id
            ? { ...w, status: 'missing', detectedAt: w.detectedAt || new Date().toISOString() }
            : w,
        ),
        loading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete', loading: false });
    }
  },

  verifyAll: async () => {
    set({ loading: true, error: null });
    try {
      const windows = await get().repository.verifyAll();
      set({ windows, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to verify', loading: false });
    }
  },

  reset: async () => {
    // Reset Demo restores all windows to intact, clears selection and toasts, does NOT clear villainPlayed
    set({ loading: true, error: null });
    try {
      const windows = await get().repository.reset();
      get().addEvent('Demo reset: all windows restored to intact', 'info');
      set({
        windows,
        loading: false,
        selectedId: null,
        hoveredId: null,
        isModifying: false,
        glitchActive: false,
        cardGlitchId: null,
        isAttackOverlayOpen: false,
        toastMessage: null,
        statusFilter: 'all',
        windowSearchQuery: '',
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to reset', loading: false });
    }
  },

  fullReset: async () => {
    // Shift+R Full Reset: resets everything and clears villainPlayed
    set({ loading: true, error: null });
    try {
      const windows = await get().repository.reset();
      setStoredVillainPlayed(false);
      get().addEvent('Full Reset complete: cinematic sequence re-enabled', 'info');
      set({
        windows,
        loading: false,
        selectedId: null,
        hoveredId: null,
        villainPlayed: false,
        isModifying: false,
        glitchActive: false,
        cardGlitchId: null,
        isAttackOverlayOpen: false,
        toastMessage: 'Full Reset complete. Villain cinematic sequence re-enabled.',
        statusFilter: 'all',
        windowSearchQuery: '',
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to reset', loading: false });
    }
  },
}));

export const selectIntactCount = (state: VaultState): number =>
  state.windows.filter((w) => w.status === 'intact').length;

export const selectTamperedCount = (state: VaultState): number =>
  state.windows.filter((w) => w.status === 'tampered').length;

export const selectMissingCount = (state: VaultState): number =>
  state.windows.filter((w) => w.status === 'missing').length;

export const selectFilteredWindows = (state: VaultState): LogWindow[] => {
  const { windows, statusFilter, windowSearchQuery } = state;
  let result = [...windows];

  if (statusFilter !== 'all') {
    result = result.filter((w) => w.status === statusFilter);
  }

  const query = windowSearchQuery.trim().toLowerCase();
  if (query) {
    result = result.filter((w) => {
      const idMatch = w.id.toString() === query || `window ${w.id}`.includes(query) || `#${w.id}`.includes(query);
      const hashMatch = w.hash.toLowerCase().includes(query);
      const statusMatch = w.status.toLowerCase().includes(query);
      const timeMatch = `${w.start} ${w.end}`.toLowerCase().includes(query);
      return idMatch || hashMatch || statusMatch || timeMatch;
    });
  }

  return result.sort((a, b) => a.id - b.id || a.start.localeCompare(b.start));
};

export const generateAuditManifest = (state: VaultState) => {
  const verifiedAt = new Date().toISOString();
  return {
    vault: 'Sentinel Vault — Tamper-Proof Security Log Vault',
    version: '1.0.0',
    exportTimestamp: verifiedAt,
    standard: 'Deterministic 5-minute Cryptographic Log Intervals',
    summary: {
      totalIntervals: state.windows.length,
      intact: selectIntactCount(state),
      tampered: selectTamperedCount(state),
      missing: selectMissingCount(state),
      verificationStatus:
        selectTamperedCount(state) > 0 || selectMissingCount(state) > 0
          ? 'INTEGRITY_COMPROMISED'
          : 'VERIFIED_CLEAN',
    },
    intervals: state.windows.map((w) => ({
      windowId: w.id,
      checkpointId: `VAULT-CKPT-20261027-W${w.id.toString().padStart(2, '0')}`,
      intervalStartUtc: w.start,
      intervalEndUtc: w.end,
      anchoredHash: w.hash,
      anchoredAtUtc: w.anchoredAt,
      status: w.status,
      firstDetectedAtUtc: w.detectedAt || null,
    })),
    recentEvents: state.events.slice(0, 20),
  };
};
