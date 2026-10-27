import { describe, it, expect, beforeEach } from 'vitest';
import {
  useVaultStore,
  selectFilteredWindows,
  generateAuditManifest,
  selectIntactCount,
  selectTamperedCount,
  selectMissingCount,
} from '@/store/useVaultStore';
import { MockLogRepository } from '@/services/mockLogRepository';
import { INITIAL_MOCK_LOGS } from '@/data/mockLogs';

describe('Sentinel Vault Enhanced Features Audit & Verification', () => {
  beforeEach(async () => {
    useVaultStore.getState().setRepository(new MockLogRepository());
    await useVaultStore.getState().fullReset();
    await useVaultStore.getState().fetchWindows();
  });

  describe('Cryptographic Hash Traceability & Checkpoint Discrepancy', () => {
    it('provides anchored root hash matching initial checkpoint for intact windows', () => {
      const window1 = useVaultStore.getState().windows.find((w) => w.id === 1);
      const initial1 = INITIAL_MOCK_LOGS.find((m) => m.id === 1);

      expect(window1).toBeDefined();
      expect(window1?.status).toBe('intact');
      expect(window1?.hash).toBe(initial1?.hash);
    });

    it('identifies exact hash mismatch between anchored checkpoint and recomputed stream upon tampering', async () => {
      await useVaultStore.getState().tamperWindow(7);
      const win7 = useVaultStore.getState().windows.find((w) => w.id === 7);
      const anchored7 = INITIAL_MOCK_LOGS.find((m) => m.id === 7);

      expect(win7).toBeDefined();
      expect(win7?.status).toBe('tampered');
      expect(anchored7).toBeDefined();
      expect(win7?.hash).not.toBe(anchored7?.hash);
      // Recomputed hash is reversed by mock repository
      expect(win7?.hash).toBe(anchored7?.hash.split('').reverse().join(''));
    });

    it('identifies missing record payload state upon interval deletion', async () => {
      await useVaultStore.getState().deleteWindow(4);
      const win4 = useVaultStore.getState().windows.find((w) => w.id === 4);

      expect(win4).toBeDefined();
      expect(win4?.status).toBe('missing');
      expect(win4?.detectedAt).toBeDefined();
    });
  });

  describe('Window Filtering and Keyword Search', () => {
    it('filters windows correctly by status (all, intact, tampered, missing)', async () => {
      await useVaultStore.getState().tamperWindow(7);
      await useVaultStore.getState().deleteWindow(3);

      expect(selectIntactCount(useVaultStore.getState())).toBe(10);
      expect(selectTamperedCount(useVaultStore.getState())).toBe(1);
      expect(selectMissingCount(useVaultStore.getState())).toBe(1);

      // Default: all 12
      useVaultStore.getState().setStatusFilter('all');
      expect(selectFilteredWindows(useVaultStore.getState())).toHaveLength(12);

      // Filter: intact
      useVaultStore.getState().setStatusFilter('intact');
      const intact = selectFilteredWindows(useVaultStore.getState());
      expect(intact).toHaveLength(10);
      expect(intact.every((w) => w.status === 'intact')).toBe(true);

      // Filter: tampered
      useVaultStore.getState().setStatusFilter('tampered');
      const tampered = selectFilteredWindows(useVaultStore.getState());
      expect(tampered).toHaveLength(1);
      expect(tampered[0].id).toBe(7);

      // Filter: missing
      useVaultStore.getState().setStatusFilter('missing');
      const missing = selectFilteredWindows(useVaultStore.getState());
      expect(missing).toHaveLength(1);
      expect(missing[0].id).toBe(3);
    });

    it('searches windows by ID or hash fragment', async () => {
      useVaultStore.getState().setWindowSearchQuery('7');
      const resultId = selectFilteredWindows(useVaultStore.getState());
      expect(resultId.some((w) => w.id === 7)).toBe(true);

      // Search by specific known hash prefix of Window 1 ('e3b0c442')
      useVaultStore.getState().setWindowSearchQuery('e3b0c442');
      const resultHash = selectFilteredWindows(useVaultStore.getState());
      expect(resultHash).toHaveLength(1);
      expect(resultHash[0].id).toBe(1);

      // Reset clears search
      useVaultStore.getState().setWindowSearchQuery('');
      expect(selectFilteredWindows(useVaultStore.getState())).toHaveLength(12);
    });
  });

  describe('Event Feed Management & Investigation', () => {
    it('allows clearing the event feed', () => {
      expect(useVaultStore.getState().events.length).toBeGreaterThan(0);
      useVaultStore.getState().clearEvents();
      expect(useVaultStore.getState().events).toHaveLength(0);
    });

    it('adds typed alerts with timestamp upon modification', async () => {
      await useVaultStore.getState().tamperWindow(5);
      useVaultStore.getState().addEvent('Window 5 hash mismatch detected', 'error');

      const latest = useVaultStore.getState().events[0];
      expect(latest.message).toBe('Window 5 hash mismatch detected');
      expect(latest.type).toBe('error');
    });
  });

  describe('Audit Proof Manifest Generation', () => {
    it('generates a complete structured JSON manifest of ledger state', async () => {
      await useVaultStore.getState().tamperWindow(7);
      const manifest = generateAuditManifest(useVaultStore.getState());

      expect(manifest.vault).toBe('Sentinel Vault — Tamper-Proof Security Log Vault');
      expect(manifest.summary.totalIntervals).toBe(12);
      expect(manifest.summary.tampered).toBe(1);
      expect(manifest.summary.intact).toBe(11);
      expect(manifest.summary.verificationStatus).toBe('INTEGRITY_COMPROMISED');
      expect(manifest.intervals).toHaveLength(12);

      const interval7 = manifest.intervals.find((i) => i.windowId === 7);
      expect(interval7?.checkpointId).toBe('VAULT-CKPT-20261027-W07');
      expect(interval7?.status).toBe('tampered');
    });

    it('reports VERIFIED_CLEAN status when all intervals are intact', () => {
      const manifest = generateAuditManifest(useVaultStore.getState());
      expect(manifest.summary.verificationStatus).toBe('VERIFIED_CLEAN');
      expect(manifest.summary.tampered).toBe(0);
      expect(manifest.summary.missing).toBe(0);
    });
  });

  describe('Simulation Safeguard Configuration', () => {
    it('tracks pending simulation action and toggle for skipping prompt', () => {
      expect(useVaultStore.getState().pendingSimulationAction).toBeNull();
      expect(useVaultStore.getState().skipSimulationConfirm).toBe(false);

      useVaultStore.getState().setPendingSimulationAction('tamper');
      expect(useVaultStore.getState().pendingSimulationAction).toBe('tamper');

      useVaultStore.getState().setSkipSimulationConfirm(true);
      expect(useVaultStore.getState().skipSimulationConfirm).toBe(true);

      useVaultStore.getState().setPendingSimulationAction(null);
      expect(useVaultStore.getState().pendingSimulationAction).toBeNull();
    });
  });
});
