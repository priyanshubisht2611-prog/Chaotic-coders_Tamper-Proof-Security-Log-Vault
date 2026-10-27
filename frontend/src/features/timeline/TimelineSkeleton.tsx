import React from 'react';

export const TimelineSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 w-full animate-pulse" aria-label="Loading verification ledger">
      {/* Counters Skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-white/5 bg-white/5 p-5 flex justify-between items-start"
          >
            <div className="space-y-2 w-2/3">
              <div className="h-3 w-20 bg-white/10 rounded" />
              <div className="h-8 w-16 bg-white/10 rounded" />
              <div className="h-2.5 w-32 bg-white/5 rounded" />
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/10" />
          </div>
        ))}
      </div>

      {/* Axis Skeleton */}
      <div className="rounded-xl border border-white/5 bg-white/5 p-4 space-y-3">
        <div className="h-3 w-40 bg-white/10 rounded" />
        <div className="grid grid-cols-12 gap-1.5 h-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-3 rounded-full bg-white/10" />
          ))}
        </div>
        <div className="grid grid-cols-12 gap-1.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-2.5 bg-white/5 rounded mx-1" />
          ))}
        </div>
      </div>

      {/* 3x4 Window Grid Skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl border border-white/5 bg-white/5 p-4 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-24 bg-white/10 rounded" />
              <div className="h-5 w-16 bg-white/10 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-32 bg-white/5 rounded" />
              <div className="h-3 w-28 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
