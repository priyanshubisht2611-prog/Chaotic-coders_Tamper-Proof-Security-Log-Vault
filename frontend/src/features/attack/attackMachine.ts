export type AttackState = 'idle' | 'warning' | 'fighting' | 'aftermath';

export type AttackEvent =
  | { type: 'TRIGGER_ATTACK' }
  | { type: 'START_FIGHT' }
  | { type: 'END_ATTACK' }
  | { type: 'FINISH' };

export const INITIAL_ATTACK_STATE: AttackState = 'idle';

const VALID_TRANSITIONS: Record<AttackState, Record<string, AttackState>> = {
  idle: {
    TRIGGER_ATTACK: 'warning',
  },
  warning: {
    START_FIGHT: 'fighting',
  },
  fighting: {
    END_ATTACK: 'aftermath',
  },
  aftermath: {
    FINISH: 'idle',
  },
};

export function attackReducer(state: AttackState, event: AttackEvent): AttackState {
  const nextState = VALID_TRANSITIONS[state]?.[event.type];
  if (!nextState) {
    return state;
  }
  return nextState;
}
