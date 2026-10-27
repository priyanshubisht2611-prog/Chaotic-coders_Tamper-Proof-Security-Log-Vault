import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, HelpCircle } from 'lucide-react';
import { LogWindow } from '@/types/log';
import { formatTickTime } from './TimeAxis';
import { SpiderWebCrack } from '@/features/verification/SpiderWebCrack';
import { useVaultStore } from '@/store/useVaultStore';

export interface WindowCardProps {
  window: LogWindow;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
}

const WindowCardComponent: React.FC<WindowCardProps> = ({
  window: logWindow,
  isHovered,
  isSelected,
  onHover,
  onSelect,
}) => {
  const [internalHover, setInternalHover] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const prevStatusRef = useRef(logWindow.status);

  const isScanning = useVaultStore((s) => s.isScanning);
  const scanningIndex = useVaultStore((s) => s.scanningIndex);
  const cardGlitchId = useVaultStore((s) => s.cardGlitchId);

  // Trigger one short shake animation when status changes (e.g., when tampered)
  useEffect(() => {
    if (prevStatusRef.current !== logWindow.status) {
      prevStatusRef.current = logWindow.status;
      setShakeTrigger((prev) => prev + 1);
    }
  }, [logWindow.status]);

  const activeHover = isHovered || internalHover;
  const isBeingScanned = isScanning && scanningIndex === logWindow.id;
  const isGlitching = cardGlitchId === logWindow.id;

  const shortHash = useMemo(() => {
    if (!logWindow.hash) return '--------...';
    return `${logWindow.hash.slice(0, 8)}...`;
  }, [logWindow.hash]);

  const timeRangeLabel = useMemo(() => {
    return `${formatTickTime(logWindow.start)} - ${formatTickTime(logWindow.end)} UTC`;
  }, [logWindow.start, logWindow.end]);

  const ariaLabel = useMemo(() => {
    return `Window ${formatTickTime(logWindow.start)}-${formatTickTime(logWindow.end)}, ${logWindow.status}`;
  }, [logWindow.start, logWindow.end, logWindow.status]);

  // Card appearance according to status
  const cardStatusClasses = useMemo(() => {
    switch (logWindow.status) {
      case 'intact':
        return 'border-emerald-500/30 bg-[#0d1527]/90 text-white shadow-[0_0_15px_rgba(16,185,129,0.12)] hover:border-emerald-400/60 hover:shadow-[0_0_22px_rgba(16,185,129,0.25)]';
      case 'tampered':
        return 'border-[#e11d2e] bg-[#e11d2e]/10 text-white shadow-[0_0_22px_rgba(225,29,46,0.35)] hover:border-[#ff3849] hover:shadow-[0_0_30px_rgba(225,29,46,0.5)]';
      case 'missing':
        return 'border-2 border-dashed border-neutral-600/70 bg-neutral-900/30 text-neutral-400 hover:border-neutral-400';
    }
  }, [logWindow.status]);

  return (
    <motion.button
      type="button"
      id={`window-card-${logWindow.id}`}
      layout
      aria-label={ariaLabel}
      onClick={() => onSelect(logWindow.id)}
      onMouseEnter={() => {
        setInternalHover(true);
        onHover(logWindow.id);
      }}
      onMouseLeave={() => {
        setInternalHover(false);
        onHover(null);
      }}
      onFocus={() => {
        setInternalHover(true);
        onHover(logWindow.id);
      }}
      onBlur={() => {
        setInternalHover(false);
        onHover(null);
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        y: activeHover ? -3 : 0,
        x: shakeTrigger > 0 ? [0, -8, 8, -6, 6, -3, 3, 0] : 0,
      }}
      transition={{
        y: { duration: 0.2, ease: 'easeOut' },
        x: { duration: 0.45, ease: 'easeInOut' },
        scale: { duration: 0.15 },
      }}
      className={`group relative flex flex-col justify-between w-full p-4 rounded-xl text-left backdrop-blur-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b14] overflow-hidden ${cardStatusClasses} ${
        isSelected ? 'ring-2 ring-[#2f6bff] ring-offset-2 ring-offset-[#070b14]' : ''
      } ${activeHover ? 'border-white/50' : ''}`}
    >
      {/* Spider-Web Crack SVG when card is tampered (Phase 5) */}
      {logWindow.status === 'tampered' && <SpiderWebCrack />}

      {/* Animated gradient border on selected card (Phase 5) */}
      {isSelected && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-xl p-[2px] pointer-events-none overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-[#2f6bff] via-emerald-400 to-[#e11d2e] opacity-80 animate-pulse" />
        </span>
      )}

      {/* Localized 0.4s Red Glitch on this card when specifically modified/deleted */}
      {isGlitching && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-30 pointer-events-none bg-[#e11d2e]/40 border-2 border-[#e11d2e] animate-pulse"
        />
      )}

      {/* ScanBeam Pass Flash: Flashes brightly as the beam sweeps over this card */}
      {isBeingScanned && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-20 pointer-events-none bg-emerald-400/25 border border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-opacity duration-200"
        />
      )}

      {/* Tooltip with full hash start and anchoredAt time */}
      <AnimatePresence>
        {activeHover && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-[#070b14]/95 border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-md z-40 pointer-events-none text-left"
          >
            <div className="flex items-center justify-between mb-1.5 border-b border-white/10 pb-1">
              <span className="text-[10px] font-heading uppercase tracking-wider text-vault-muted">
                Window #{logWindow.id.toString().padStart(2, '0')} Info
              </span>
              <span
                className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                  logWindow.status === 'tampered'
                    ? 'bg-[#e11d2e]/20 text-[#e11d2e]'
                    : logWindow.status === 'intact'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {logWindow.status}
              </span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div>
                <span className="text-white/40 block text-[9px] uppercase">Hash Prefix:</span>
                <span className="text-white break-all">{logWindow.hash.slice(0, 16)}...</span>
              </div>
              <div>
                <span className="text-white/40 block text-[9px] uppercase">Anchored At:</span>
                <span className="text-emerald-400">{logWindow.anchoredAt || 'Pending anchor'}</span>
              </div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 rotate-45 bg-[#070b14] border-r border-b border-white/20" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Header: Window ID & Status Badge */}
      <div className="relative z-10 flex items-center justify-between mb-3 w-full">
        <span className="font-heading font-black text-sm tracking-wider text-white">
          WINDOW #{logWindow.id.toString().padStart(2, '0')}
        </span>

        {/* Status Badge with Lucide Icon */}
        <div
          className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-medium tracking-wide border ${
            logWindow.status === 'intact'
              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
              : logWindow.status === 'tampered'
                ? 'border-[#e11d2e]/60 bg-[#e11d2e]/20 text-[#e11d2e] font-bold'
                : 'border-neutral-600 bg-neutral-800/60 text-neutral-400'
          }`}
        >
          {logWindow.status === 'intact' && <ShieldCheck className="w-3.5 h-3.5" />}
          {logWindow.status === 'tampered' && <ShieldAlert className="w-3.5 h-3.5" />}
          {logWindow.status === 'missing' && <HelpCircle className="w-3.5 h-3.5" />}
          <span className="uppercase text-[10px]">{logWindow.status}</span>
        </div>
      </div>

      {/* Card Body: Time Range & Short Hash */}
      <div className="relative z-10 space-y-1.5 font-mono text-xs w-full">
        <div className="flex items-center justify-between text-vault-muted">
          <span className="text-white/50 text-[11px]">Range</span>
          <span className="text-white/90 text-xs">{timeRangeLabel}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/50 text-[11px]">Hash</span>
          <span className="text-[11px] text-white/70 bg-black/30 px-1.5 py-0.5 rounded border border-white/5">
            {shortHash}
          </span>
        </div>

        {logWindow.detectedAt && logWindow.status === 'tampered' && (
          <div className="mt-1 pt-1.5 border-t border-[#e11d2e]/20 flex items-center justify-between text-[10px] text-[#e11d2e] font-bold">
            <span>Detected:</span>
            <span>{new Date(logWindow.detectedAt).toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </motion.button>
  );
};

export const WindowCard = React.memo(WindowCardComponent);
