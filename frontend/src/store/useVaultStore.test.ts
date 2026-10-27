import { describe, it, expect, beforeEach } from 'vitest';
import { useVaultStore } from './useVaultStore';
import { MockLogRepository } from '@/services/mockLogRepository';

describe('useVaultStore', () => {
  let mockRepo: MockLogRepository;

  beforeEach(async () => {
    mockRepo = new MockLogRepository();
    useVaultStore.getState().setRepository(mockRepo);
    await useVaultStore.getState().fullReset();
  });

  it('tampers a specific log window', async () => {
    await useVaultStore.getState().fetchWindows();
    const initialWindow7 = useVaultStore.getState().windows.find((w) => w.id === 7);
    expect(initialWindow7?.status).toBe('intact');

    await useVaultStore.getState().tamperWindow(7);

    const updatedWindow7 = useVaultStore.getState().windows.find((w) => w.id === 7);
    expect(updatedWindow7?.status).toBe('tampered');
    expect(updatedWindow7?.detectedAt).toBeDefined();
  });

  it('marks a log window as missing when deleted', async () => {
    await useVaultStore.getState().fetchWindows();
    const initialWindow3 = useVaultStore.getState().windows.find((w) => w.id === 3);
    expect(initialWindow3?.status).toBe('intact');

    await useVaultStore.getState().deleteWindow(3);

    const updatedWindow3 = useVaultStore.getState().windows.find((w) => w.id === 3);
    expect(updatedWindow3?.status).toBe('missing');
  });

  it('resets all log windows to initial intact state while keeping villainPlayed intact', async () => {
    await useVaultStore.getState().fetchWindows();
    await useVaultStore.getState().tamperWindow(2);
    useVaultStore.getState().setVillainPlayed(true);

    expect(useVaultStore.getState().windows.find((w) => w.id === 2)?.status).toBe('tampered');
    expect(useVaultStore.getState().villainPlayed).toBe(true);

    await useVaultStore.getState().reset();

    const windows = useVaultStore.getState().windows;
    expect(windows).toHaveLength(12);
    expect(windows.every((w) => w.status === 'intact')).toBe(true);
    // Reset Demo does not clear villainPlayed
    expect(useVaultStore.getState().villainPlayed).toBe(true);
  });

  it('fullReset clears villainPlayed and resets state', async () => {
    await useVaultStore.getState().fetchWindows();
    await useVaultStore.getState().tamperWindow(2);
    useVaultStore.getState().setVillainPlayed(true);

    expect(useVaultStore.getState().villainPlayed).toBe(true);

    await useVaultStore.getState().fullReset();

    expect(useVaultStore.getState().villainPlayed).toBe(false);
    expect(useVaultStore.getState().windows.every((w) => w.status === 'intact')).toBe(true);
  });

  it('triggerModification plays video on first call and bypasses video on subsequent calls', async () => {
    await useVaultStore.getState().fetchWindows();
    expect(useVaultStore.getState().villainPlayed).toBe(false);

    // First call: triggers attack overlay and sets villainPlayed to true
    await useVaultStore.getState().triggerModification('tamper');
    expect(useVaultStore.getState().villainPlayed).toBe(true);
    expect(useVaultStore.getState().isAttackOverlayOpen).toBe(true);

    // Simulate closing the overlay and finishing cinematic
    useVaultStore.getState().setIsAttackOverlayOpen(false);
    useVaultStore.getState().setIsModifying(false);

    // Second call: does NOT open video overlay, directly modifies window 7 with glitch
    await useVaultStore.getState().triggerModification('delete');
    expect(useVaultStore.getState().isAttackOverlayOpen).toBe(false);
    expect(useVaultStore.getState().selectedId).toBe(7);
    const win7 = useVaultStore.getState().windows.find((w) => w.id === 7);
    expect(win7?.status).toBe('missing');
    expect(useVaultStore.getState().toastMessage).toContain('Window deleted');
  });
});
