import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Copy,
  Check,
  Clock,
  Fingerprint,
  Layers,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useVaultStore } from '@/store/useVaultStore';
import { INITIAL_MOCK_LOGS } from '@/data/mockLogs';
import { formatTickTime } from './TimeAxis';
import { Toast } from '@/shared/ui/Toast';

export const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 text-[10px] font-mono font-bold text-white/90 bg-white/10 border border-white/20 rounded shadow-sm">
    {children}
  </kbd>
);

export const WindowDetailsPanel: React.FC = () => {
  const windows = useVaultStore((s) => s.windows);
  const selectedId = useVaultStore((s) => s.selectedId);
  const setSelectedId = useVaultStore((s) => s.setSelectedId);
  const fullReset = useVaultStore((s) => s.fullReset);

  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const sortedWindows = useMemo(() => {
    return [...windows].sort((a, b) => a.id - b.id || a.start.localeCompare(b.start));
  }, [windows]);

  const selectedWindow = useMemo(() => {
    return windows.find((w) => w.id === selectedId) || null;
  }, [windows, selectedId]);

  // Copy hash handler with feedback and toast
  const handleCopyHash = useCallback(
    async (hash: string, winId: number) => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(hash);
        }
      } catch {
        // Fallback for environments where clipboard API is restricted
        const textarea = document.createElement('textarea');
        textarea.value = hash;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setToastMessage(`Window #${winId.toString().padStart(2, '0')} hash copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    },
    [],
  );

  // Keyboard navigation & shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts while typing in an input, textarea, select, or editable element
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

      if (e.shiftKey && (e.key === 'R' || e.key === 'r')) {
        e.preventDefault();
        fullReset();
        return;
      }

      if (e.key === 'Escape') {
        setSelectedId(null);
        return;
      }

      if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (selectedWindow) {
          e.preventDefault();
          handleCopyHash(selectedWindow.hash, selectedWindow.id);
        }
        return;
      }

      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      if (!isArrow || sortedWindows.length === 0) return;

      e.preventDefault();

      const currentIndex = sortedWindows.findIndex((w) => w.id === selectedId);

      let nextIndex = 0;
      if (currentIndex === -1) {
        // When nothing selected, default to first or last depending on arrow
        nextIndex = e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? sortedWindows.length - 1 : 0;
      } else {
        // 3 columns grid navigation
        switch (e.key) {
          case 'ArrowRight':
            nextIndex = Math.min(sortedWindows.length - 1, currentIndex + 1);
            break;
          case 'ArrowLeft':
            nextIndex = Math.max(0, currentIndex - 1);
            break;
          case 'ArrowDown':
            nextIndex = Math.min(sortedWindows.length - 1, currentIndex + 3);
            break;
          case 'ArrowUp':
            nextIndex = Math.max(0, currentIndex - 3);
            break;
        }
      }

      const nextWindow = sortedWindows[nextIndex];
      if (nextWindow) {
        setSelectedId(nextWindow.id);
        const cardElement = document.getElementById(`window-card-${nextWindow.id}`);
        cardElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedWindow, sortedWindows, setSelectedId, handleCopyHash, fullReset]);

  const formatTimestamp = (iso?: string) => {
    if (!iso) return 'Not recorded';
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return iso;
      return `${date.toISOString().replace('T', ' ').slice(0, 19)} UTC`;
    } catch {
      return iso;
    }
  };

  return (
    <>
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
        type="info"
        duration={5000}
      />

      <aside
        aria-label="Cryptographic Window Details"
        className="w-full rounded-2xl border border-white/10 bg-[#0d1527]/70 backdrop-blur-xl p-6 min-h-[580px] flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.4)] relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#2f6bff]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {!selectedWindow ? (
              /* Empty State */
              <motion.div
                key="empty"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex-1 flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-vault-muted mb-4 shadow-inner">
                  <Layers className="w-8 h-8 text-white/30" />
                </div>
                <h3 className="font-heading font-bold text-lg uppercase tracking-wider text-white">
                  Window Details
                </h3>
                <p className="mt-2 text-sm text-vault-muted font-sans max-w-[240px] leading-relaxed">
                  Select a window to inspect it
                </p>
                <p className="mt-4 text-xs text-white/40 font-mono">
                  Use arrow keys or click on any ledger card to view its cryptographic fingerprint.
                </p>
              </motion.div>
            ) : (
              /* Selected Window Content */
              <motion.div
                key={`window-${selectedWindow.id}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="space-y-4 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20"
              >
                {/* Header: Window ID & Status Badge */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#2f6bff] block">
                      Ledger Interval
                    </span>
                    <h3 className="font-heading font-black text-xl uppercase tracking-wider text-white">
                      WINDOW #{selectedWindow.id.toString().padStart(2, '0')}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wide border ${
                      selectedWindow.status === 'intact'
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : selectedWindow.status === 'tampered'
                          ? 'border-[#e11d2e]/60 bg-[#e11d2e]/20 text-[#e11d2e] font-bold shadow-[0_0_15px_rgba(225,29,46,0.3)]'
                          : 'border-neutral-600 bg-neutral-800/80 text-neutral-400'
                    }`}
                  >
                    {selectedWindow.status === 'intact' && <ShieldCheck className="w-4 h-4" />}
                    {selectedWindow.status === 'tampered' && <ShieldAlert className="w-4 h-4" />}
                    {selectedWindow.status === 'missing' && <HelpCircle className="w-4 h-4" />}
                    <span className="uppercase text-[11px]">{selectedWindow.status}</span>
                  </div>
                </div>

                {/* Fingerprint Verification Alert Box with Diagnostic Explanation */}
                {selectedWindow.status === 'intact' ? (
                  <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-start space-x-3 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.12)]">
                    <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold leading-snug">
                        Matches original anchored fingerprint
                      </p>
                      <p className="text-[11px] text-white/70 font-sans mt-0.5 leading-relaxed">
                        Deterministic verification passed. Recomputed hash bitwise-matches the immutable root checkpoint.
                      </p>
                    </div>
                  </div>
                ) : selectedWindow.status === 'tampered' ? (
                  <div className="p-3 rounded-xl border border-[#e11d2e]/50 bg-[#e11d2e]/10 flex items-start space-x-3 text-[#ff4d5a] shadow-[0_0_20px_rgba(225,29,46,0.18)]">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#e11d2e]" />
                    <div>
                      <p className="text-xs font-bold leading-snug">
                        Integrity Failure: Hash Mismatch Detected
                      </p>
                      <p className="text-[11px] text-white/80 font-sans mt-0.5 leading-relaxed">
                        The recomputed stream hash diverges from the anchored checkpoint. Log records inside this 5-minute interval have been altered after recording.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-neutral-600/50 bg-neutral-800/40 flex items-start space-x-3 text-neutral-300">
                    <HelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-400" />
                    <div>
                      <p className="text-xs font-bold leading-snug">
                        Record Omitted: Interval Payload Missing
                      </p>
                      <p className="text-[11px] text-white/70 font-sans mt-0.5 leading-relaxed">
                        No stream records were ingested for this interval, creating a gap in the expected chronological audit timeline.
                      </p>
                    </div>
                  </div>
                )}

                {/* Ledger Checkpoint & Chain Traceability */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-vault-muted pb-1 border-b border-white/5">
                    <span className="text-[10px] uppercase text-white/50">Checkpoint Reference</span>
                    <span className="text-[#2f6bff] font-bold text-[11px]">
                      VAULT-CKPT-20261027-W{selectedWindow.id.toString().padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-vault-muted">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/50" />
                      <span className="text-white/60">Time Range:</span>
                    </div>
                    <span className="text-white font-semibold">
                      {formatTickTime(selectedWindow.start)} - {formatTickTime(selectedWindow.end)} UTC
                    </span>
                  </div>

                  {/* Previous Window Link */}
                  <div className="pt-1 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] uppercase text-white/50">Previous Window Link:</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-white/80 text-[10px] bg-black/40 px-1.5 py-0.5 rounded border border-white/5 font-mono">
                        {selectedWindow.id === 1
                          ? '0000000000000000... (GENESIS)'
                          : `${(INITIAL_MOCK_LOGS.find((m) => m.id === selectedWindow.id - 1)?.hash || '').slice(0, 16)}...`}
                      </span>
                      {selectedWindow.id > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const prevHash = INITIAL_MOCK_LOGS.find((m) => m.id === selectedWindow.id - 1)?.hash;
                            if (prevHash) handleCopyHash(prevHash, selectedWindow.id - 1);
                          }}
                          title="Copy previous window hash"
                          className="text-white/50 hover:text-white transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hash Comparison: Anchored Root Hash vs Recomputed Stream Hash */}
                <div className="space-y-3">
                  {/* Anchored Checkpoint Hash */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 text-vault-muted font-mono">
                        <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-white/70">Anchored Root Hash (Checkpoint)</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const original = INITIAL_MOCK_LOGS.find((m) => m.id === selectedWindow.id)?.hash || selectedWindow.hash;
                          handleCopyHash(original, selectedWindow.id);
                        }}
                        aria-label="Copy anchored hash"
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/80 text-[10px] font-mono border border-white/10 transition-colors"
                      >
                        <Copy className="w-3 h-3 text-white/60" />
                        <span>Copy</span>
                      </button>
                    </div>

                    <div className="p-2.5 bg-black/40 border border-emerald-500/20 rounded-xl font-mono text-[11px] text-emerald-300 break-all select-all shadow-inner leading-relaxed">
                      {INITIAL_MOCK_LOGS.find((m) => m.id === selectedWindow.id)?.hash || selectedWindow.hash}
                    </div>
                  </div>

                  {/* Recomputed Stream Hash */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 text-vault-muted font-mono">
                        <Fingerprint className="w-3.5 h-3.5 text-[#2f6bff]" />
                        <span className="text-white/70">Recomputed Stream Hash (Current)</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyHash(selectedWindow.hash, selectedWindow.id)}
                        aria-label="Copy recomputed hash"
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          copied
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-white/60" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div
                      className={`p-2.5 bg-black/40 border rounded-xl font-mono text-[11px] break-all select-all shadow-inner leading-relaxed ${
                        selectedWindow.status === 'intact'
                          ? 'border-white/10 text-white/90'
                          : selectedWindow.status === 'tampered'
                            ? 'border-[#e11d2e]/50 text-[#ff4d5a] bg-[#e11d2e]/5'
                            : 'border-neutral-700 text-neutral-400 italic'
                      }`}
                    >
                      {selectedWindow.status === 'missing'
                        ? '[PAYLOAD_OMITTED_FROM_STREAM]'
                        : selectedWindow.hash || 'NO_HASH_RECORDED'}
                    </div>
                  </div>
                </div>

                {/* Anchored At & Detected At Audit Trail */}
                <div className="space-y-2 pt-1 border-t border-white/5 text-xs">
                  {/* Original hash first recorded at */}
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex flex-col space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-vault-muted">
                      Original hash first recorded at
                    </span>
                    <div className="flex items-center space-x-2 font-mono text-white/90 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{formatTimestamp(selectedWindow.anchoredAt)}</span>
                    </div>
                  </div>

                  {/* Change first detected at (only for tampered or missing) */}
                  {(selectedWindow.status === 'tampered' || selectedWindow.status === 'missing') && (
                    <div className="p-2.5 rounded-lg bg-[#e11d2e]/10 border border-[#e11d2e]/30 flex flex-col space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#e11d2e]">
                        Change first detected at
                      </span>
                      <div className="flex items-center space-x-2 font-mono text-[#ff4d5a] font-semibold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#e11d2e] flex-shrink-0" />
                        <span>{formatTimestamp(selectedWindow.detectedAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Shortcut Hint Row at Bottom */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <Kbd>←</Kbd>
            <Kbd>→</Kbd>
            <span className="text-[11px] text-vault-muted font-sans ml-1">Navigate</span>
          </div>

          <div className="flex items-center space-x-1">
            <Kbd>C</Kbd>
            <span className="text-[11px] text-vault-muted font-sans ml-1">Copy hash</span>
          </div>

          <div className="flex items-center space-x-1">
            <Kbd>Esc</Kbd>
            <span className="text-[11px] text-vault-muted font-sans ml-1">Deselect</span>
          </div>

          <div className="flex items-center space-x-1">
            <Kbd>Shift</Kbd>
            <span className="text-white/40 text-[10px]">+</span>
            <Kbd>R</Kbd>
            <span className="text-[11px] text-vault-muted font-sans ml-1">Full Reset</span>
          </div>
        </div>
      </aside>
    </>
  );
};
