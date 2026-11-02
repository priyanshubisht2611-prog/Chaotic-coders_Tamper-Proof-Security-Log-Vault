/**
 * alarm.ts — Web Audio API–based alarm for Sentinel Vault
 *
 * Generates a loud, attention-grabbing multi-tone siren using the browser's
 * AudioContext. No audio files required — synthesised entirely client-side.
 */

let audioCtx: AudioContext | null = null;
let alarmNodes: Array<OscillatorNode | GainNode> = [];
let alarmActive = false;

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/**
 * Start a repeating two-tone siren alarm.
 * Call stopAlarm() to silence it.
 */
export function startAlarm(): void {
  if (alarmActive) return;
  alarmActive = true;

  const ctx = getAudioContext();
  // Resume context if browser suspended it
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Master gain (volume)
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.6, ctx.currentTime);
  masterGain.connect(ctx.destination);

  // Create alternating siren tones that loop
  const scheduleSiren = (startTime: number, cycles: number) => {
    for (let i = 0; i < cycles; i++) {
      // High tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, startTime + i * 0.4);
      osc1.frequency.linearRampToValueAtTime(1200, startTime + i * 0.4 + 0.2);
      gain1.gain.setValueAtTime(0, startTime + i * 0.4);
      gain1.gain.linearRampToValueAtTime(0.5, startTime + i * 0.4 + 0.03);
      gain1.gain.setValueAtTime(0.5, startTime + i * 0.4 + 0.17);
      gain1.gain.linearRampToValueAtTime(0, startTime + i * 0.4 + 0.2);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(startTime + i * 0.4);
      osc1.stop(startTime + i * 0.4 + 0.2);
      alarmNodes.push(osc1, gain1);

      // Low tone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(660, startTime + i * 0.4 + 0.2);
      osc2.frequency.linearRampToValueAtTime(880, startTime + i * 0.4 + 0.4);
      gain2.gain.setValueAtTime(0, startTime + i * 0.4 + 0.2);
      gain2.gain.linearRampToValueAtTime(0.5, startTime + i * 0.4 + 0.23);
      gain2.gain.setValueAtTime(0.5, startTime + i * 0.4 + 0.37);
      gain2.gain.linearRampToValueAtTime(0, startTime + i * 0.4 + 0.4);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(startTime + i * 0.4 + 0.2);
      osc2.stop(startTime + i * 0.4 + 0.4);
      alarmNodes.push(osc2, gain2);
    }
  };

  // Schedule 15 seconds of alarm (loops until stopAlarm is called)
  const scheduleLoop = () => {
    if (!alarmActive) return;
    scheduleSiren(ctx.currentTime, 25); // 25 cycles × 0.4s = 10s chunk
    alarmTimer = window.setTimeout(scheduleLoop, 9500);
  };

  scheduleLoop();
  alarmNodes.push(masterGain);
}

let alarmTimer: number | null = null;

/**
 * Stop and tear down the siren alarm.
 */
export function stopAlarm(): void {
  alarmActive = false;
  if (alarmTimer !== null) {
    clearTimeout(alarmTimer);
    alarmTimer = null;
  }
  alarmNodes.forEach((node) => {
    try {
      if (node instanceof OscillatorNode) {
        node.stop();
      }
      node.disconnect();
    } catch {
      // Already stopped — safe to ignore
    }
  });
  alarmNodes = [];
}

/**
 * Play a single short alert beep (for notification arrivals).
 */
export function playAlertBeep(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const beepGain = ctx.createGain();
    beepGain.gain.setValueAtTime(0, ctx.currentTime);
    beepGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01);
    beepGain.gain.setValueAtTime(0.4, ctx.currentTime + 0.08);
    beepGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    beepGain.connect(ctx.destination);

    const beep = ctx.createOscillator();
    beep.type = 'sine';
    beep.frequency.setValueAtTime(1200, ctx.currentTime);
    beep.connect(beepGain);
    beep.start(ctx.currentTime);
    beep.stop(ctx.currentTime + 0.15);
  } catch {
    // Audio context not available
  }
}

export const isAlarmActive = (): boolean => alarmActive;
