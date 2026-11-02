import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { useVaultStore } from '@/store/useVaultStore';

export const ThreatScoringAlert: React.FC = () => {
  const windows = useVaultStore((s) => s.windows);
  const tamperedCount = windows.filter((w) => w.status === 'tampered').length;
  const missingCount = windows.filter((w) => w.status === 'missing').length;

  const isAnomalous = tamperedCount > 0 || missingCount > 0;
  const score = isAnomalous ? 88 : 12;
  const level = isAnomalous ? 'HIGH RISK' : 'LOW RISK';

  return (
    <div
      className={`w-full rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 relative overflow-hidden ${
        isAnomalous
          ? 'border-[#e11d2e]/50 bg-gradient-to-r from-[#e11d2e]/15 via-[#0d1527] to-[#070b14] shadow-[0_0_30px_rgba(225,29,46,0.2)]'
          : 'border-white/10 bg-[#0d1527]/70 shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
      }`}
    >
      {/* Top glowing laser line when breached */}
      {isAnomalous && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff3849] to-transparent animate-pulse" />
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Icon & Label */}
        <div className="flex items-center space-x-3.5">
          <div
            className={`p-3 rounded-xl border flex items-center justify-center transition-colors ${
              isAnomalous
                ? 'bg-[#e11d2e]/20 border-[#e11d2e]/50 text-[#ff4d5a] shadow-[0_0_15px_rgba(225,29,46,0.3)]'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {isAnomalous ? <ShieldAlert className="w-6 h-6 animate-pulse" /> : <ShieldCheck className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">
                Anomaly Detection Engine
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isAnomalous
                    ? 'bg-[#e11d2e]/25 text-[#ff4d5a] border border-[#e11d2e]/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {level}
              </span>
            </div>
            <h3 className="font-heading font-black text-lg text-white uppercase tracking-wider mt-0.5">
              Vault Threat Score
            </h3>
            <p className="text-xs text-white/70 font-sans mt-0.5">
              {isAnomalous
                ? `Critical anomaly detected: ${tamperedCount} tampered window(s), ${missingCount} missing payload(s).`
                : 'All cryptographic log intervals and behavioral streams are healthy.'}
            </p>
          </div>
        </div>

        {/* Right: Big Single Numeric Score & Gauge */}
        <div className="flex items-center md:justify-end space-x-5 min-w-[220px]">
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between items-baseline text-xs font-mono">
              <span className="text-white/50 text-[10px] uppercase">Risk Metric</span>
              <span className={`font-bold ${isAnomalous ? 'text-[#ff4d5a]' : 'text-emerald-400'}`}>
                {score} <span className="text-white/40 font-normal">/ 100</span>
              </span>
            </div>

            {/* Single clean progress bar */}
            <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isAnomalous
                    ? 'bg-gradient-to-r from-amber-500 via-red-500 to-[#ff3849]'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {/* Big Number Pill */}
          <div
            className={`px-4 py-2 rounded-xl font-heading font-black text-2xl xl:text-3xl border flex items-center justify-center min-w-[70px] ${
              isAnomalous
                ? 'bg-[#e11d2e]/20 border-[#e11d2e]/50 text-[#ff4d5a] shadow-[0_0_20px_rgba(225,29,46,0.25)]'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {score}
          </div>
        </div>
      </div>
    </div>
  );
};
