import React, { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Trash2, RotateCcw, Loader2, Download, Shield } from 'lucide-react';
import {
  useVaultStore,
  generateAuditManifest,
  selectTamperedCount,
  selectMissingCount,
} from '@/store/useVaultStore';
import { Kbd } from '@/features/timeline/WindowDetailsPanel';

export const ControlBar: React.FC = () => {
  const isScanning = useVaultStore((s) => s.isScanning);
  const scanningIndex = useVaultStore((s) => s.scanningIndex);
  const isModifying = useVaultStore((s) => s.isModifying);
  const isAttackOverlayOpen = useVaultStore((s) => s.isAttackOverlayOpen);
  const skipSimulationConfirm = useVaultStore((s) => s.skipSimulationConfirm);
  const setPendingSimulationAction = useVaultStore((s) => s.setPendingSimulationAction);
  const startVerification = useVaultStore((s) => s.startVerification);
  const triggerModification = useVaultStore((s) => s.triggerModification);
  const simulateDeletion = useVaultStore((s) => s.simulateDeletion);
  const reset = useVaultStore((s) => s.reset);

  const tamperedCount = useVaultStore(selectTamperedCount);
  const missingCount = useVaultStore(selectMissingCount);

  const disabled = isScanning || isModifying;

  const handleVerify = useCallback(() => {
    if (!disabled) startVerification();
  }, [disabled, startVerification]);

  const handleAttack = useCallback(() => {
    if (disabled) return;
    if (skipSimulationConfirm) {
      triggerModification('tamper');
    } else {
      setPendingSimulationAction('tamper');
    }
  }, [disabled, skipSimulationConfirm, triggerModification, setPendingSimulationAction]);

  const handleDeletion = useCallback(() => {
    if (disabled) return;
    if (skipSimulationConfirm) {
      simulateDeletion();
    } else {
      setPendingSimulationAction('delete');
    }
  }, [disabled, skipSimulationConfirm, simulateDeletion, setPendingSimulationAction]);

  const handleReset = useCallback(() => {
    if (!disabled) reset();
  }, [disabled, reset]);

  const handleExport = useCallback(() => {
    try {
      const manifest = generateAuditManifest(useVaultStore.getState());
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifest, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `sentinel-vault-audit-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      useVaultStore.getState().addEvent('Cryptographic audit manifest exported (JSON)', 'info');
      useVaultStore.getState().setToastMessage('Audit proof manifest exported successfully');
    } catch {
      useVaultStore.getState().setToastMessage('Failed to export audit manifest');
    }
  }, []);

  // Global keyboard shortcuts: V, A, D, R, E
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Active only when no input is focused and the attack overlay is idle
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (isAttackOverlayOpen || isScanning || isModifying) return;

      // Don't trigger if modifiers (Ctrl, Alt, Meta) are held (Shift+R handled by Full Reset)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if ((e.key === 'v' || e.key === 'V') && !e.shiftKey) {
        e.preventDefault();
        startVerification();
      } else if ((e.key === 'a' || e.key === 'A') && !e.shiftKey) {
        e.preventDefault();
        handleAttack();
      } else if ((e.key === 'd' || e.key === 'D') && !e.shiftKey) {
        e.preventDefault();
        handleDeletion();
      } else if ((e.key === 'r' || e.key === 'R') && !e.shiftKey) {
        e.preventDefault();
        reset();
      } else if ((e.key === 'e' || e.key === 'E') && !e.shiftKey) {
        e.preventDefault();
        handleExport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAttackOverlayOpen,
    isScanning,
    isModifying,
    startVerification,
    handleAttack,
    handleDeletion,
    reset,
    handleExport,
  ]);

  return (
    <aside
      aria-label="Dashboard controls"
      className="sticky top-0 z-30 w-full mb-6 py-3 px-6 rounded-2xl bg-[#0d1527]/90 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-wrap items-center justify-between gap-4"
    >
      {/* Left: Control Buttons with <Kbd> Badges */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Verify Logs [V] */}
        <motion.button
          type="button"
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          onClick={handleVerify}
          disabled={disabled}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
            isScanning
              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 cursor-wait animate-pulse'
              : disabled
                ? 'opacity-40 cursor-not-allowed bg-white/5 text-white/50 border border-white/5'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]'
          }`}
        >
          {isScanning ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          )}
          <span>Verify Logs</span>
          <Kbd>V</Kbd>
        </motion.button>

        {/* Simulate Attack [A] */}
        <motion.button
          type="button"
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          onClick={handleAttack}
          disabled={disabled}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d2e] ${
            disabled
              ? 'opacity-40 cursor-not-allowed bg-white/5 text-white/50 border border-white/5'
              : 'bg-[#e11d2e] hover:bg-[#ff2a3c] text-white border border-red-400/40 hover:shadow-[0_0_20px_rgba(225,29,46,0.35)]'
          }`}
        >
          <Zap className="w-4 h-4 text-yellow-300" />
          <span>Simulate Attack</span>
          <Kbd>A</Kbd>
        </motion.button>

        {/* Simulate Deletion [D] */}
        <motion.button
          type="button"
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          onClick={handleDeletion}
          disabled={disabled}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            disabled
              ? 'opacity-40 cursor-not-allowed bg-white/5 text-white/50 border border-white/5'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/10 hover:border-amber-500/50 hover:text-white hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]'
          }`}
        >
          <Trash2 className="w-4 h-4 text-amber-400" />
          <span>Simulate Deletion</span>
          <Kbd>D</Kbd>
        </motion.button>

        {/* Reset Demo [R] */}
        <motion.button
          type="button"
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          onClick={handleReset}
          disabled={disabled}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] ${
            disabled
              ? 'opacity-40 cursor-not-allowed bg-white/5 text-white/50 border border-white/5'
              : 'bg-[#2f6bff]/20 hover:bg-[#2f6bff]/30 text-[#2f6bff] hover:text-white border border-[#2f6bff]/40 hover:shadow-[0_0_20px_rgba(47,107,255,0.25)]'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-[#2f6bff]" />
          <span>Reset Demo</span>
          <Kbd>R</Kbd>
        </motion.button>

        {/* Export Proof [E] */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExport}
          className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all shadow-md bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export Proof</span>
          <Kbd>E</Kbd>
        </motion.button>
      </div>

      {/* Right: Live Scan Status / Dynamic Audit Mode */}
      <div className="flex items-center space-x-3 text-xs font-mono">
        <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-vault-muted uppercase tracking-wider">
          <Shield className="w-3 h-3 text-[#2f6bff]" />
          <span>Test Sandbox</span>
        </div>

        {isScanning ? (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">
              Scanning window {scanningIndex ?? 1}/12
            </span>
          </div>
        ) : tamperedCount > 0 || missingCount > 0 ? (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#e11d2e]/10 border border-[#e11d2e]/40 text-[#ff4d5a] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#e11d2e] animate-ping" />
            <span className="uppercase text-[11px] tracking-wider font-bold">
              Ledger Discrepancy ({tamperedCount} tampered, {missingCount} missing)
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="uppercase text-[11px] tracking-wider">
              Deterministic Ledger Clean (12/12)
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
