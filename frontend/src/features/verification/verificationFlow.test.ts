import { describe, it, expect, beforeEach } from 'vitest';
import { useVaultStore } from '@/store/useVaultStore';
import { MockLogRepository } from '@/services/mockLogRepository';

describe('Phase 4 Verification & EventFeed Flow (A -> V -> D -> V -> R)', () => {
  beforeEach(async () => {
    useVaultStore.getState().setRepository(new MockLogRepository());
    await useVaultStore.getState().fullReset();
    await useVaultStore.getState().fetchWindows();
  });

  it('executes full flow A -> V -> D -> V -> R with no stuck states', async () => {
    // Initial state: 12 intact windows, 0 tampered, 0 missing
    expect(useVaultStore.getState().windows).toHaveLength(12);
    expect(useVaultStore.getState().windows.every((w) => w.status === 'intact')).toBe(true);
    expect(useVaultStore.getState().events.length).toBeGreaterThanOrEqual(1);

    // Step 1: [A] Simulate Attack (tamper window 7)
    await useVaultStore.getState().tamperWindow(7);
    useVaultStore.getState().setSelectedId(7);
    const win7 = useVaultStore.getState().windows.find((w) => w.id === 7);
    expect(win7?.status).toBe('tampered');
    expect(win7?.detectedAt).toBeDefined();

    // Step 2: [V] Verify Logs
    await useVaultStore.getState().startVerification();
    expect(useVaultStore.getState().isScanning).toBe(false);
    expect(useVaultStore.getState().toastMessage).toContain('Scan complete: 1 tampered, 0 missing, 11 intact');
    const verifyEvent = useVaultStore.getState().events.find((e) => e.message.includes('Scan complete'));
    expect(verifyEvent).toBeDefined();

    // Step 3: [D] Simulate Deletion
    await useVaultStore.getState().simulateDeletion();
    const missingWindows = useVaultStore.getState().windows.filter((w) => w.status === 'missing');
    expect(missingWindows.length).toBe(1);
    expect(missingWindows[0].detectedAt).toBeDefined();
    expect(useVaultStore.getState().toastMessage).toContain('deleted. Record marked as missing');

    // Step 4: [V] Verify Logs again
    await useVaultStore.getState().startVerification();
    expect(useVaultStore.getState().isScanning).toBe(false);
    expect(useVaultStore.getState().toastMessage).toContain('Scan complete: 1 tampered, 1 missing, 10 intact');

    // Step 5: [R] Reset Demo
    await useVaultStore.getState().reset();
    expect(useVaultStore.getState().windows.every((w) => w.status === 'intact')).toBe(true);
    expect(useVaultStore.getState().selectedId).toBeNull();
    expect(useVaultStore.getState().toastMessage).toBeNull();
    expect(useVaultStore.getState().events[0].message).toContain('Demo reset');
  }, 15000);

  it('creates typed event entries newest first with timestamp', () => {
    useVaultStore.getState().addEvent('Test alert message', 'warning');
    const latest = useVaultStore.getState().events[0];

    expect(latest.message).toBe('Test alert message');
    expect(latest.type).toBe('warning');
    expect(latest.timestamp).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});
