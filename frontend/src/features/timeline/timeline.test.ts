import { describe, it, expect, beforeEach } from 'vitest';
import {
  useVaultStore,
  selectIntactCount,
  selectTamperedCount,
  selectMissingCount,
} from '@/store/useVaultStore';
import { MockLogRepository } from '@/services/mockLogRepository';
import { formatTickTime } from './TimeAxis';

describe('Timeline Feature Logic', () => {
  beforeEach(async () => {
    useVaultStore.getState().setRepository(new MockLogRepository());
    await useVaultStore.getState().reset();
    await useVaultStore.getState().fetchWindows();
  });

  it('correctly formats tick times from ISO strings', () => {
    expect(formatTickTime('2026-10-27T12:00:00Z')).toBe('12:00');
    expect(formatTickTime('2026-10-27T14:35:00Z')).toBe('14:35');
    expect(formatTickTime('invalid-time')).toBe('invalid-time'.substring(11, 16));
  });

  it('initializes with 12 intact windows and correct summary counts', () => {
    const state = useVaultStore.getState();
    expect(state.windows).toHaveLength(12);
    expect(selectIntactCount(state)).toBe(12);
    expect(selectTamperedCount(state)).toBe(0);
    expect(selectMissingCount(state)).toBe(0);
  });

  it('updates summary counters and window status when tampering window 7', async () => {
    await useVaultStore.getState().tamperWindow(7);
    const state = useVaultStore.getState();

    expect(selectIntactCount(state)).toBe(11);
    expect(selectTamperedCount(state)).toBe(1);
    expect(selectMissingCount(state)).toBe(0);

    const win7 = state.windows.find((w) => w.id === 7);
    expect(win7?.status).toBe('tampered');
  });

  it('updates summary counters when deleting a window', async () => {
    await useVaultStore.getState().deleteWindow(3);
    const state = useVaultStore.getState();

    expect(selectIntactCount(state)).toBe(11);
    expect(selectTamperedCount(state)).toBe(0);
    expect(selectMissingCount(state)).toBe(1);

    const win3 = state.windows.find((w) => w.id === 3);
    expect(win3?.status).toBe('missing');
  });

  it('updates hoveredId and selectedId correctly in store', () => {
    expect(useVaultStore.getState().hoveredId).toBeNull();
    expect(useVaultStore.getState().selectedId).toBeNull();

    useVaultStore.getState().setHoveredId(5);
    expect(useVaultStore.getState().hoveredId).toBe(5);

    useVaultStore.getState().setSelectedId(5);
    expect(useVaultStore.getState().selectedId).toBe(5);

    useVaultStore.getState().setHoveredId(null);
    expect(useVaultStore.getState().hoveredId).toBeNull();
  });

  it('generates proper aria-label shape for accessibility: Window HH:mm-HH:mm, status', () => {
    const win = useVaultStore.getState().windows[0];
    const ariaLabel = `Window ${formatTickTime(win.start)}-${formatTickTime(win.end)}, ${win.status}`;
    expect(ariaLabel).toBe('Window 12:00-12:05, intact');
  });
});
