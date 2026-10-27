import React, { useEffect, useState } from 'react';
import { animate, useMotionValue } from 'framer-motion';
import { ShieldCheck, ShieldAlert, HelpCircle } from 'lucide-react';
import { useVaultStore, selectIntactCount, selectTamperedCount, selectMissingCount } from '@/store/useVaultStore';

interface CountUpProps {
  value: number;
}

const CountUp: React.FC<CountUpProps> = ({ value }) => {
  const motionVal = useMotionValue(0);
  const [displayVal, setDisplayVal] = useState(value);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayVal(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value, motionVal]);

  return <span>{displayVal}</span>;
};

export const SummaryCounters: React.FC = () => {
  const intactCount = useVaultStore(selectIntactCount);
  const tamperedCount = useVaultStore(selectTamperedCount);
  const missingCount = useVaultStore(selectMissingCount);
  const statusFilter = useVaultStore((s) => s.statusFilter);
  const setStatusFilter = useVaultStore((s) => s.setStatusFilter);

  const handleToggle = (type: 'intact' | 'tampered' | 'missing') => {
    if (statusFilter === type) {
      setStatusFilter('all');
    } else {
      setStatusFilter(type);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 w-full">
      {/* Intact Card */}
      <button
        type="button"
        onClick={() => handleToggle('intact')}
        aria-pressed={statusFilter === 'intact'}
        className={`relative overflow-hidden rounded-xl border text-left p-5 shadow-[0_0_20px_rgba(16,185,129,0.06)] backdrop-blur-md transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
          statusFilter === 'intact'
            ? 'border-emerald-400 ring-2 ring-emerald-400/80 bg-gradient-to-br from-emerald-950/40 via-[#0d1527] to-[#070b14]'
            : 'border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-[#0d1527] to-[#070b14] hover:border-emerald-500/40'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/80">
                Verified Intact
              </span>
              {statusFilter === 'intact' && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                  FILTERED
                </span>
              )}
            </div>
            <div className="mt-1 font-heading text-3xl xl:text-4xl font-black text-emerald-400 tracking-tight">
              <CountUp value={intactCount} />
              <span className="text-sm font-mono text-emerald-500/50 font-normal ml-1">/ 12</span>
            </div>
            <p className="mt-1 text-xs text-vault-muted font-sans">
              Cryptographic hashes match root ledger
            </p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <ShieldCheck className="h-7 w-7" />
          </div>
        </div>
      </button>

      {/* Tampered Card */}
      <button
        type="button"
        onClick={() => handleToggle('tampered')}
        aria-pressed={statusFilter === 'tampered'}
        className={`relative overflow-hidden rounded-xl border text-left p-5 backdrop-blur-md transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d2e] ${
          statusFilter === 'tampered'
            ? 'border-[#ff3849] ring-2 ring-[#e11d2e] bg-gradient-to-br from-[#e11d2e]/30 via-[#0d1527] to-[#070b14] shadow-[0_0_30px_rgba(225,29,46,0.3)]'
            : tamperedCount > 0
              ? 'border-[#e11d2e]/50 bg-gradient-to-br from-[#e11d2e]/20 via-[#0d1527] to-[#070b14] shadow-[0_0_24px_rgba(225,29,46,0.2)] hover:border-[#e11d2e]'
              : 'border-[#e11d2e]/20 bg-gradient-to-br from-[#e11d2e]/10 via-[#0d1527] to-[#070b14] shadow-[0_0_15px_rgba(225,29,46,0.05)] hover:border-[#e11d2e]/40'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#e11d2e]/90">
                Tampered Detected
              </span>
              {statusFilter === 'tampered' && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#e11d2e]/30 text-[#ff4d5a] font-bold">
                  FILTERED
                </span>
              )}
            </div>
            <div className="mt-1 font-heading text-3xl xl:text-4xl font-black text-[#e11d2e] tracking-tight">
              <CountUp value={tamperedCount} />
              <span className="text-sm font-mono text-[#e11d2e]/50 font-normal ml-1">/ 12</span>
            </div>
            <p className="mt-1 text-xs text-vault-muted font-sans">
              {tamperedCount > 0 ? 'Hash mismatch in event window' : 'No anomalies detected'}
            </p>
          </div>
          <div className="rounded-xl bg-[#e11d2e]/10 p-3 text-[#e11d2e] border border-[#e11d2e]/30 shadow-[0_0_12px_rgba(225,29,46,0.2)]">
            <ShieldAlert className="h-7 w-7" />
          </div>
        </div>
      </button>

      {/* Missing Card */}
      <button
        type="button"
        onClick={() => handleToggle('missing')}
        aria-pressed={statusFilter === 'missing'}
        className={`relative overflow-hidden rounded-xl border text-left p-5 backdrop-blur-md transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
          statusFilter === 'missing'
            ? 'border-neutral-400 ring-2 ring-neutral-400 bg-gradient-to-br from-neutral-800/50 via-[#0d1527] to-[#070b14]'
            : 'border-neutral-700/40 bg-gradient-to-br from-neutral-900/30 via-[#0d1527] to-[#070b14] hover:border-neutral-600/50 shadow-[0_0_15px_rgba(255,255,255,0.02)]'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                Missing Records
              </span>
              {statusFilter === 'missing' && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-700 text-neutral-200 font-bold">
                  FILTERED
                </span>
              )}
            </div>
            <div className="mt-1 font-heading text-3xl xl:text-4xl font-black text-neutral-300 tracking-tight">
              <CountUp value={missingCount} />
              <span className="text-sm font-mono text-neutral-500 font-normal ml-1">/ 12</span>
            </div>
            <p className="mt-1 text-xs text-vault-muted font-sans">
              Omitted or deleted interval slots
            </p>
          </div>
          <div className="rounded-xl bg-neutral-800/40 p-3 text-neutral-400 border border-neutral-700/50">
            <HelpCircle className="h-7 w-7" />
          </div>
        </div>
      </button>
    </div>
  );
};
