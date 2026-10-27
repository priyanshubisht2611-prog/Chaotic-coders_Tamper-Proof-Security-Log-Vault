import React, { useMemo } from 'react';
import { useVaultStore } from '@/store/useVaultStore';
import { LogWindow, WindowStatus } from '@/types/log';

export const formatTickTime = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return isoString.substring(11, 16);
    }
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return isoString.substring(11, 16);
  }
};

const getSegmentColor = (status: WindowStatus, isHovered: boolean): string => {
  switch (status) {
    case 'intact':
      return isHovered
        ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]'
        : 'bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.4)]';
    case 'tampered':
      return isHovered
        ? 'bg-[#ff2d3f] shadow-[0_0_14px_rgba(255,45,63,1)] animate-pulse'
        : 'bg-[#e11d2e] shadow-[0_0_8px_rgba(225,29,46,0.7)] animate-pulse';
    case 'missing':
      return isHovered
        ? 'bg-neutral-500 border border-neutral-300'
        : 'bg-neutral-700 border border-neutral-600/50';
  }
};

export const TimeAxis: React.FC = () => {
  const windows = useVaultStore((s) => s.windows);
  const hoveredId = useVaultStore((s) => s.hoveredId);
  const setHoveredId = useVaultStore((s) => s.setHoveredId);
  const selectedId = useVaultStore((s) => s.selectedId);
  const setSelectedId = useVaultStore((s) => s.setSelectedId);
  const isScanning = useVaultStore((s) => s.isScanning);
  const scanningIndex = useVaultStore((s) => s.scanningIndex);

  const statusFilter = useVaultStore((s) => s.statusFilter);
  const setStatusFilter = useVaultStore((s) => s.setStatusFilter);

  const sortedWindows = useMemo(() => {
    return [...windows].sort((a, b) => a.id - b.id || a.start.localeCompare(b.start));
  }, [windows]);

  if (sortedWindows.length === 0) return null;

  const handleSegmentClick = (w: LogWindow) => {
    if (statusFilter !== 'all' && w.status !== statusFilter) {
      setStatusFilter('all');
    }
    setSelectedId(w.id);
  };

  return (
    <div className="w-full rounded-xl border border-white/10 bg-[#0d1527]/60 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <span className="font-heading text-xs font-semibold uppercase tracking-wider text-white/90">
          Temporal Verification Axis (UTC)
        </span>
        <span className="text-[11px] font-mono text-vault-muted">
          12 × 5-Min Intervals
        </span>
      </div>

      {/* Axis Strip */}
      <div className="grid grid-cols-12 gap-1.5 w-full items-center">
        {sortedWindows.map((w: LogWindow) => {
          const isHovered = hoveredId === w.id;
          const isSelected = selectedId === w.id;
          const isFlashing = isScanning && scanningIndex === w.id;
          const matchesFilter = statusFilter === 'all' || w.status === statusFilter;

          return (
            <button
              key={w.id}
              type="button"
              onClick={() => handleSegmentClick(w)}
              onMouseEnter={() => setHoveredId(w.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(w.id)}
              onBlur={() => setHoveredId(null)}
              aria-label={`Time segment for window ${w.id}, ${w.status}`}
              className={`group relative h-3 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                !matchesFilter ? 'opacity-25 hover:opacity-80' : 'opacity-100'
              } ${
                isFlashing
                  ? 'scale-y-150 bg-emerald-300 ring-2 ring-emerald-400 shadow-[0_0_15px_#10b981] z-20'
                  : isHovered
                    ? 'scale-y-150 ring-2 ring-white z-10'
                    : isSelected
                      ? 'ring-1 ring-[#2f6bff]'
                      : ''
              } ${isFlashing ? 'bg-emerald-300' : getSegmentColor(w.status, isHovered)}`}
            />
          );
        })}
      </div>

      {/* Ticks underneath */}
      <div className="grid grid-cols-12 gap-1.5 w-full mt-2">
        {sortedWindows.map((w: LogWindow) => {
          const isHovered = hoveredId === w.id;
          return (
            <div
              key={w.id}
              className={`text-center font-mono text-[10px] xl:text-[11px] transition-colors duration-150 truncate ${
                isHovered ? 'text-white font-bold' : 'text-vault-muted'
              }`}
            >
              {formatTickTime(w.start)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
