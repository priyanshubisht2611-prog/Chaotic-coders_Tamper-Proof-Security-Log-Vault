import { describe, it, expect } from 'vitest';
import { attackReducer, AttackState, AttackEvent } from './attackMachine';

describe('attackMachine reducer', () => {
  it('correctly follows valid transitions: idle -> warning -> fighting -> aftermath -> idle', () => {
    let state: AttackState = 'idle';

    state = attackReducer(state, { type: 'TRIGGER_ATTACK' });
    expect(state).toBe('warning');

    state = attackReducer(state, { type: 'START_FIGHT' });
    expect(state).toBe('fighting');

    state = attackReducer(state, { type: 'END_ATTACK' });
    expect(state).toBe('aftermath');

    state = attackReducer(state, { type: 'FINISH' });
    expect(state).toBe('idle');
  });

  it('rejects invalid transitions and preserves current state', () => {
    expect(attackReducer('idle', { type: 'START_FIGHT' })).toBe('idle');
    expect(attackReducer('idle', { type: 'END_ATTACK' })).toBe('idle');
    expect(attackReducer('idle', { type: 'FINISH' })).toBe('idle');

    expect(attackReducer('warning', { type: 'TRIGGER_ATTACK' })).toBe('warning');
    expect(attackReducer('warning', { type: 'END_ATTACK' })).toBe('warning');
    expect(attackReducer('warning', { type: 'FINISH' })).toBe('warning');

    expect(attackReducer('fighting', { type: 'TRIGGER_ATTACK' })).toBe('fighting');
    expect(attackReducer('fighting', { type: 'START_FIGHT' })).toBe('fighting');
    expect(attackReducer('fighting', { type: 'FINISH' })).toBe('fighting');

    expect(attackReducer('aftermath', { type: 'TRIGGER_ATTACK' })).toBe('aftermath');
    expect(attackReducer('aftermath', { type: 'START_FIGHT' })).toBe('aftermath');
    expect(attackReducer('aftermath', { type: 'END_ATTACK' })).toBe('aftermath');
  });

  it('ignores repeated attack triggers when not idle', () => {
    const states: AttackState[] = ['warning', 'fighting', 'aftermath'];
    const triggerEvent: AttackEvent = { type: 'TRIGGER_ATTACK' };

    for (const st of states) {
      expect(attackReducer(st, triggerEvent)).toBe(st);
    }
  });
});
