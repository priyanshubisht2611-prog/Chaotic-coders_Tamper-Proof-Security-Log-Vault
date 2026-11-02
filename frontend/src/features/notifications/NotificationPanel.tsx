/**
 * NotificationPanel.tsx — Firebase Push Notification Control Panel
 *
 * Allows the user to:
 *  1. Enable browser push notifications (get FCM token)
 *  2. Register device with the Flask backend
 *  3. Test push notifications (send test alert)
 *  4. Manually trigger/stop the Vault alarm
 *
 * This panel mounts alongside the ControlBar and wires into the vault's anomaly state.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  BellRing,
  Volume2,
  VolumeX,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Shield,
} from 'lucide-react';
import {
  requestNotificationPermission,
  onForegroundMessage,
  getNotificationPermission,
} from '@/services/firebase';
import { startAlarm, stopAlarm, playAlertBeep, isAlarmActive } from '@/services/alarm';
import { useVaultStore } from '@/store/useVaultStore';

// ── Types ──────────────────────────────────────────────────────────────────────

type PermState = 'unsupported' | 'default' | 'granted' | 'denied';
type RegisterState = 'idle' | 'loading' | 'success' | 'error';

// ── Backend helpers ────────────────────────────────────────────────────────────

// Demo API key — same key used across the project for simulate-attack and cloud-sync.
// In a real deployment this would come from a user session token or env var.
const DEMO_API_KEY = 'sk_demo_sec_999';

async function registerTokenWithBackend(token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/register-fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DEMO_API_KEY,
      },
      body: JSON.stringify({ token }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendTestAlert(token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/send-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DEMO_API_KEY,
      },
      body: JSON.stringify({
        token,
        title: '🚨 Sentinel Vault Test Alert',
        body: 'Push notification system is working correctly. Your vault is being monitored.',
        severity: 'test',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export const NotificationPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [permState, setPermState] = useState<PermState>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [registerState, setRegisterState] = useState<RegisterState>('idle');
  const [alarmOn, setAlarmOn] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const windows = useVaultStore((s) => s.windows);
  const addEvent = useVaultStore((s) => s.addEvent);
  const isBackendConnected = useVaultStore((s) => s.isBackendConnected);

  const isAnomalous = windows.some(
    (w) => w.status === 'tampered' || w.status === 'missing',
  );

  // ── Init ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const perm = getNotificationPermission();
    setPermState(perm);
  }, []);

  // ── Auto-alarm on anomaly ─────────────────────────────────────────────────────

  useEffect(() => {
    if (isAnomalous && !isAlarmActive()) {
      startAlarm();
      setAlarmOn(true);
      addEvent('🔴 ALARM TRIGGERED: Vault anomaly detected — siren active', 'error');
      // Show browser notification if permission already granted
      if (permState === 'granted') {
        try {
          new Notification('🚨 SENTINEL VAULT BREACH', {
            body: 'Cryptographic anomaly detected in your security log vault!',
            icon: '/favicon.ico',
            requireInteraction: true,
            tag: 'sentinel-breach',
          });
        } catch {
          // Notification API may be blocked
        }
      }
    } else if (!isAnomalous && isAlarmActive()) {
      stopAlarm();
      setAlarmOn(false);
      addEvent('✅ Alarm cleared: vault integrity restored', 'success');
    }
  }, [isAnomalous, permState, addEvent]);

  // ── Foreground FCM message handler ───────────────────────────────────────────

  useEffect(() => {
    const unsub = onForegroundMessage((payload) => {
      playAlertBeep();
      addEvent(
        `📲 Push notification received: ${payload.notification?.title ?? 'Alert'}`,
        'warning',
      );
      setStatusMsg(`📲 ${payload.notification?.body ?? 'Alert received'}`);
    });
    return unsub;
  }, [addEvent]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleEnableNotifications = useCallback(async () => {
    setRegisterState('loading');
    setStatusMsg('Requesting permission…');

    const token = await requestNotificationPermission();
    const perm = getNotificationPermission();
    setPermState(perm as PermState);

    if (!token) {
      setRegisterState('error');
      setStatusMsg(
        perm === 'denied'
          ? 'Permission denied. Enable notifications in browser settings.'
          : 'Could not obtain FCM token. Check Firebase config.',
      );
      return;
    }

    setFcmToken(token);
    setStatusMsg('Registering device with backend…');

    const ok = await registerTokenWithBackend(token);
    if (ok) {
      setRegisterState('success');
      addEvent('📲 Push notifications enabled — device registered', 'success');
      setStatusMsg('Device registered ✓ — you will receive breach alerts on this device.');
    } else {
      setRegisterState('error');
      setStatusMsg(
        isBackendConnected
          ? 'FCM token obtained but backend registration failed.'
          : 'Backend offline — token saved locally only.',
      );
    }
  }, [addEvent, isBackendConnected]);

  const handleTestAlert = useCallback(async () => {
    if (!fcmToken) return;
    setIsSendingTest(true);
    setStatusMsg('Sending test notification…');
    const ok = await sendTestAlert(fcmToken);
    setIsSendingTest(false);
    if (ok) {
      playAlertBeep();
      addEvent('📬 Test push notification dispatched', 'info');
      setStatusMsg('Test notification dispatched ✓ — check your device/browser.');
    } else {
      setStatusMsg('Failed to send test alert. Backend may be offline.');
    }
  }, [fcmToken, addEvent]);

  const handleToggleAlarm = useCallback(() => {
    if (alarmOn) {
      stopAlarm();
      setAlarmOn(false);
      addEvent('🔕 Alarm manually silenced by operator', 'info');
    } else {
      startAlarm();
      setAlarmOn(true);
      addEvent('🔔 Alarm manually triggered by operator', 'warning');
    }
  }, [alarmOn, addEvent]);

  // ── Derived UI state ──────────────────────────────────────────────────────────

  const tokenShort = fcmToken ? `${fcmToken.slice(0, 16)}…${fcmToken.slice(-8)}` : null;

  const permColor =
    permState === 'granted'
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
      : permState === 'denied'
        ? 'text-red-400 border-red-500/40 bg-red-500/10'
        : 'text-amber-400 border-amber-500/40 bg-amber-500/10';

  const permLabel =
    permState === 'granted' ? 'Allowed' : permState === 'denied' ? 'Blocked' : 'Not Set';

  return (
    <div
      className={`w-full rounded-2xl border transition-all duration-300 overflow-hidden ${
        isAnomalous
          ? 'border-[#e11d2e]/40 bg-gradient-to-r from-[#e11d2e]/10 via-[#0d1527] to-[#070b14] shadow-[0_0_24px_rgba(225,29,46,0.15)]'
          : 'border-white/10 bg-[#0d1527]/70'
      }`}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/3 transition-colors group"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3">
          {/* Animated bell icon */}
          <div
            className={`p-2 rounded-xl border flex items-center justify-center ${
              alarmOn
                ? 'bg-[#e11d2e]/20 border-[#e11d2e]/50 text-[#ff4d5a] shadow-[0_0_12px_rgba(225,29,46,0.3)]'
                : permState === 'granted'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-white/50'
            }`}
          >
            {alarmOn ? (
              <BellRing className="w-4 h-4 animate-bounce" />
            ) : permState === 'granted' ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">
                Push Notifications
              </span>
              {alarmOn && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-[#e11d2e]/25 text-[#ff4d5a] border border-[#e11d2e]/40 animate-pulse">
                  ALARM ACTIVE
                </span>
              )}
            </div>
            <p className="text-sm font-heading font-bold text-white uppercase tracking-wide">
              Alert & Siren Control
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Permission badge */}
          <span
            className={`hidden sm:flex items-center space-x-1 text-[10px] font-mono px-2 py-1 rounded border uppercase tracking-wider ${permColor}`}
          >
            <Shield className="w-2.5 h-2.5" />
            <span>{permLabel}</span>
          </span>

          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
          )}
        </div>
      </button>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="panel-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 space-y-4 border-t border-white/5">
              {/* ── Alarm Siren Toggle ── */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/5">
                <div className="flex items-center space-x-3">
                  {alarmOn ? (
                    <Volume2 className="w-4 h-4 text-[#ff4d5a] animate-pulse" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-white/40" />
                  )}
                  <div>
                    <p className="text-xs font-heading font-bold text-white uppercase">
                      Vault Alarm Siren
                    </p>
                    <p className="text-[10px] text-white/50">
                      {alarmOn ? 'Siren running — click to silence' : 'Siren is off'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAlarm}
                  className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider border transition-all ${
                    alarmOn
                      ? 'bg-[#e11d2e]/20 border-[#e11d2e]/50 text-[#ff4d5a] hover:bg-[#e11d2e]/30'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {alarmOn ? 'Silence' : 'Trigger'}
                </button>
              </div>

              {/* ── Push Notification Enable ── */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/5">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-4 h-4 text-[#2f6bff]" />
                  <div>
                    <p className="text-xs font-heading font-bold text-white uppercase">
                      Browser Push Notifications
                    </p>
                    <p className="text-[10px] text-white/50">
                      {fcmToken
                        ? `Registered: ${tokenShort}`
                        : 'Enable to receive breach alerts'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  disabled={
                    registerState === 'loading' ||
                    permState === 'denied' ||
                    registerState === 'success'
                  }
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    registerState === 'success'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : permState === 'denied'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-[#2f6bff]/20 border-[#2f6bff]/40 text-[#2f6bff] hover:bg-[#2f6bff]/30'
                  }`}
                >
                  {registerState === 'loading' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : registerState === 'success' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : registerState === 'error' ? (
                    <XCircle className="w-3 h-3" />
                  ) : (
                    <Bell className="w-3 h-3" />
                  )}
                  <span>
                    {registerState === 'success'
                      ? 'Registered'
                      : permState === 'denied'
                        ? 'Blocked'
                        : 'Enable'}
                  </span>
                </button>
              </div>

              {/* ── Test Alert ── */}
              {fcmToken && (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/5">
                  <div className="flex items-center space-x-3">
                    <Send className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="text-xs font-heading font-bold text-white uppercase">
                        Send Test Alert
                      </p>
                      <p className="text-[10px] text-white/50">
                        Fire a test push notification via backend
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestAlert}
                    disabled={isSendingTest || !isBackendConnected}
                    title={!isBackendConnected ? 'Backend offline' : 'Send test push'}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider border transition-all bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSendingTest ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    <span>Test Push</span>
                  </button>
                </div>
              )}

              {/* ── Status Message ── */}
              <AnimatePresence>
                {statusMsg && (
                  <motion.p
                    key="status"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[11px] font-mono text-white/60 px-1"
                  >
                    {statusMsg}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* ── How it works note ── */}
              <div className="text-[10px] font-mono text-white/30 leading-relaxed pt-1 border-t border-white/5">
                Alarm triggers automatically when a tampered or missing window is detected.
                Push notifications are dispatched via Firebase Cloud Messaging through the
                Flask backend — they will arrive even when the browser is closed.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
