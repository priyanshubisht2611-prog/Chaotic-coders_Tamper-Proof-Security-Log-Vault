import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useVaultStore } from '@/store/useVaultStore';
import { SummaryCounters } from './SummaryCounters';
import { TimeAxis } from './TimeAxis';
import { WindowGrid } from './WindowGrid';
import { TimelineSkeleton } from './TimelineSkeleton';
import { WindowDetailsPanel } from './WindowDetailsPanel';
import { ControlBar } from '@/features/verification/ControlBar';
import { ScanBeam } from '@/features/verification/ScanBeam';
import { EventFeed } from '@/features/verification/EventFeed';

export const Timeline: React.FC = () => {
  const windows = useVaultStore((s) => s.windows);
  const loading = useVaultStore((s) => s.loading);
  const error = useVaultStore((s) => s.error);
  const fetchWindows = useVaultStore((s) => s.fetchWindows);

  useEffect(() => {
    if (windows.length === 0 && !loading && !error) {
      fetchWindows();
    }
  }, [windows.length, loading, error, fetchWindows]);

  return (
    <section
      id="timeline"
      className="relative w-full max-w-[1600px] mx-auto px-6 lg:px-8 py-12"
      style={{
        backgroundImage: 'radial-gradient(rgba(47, 107, 255, 0.07) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* Phase 4: Sticky Dashboard Control Bar */}
      <ControlBar />

      {/* 12-Column Grid Layout */}
      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left 8 Columns: Timeline Area */}
        <div className="col-span-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Live Audit Stream
              </span>
            </div>
            <h2 className="font-heading font-black text-2xl xl:text-3xl uppercase tracking-wider text-white">
              Cryptographic Log Windows
            </h2>
            <p className="text-sm text-vault-muted font-sans max-w-2xl">
              Deterministic verification ledger: 12 independent 5-minute cryptographic intervals.
              Independent hashing guarantees tamper detection without sequential chain degradation.
            </p>
          </div>

          {/* Error State with Retry Button */}
          {error && (
            <div
              role="alert"
              className="p-5 rounded-xl border border-[#e11d2e]/40 bg-[#e11d2e]/10 backdrop-blur-md flex items-center justify-between space-x-4 shadow-[0_0_20px_rgba(225,29,46,0.15)]"
            >
              <div className="flex items-center space-x-3 text-[#e11d2e]">
                <AlertTriangle className="h-6 w-6 flex-shrink-0" />
                <div>
                  <h4 className="font-heading text-sm font-bold uppercase">
                    Ledger Synchronization Failure
                  </h4>
                  <p className="text-xs text-white/80 font-mono mt-0.5">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fetchWindows()}
                className="px-4 py-2 rounded-lg bg-[#e11d2e] hover:bg-[#ff2a3c] text-white text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center space-x-2 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && windows.length === 0 ? (
            <TimelineSkeleton />
          ) : (
            <>
              {/* Summary Counters: Row of 3 Wide Cards */}
              <SummaryCounters />

              {/* TimeAxis & WindowGrid Wrapped in Relative Container for ScanBeam Sweep */}
              <div className="relative space-y-6">
                <ScanBeam />
                <TimeAxis />
                <WindowGrid />
              </div>
            </>
          )}
        </div>

        {/* Right 4 Columns: Docked Details Panel + EventFeed */}
        <div className="col-span-4 sticky top-[72px] self-start space-y-5">
          <WindowDetailsPanel />
          <EventFeed />
        </div>
      </div>
    </section>
  );
};
