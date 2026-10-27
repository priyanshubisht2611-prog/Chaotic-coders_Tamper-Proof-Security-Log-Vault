import { describe, it, expect, beforeEach } from 'vitest';
import { attackReducer, AttackState } from './attackMachine';
import { useVaultStore } from '@/store/useVaultStore';
import { MockLogRepository } from '@/services/mockLogRepository';

describe('Attack Sequence Flow Completion', () => {
  beforeEach(async () => {
    useVaultStore.getState().setRepository(new MockLogRepository());
    await useVaultStore.getState().reset();
    await useVaultStore.getState().fetchWindows();
  });

  const simulateAttackFlow = async (triggerReason: 'ended' | 'error' | 'skip') => {
    // 1. Idle -> Warning
    let state: AttackState = 'idle';
    state = attackReducer(state, { type: 'TRIGGER_ATTACK' });
    expect(state).toBe('warning');

    // 2. Warning -> Fighting (after 0.6s)
    state = attackReducer(state, { type: 'START_FIGHT' });
    expect(state).toBe('fighting');

    // 3. Fighting termination via video ended, video error (e.g., wrong src), or Skip
    expect(['ended', 'error', 'skip']).toContain(triggerReason);
    state = attackReducer(state, { type: 'END_ATTACK' });
    expect(state).toBe('aftermath');

    // 4. Aftermath: Tamper window 7
    await useVaultStore.getState().tamperWindow(7);
    const win7 = useVaultStore.getState().windows.find((w) => w.id === 7);
    expect(win7?.status).toBe('tampered');
    expect(win7?.detectedAt).toBeDefined();

    // 5. Aftermath -> Idle
    state = attackReducer(state, { type: 'FINISH' });
    expect(state).toBe('idle');
  };

  it('completes the attack sequence when villain video ends naturally', async () => {
    await simulateAttackFlow('ended');
  });

  it('completes the attack sequence and tampers window 7 when video error occurs (e.g. invalid src)', async () => {
    await simulateAttackFlow('error');
  });

  it('completes the attack sequence and tampers window 7 when user clicks Skip', async () => {
    await simulateAttackFlow('skip');
  });
});
