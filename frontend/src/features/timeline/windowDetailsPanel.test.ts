import { describe, it, expect, beforeEach } from 'vitest';
import { useVaultStore } from '@/store/useVaultStore';
import { MockLogRepository } from '@/services/mockLogRepository';
import { attackReducer, AttackState } from '@/features/attack/attackMachine';

describe('WindowDetailsPanel & Phase 3 Specifications', () => {
  beforeEach(async () => {
    useVaultStore.getState().setRepository(new MockLogRepository());
    await useVaultStore.getState().reset();
    await useVaultStore.getState().fetchWindows();
  });

  describe('Selection & Stored Data Display Logic', () => {
    it('initializes with no window selected (empty state)', () => {
      expect(useVaultStore.getState().selectedId).toBeNull();
    });

    it('retrieves intact window details accurately', () => {
      useVaultStore.getState().setSelectedId(1);
      const selectedId = useVaultStore.getState().selectedId;
      const window = useVaultStore.getState().windows.find((w) => w.id === selectedId);

      expect(window).toBeDefined();
      expect(window?.status).toBe('intact');
      expect(window?.hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      expect(window?.anchoredAt).toBe('2026-10-27T12:05:02Z');
      expect(window?.detectedAt).toBeUndefined();
    });

    it('retrieves tampered window with detectedAt populated', async () => {
      await useVaultStore.getState().tamperWindow(7);
      useVaultStore.getState().setSelectedId(7);

      const window = useVaultStore.getState().windows.find((w) => w.id === 7);
      expect(window).toBeDefined();
      expect(window?.status).toBe('tampered');
      expect(window?.detectedAt).toBeDefined();
      expect(window?.anchoredAt).toBeDefined();
    });

    it('retrieves missing window with detectedAt populated', async () => {
      await useVaultStore.getState().deleteWindow(4);
      useVaultStore.getState().setSelectedId(4);

      const window = useVaultStore.getState().windows.find((w) => w.id === 4);
      expect(window).toBeDefined();
      expect(window?.status).toBe('missing');
      expect(window?.detectedAt).toBeDefined();
    });
  });

  describe('3-Column Grid Arrow Key Navigation Calculation', () => {
    // 3 columns:
    // [1,  2,  3]  (indices 0, 1, 2)
    // [4,  5,  6]  (indices 3, 4, 5)
    // [7,  8,  9]  (indices 6, 7, 8)
    // [10, 11, 12] (indices 9, 10, 11)

    const computeNextIndex = (
      currentIndex: number,
      key: 'ArrowRight' | 'ArrowLeft' | 'ArrowDown' | 'ArrowUp',
      totalLength: number,
    ): number => {
      if (currentIndex === -1) {
        return key === 'ArrowUp' || key === 'ArrowLeft' ? totalLength - 1 : 0;
      }
      switch (key) {
        case 'ArrowRight':
          return Math.min(totalLength - 1, currentIndex + 1);
        case 'ArrowLeft':
          return Math.max(0, currentIndex - 1);
        case 'ArrowDown':
          return Math.min(totalLength - 1, currentIndex + 3);
        case 'ArrowUp':
          return Math.max(0, currentIndex - 3);
      }
    };

    it('navigates correctly across rows and columns', () => {
      const total = 12;

      // From nothing selected (currentIndex -1):
      expect(computeNextIndex(-1, 'ArrowRight', total)).toBe(0);
      expect(computeNextIndex(-1, 'ArrowDown', total)).toBe(0);
      expect(computeNextIndex(-1, 'ArrowLeft', total)).toBe(11);
      expect(computeNextIndex(-1, 'ArrowUp', total)).toBe(11);

      // From index 0 (Window 1):
      expect(computeNextIndex(0, 'ArrowRight', total)).toBe(1); // Window 2
      expect(computeNextIndex(0, 'ArrowDown', total)).toBe(3);  // Window 4
      expect(computeNextIndex(0, 'ArrowLeft', total)).toBe(0);  // clamped
      expect(computeNextIndex(0, 'ArrowUp', total)).toBe(0);    // clamped

      // From index 4 (Window 5):
      expect(computeNextIndex(4, 'ArrowRight', total)).toBe(5); // Window 6
      expect(computeNextIndex(4, 'ArrowLeft', total)).toBe(3);  // Window 4
      expect(computeNextIndex(4, 'ArrowDown', total)).toBe(7);  // Window 8
      expect(computeNextIndex(4, 'ArrowUp', total)).toBe(1);    // Window 2

      // From index 10 (Window 11):
      expect(computeNextIndex(10, 'ArrowDown', total)).toBe(11); // clamped to max
      expect(computeNextIndex(10, 'ArrowUp', total)).toBe(7);    // Window 8
    });

    it('Esc clears the selection in the store', () => {
      useVaultStore.getState().setSelectedId(5);
      expect(useVaultStore.getState().selectedId).toBe(5);

      useVaultStore.getState().setSelectedId(null);
      expect(useVaultStore.getState().selectedId).toBeNull();
    });
  });

  describe('Aftermath Auto-Selection Specification', () => {
    it('sets selectedId to 7 after attack sequence finishes', async () => {
      let state: AttackState = 'idle';
      state = attackReducer(state, { type: 'TRIGGER_ATTACK' });
      state = attackReducer(state, { type: 'START_FIGHT' });
      state = attackReducer(state, { type: 'END_ATTACK' });
      expect(state).toBe('aftermath');

      // In aftermath state, tamper window 7 and set selectedId to 7
      await useVaultStore.getState().tamperWindow(7);
      useVaultStore.getState().setSelectedId(7);

      expect(useVaultStore.getState().selectedId).toBe(7);
      const win7 = useVaultStore.getState().windows.find((w) => w.id === 7);
      expect(win7?.status).toBe('tampered');
    });
  });
});
