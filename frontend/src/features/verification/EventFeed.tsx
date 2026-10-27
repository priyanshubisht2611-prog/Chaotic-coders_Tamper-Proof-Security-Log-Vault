import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Search, X, ArrowUpRight, Trash2 } from 'lucide-react';
import { useVaultStore, VaultEvent } from '@/store/useVaultStore';

export const EventFeed: React.FC = () => {
  const events = useVaultStore((s) => s.events);
  const setSelectedId = useVaultStore((s) => s.setSelectedId);
  const clearEvents = useVaultStore((s) => s.clearEvents);

  const [filterLevel, setFilterLevel] = useState<'all' | 'alerts' | 'warnings' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getEventTextColor = (type: VaultEvent['type']) => {
    switch (type) {
      case 'error':
        return 'text-[#ff4d5a] font-semibold';
      case 'warning':
        return 'text-amber-400 font-medium';
      case 'success':
        return 'text-emerald-400 font-medium';
      case 'info':
      default:
        return 'text-white/80';
    }
  };

  const extractWindowId = (message: string): number | null => {
    const match = message.match(/Window\s*#?(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  };

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Level filter
      if (filterLevel === 'alerts' && ev.type !== 'error') return false;
      if (filterLevel === 'warnings' && ev.type !== 'warning') return false;
      if (filterLevel === 'info' && ev.type !== 'info' && ev.type !== 'success') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMsg = ev.message.toLowerCase().includes(q);
        const matchesTime = ev.timestamp.toLowerCase().includes(q);
        const matchesType = ev.type.toLowerCase().includes(q);
        return matchesMsg || matchesTime || matchesType;
      }
      return true;
    });
  }, [events, filterLevel, searchQuery]);

  const handleEventClick = (message: string) => {
    const winId = extractWindowId(message);
    if (winId !== null) {
      setSelectedId(winId);
      const card = document.getElementById(`window-card-${winId}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const alertCount = events.filter((e) => e.type === 'error').length;
  const warningCount = events.filter((e) => e.type === 'warning').length;
  const infoCount = events.filter((e) => e.type === 'info' || e.type === 'success').length;

  return (
    <aside
      aria-label="Cryptographic Audit Event Feed"
      className="w-full rounded-2xl border border-white/10 bg-[#070b14]/90 backdrop-blur-xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)] font-mono text-xs flex flex-col"
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-[#2f6bff]" />
          <span className="font-heading font-bold text-xs uppercase tracking-wider text-white">
            Audit Event Feed
          </span>
          <span className="text-[10px] text-vault-muted bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
            {filteredEvents.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {events.length > 0 && (
            <button
              type="button"
              onClick={clearEvents}
              title="Clear event feed"
              className="text-white/40 hover:text-white/80 transition-colors p-1 rounded"
              aria-label="Clear event feed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Terminal Mac-style Window Controls */}
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2 mb-3">
        {/* Search input */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, timestamps, windows..."
            className="w-full pl-8 pr-7 py-1 text-[11px] rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#2f6bff]/60 focus:bg-white/[0.08] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-white/40 hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Level filter tabs */}
        <div className="flex items-center gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => setFilterLevel('all')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterLevel === 'all'
                ? 'bg-[#2f6bff]/20 text-[#2f6bff] border border-[#2f6bff]/40 font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            All ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterLevel('alerts')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterLevel === 'alerts'
                ? 'bg-[#e11d2e]/20 text-[#ff4d5a] border border-[#e11d2e]/40 font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Alerts ({alertCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterLevel('warnings')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterLevel === 'warnings'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Warnings ({warningCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterLevel('info')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterLevel === 'info'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Info ({infoCount})
          </button>
        </div>
      </div>

      {/* Terminal Log Stream: Newest on top, max 8 visible with smooth scroll */}
      <div
        className="space-y-1.5 overflow-y-auto max-h-[196px] pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent select-text"
        tabIndex={0}
        role="log"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {filteredEvents.map((ev) => {
            const winId = extractWindowId(ev.message);
            const isClickable = winId !== null;

            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={() => handleEventClick(ev.message)}
                title={isClickable ? `Click to inspect Window #${winId.toString().padStart(2, '0')}` : undefined}
                className={`flex items-start space-x-2 leading-relaxed text-[11px] p-1 rounded transition-colors ${
                  isClickable
                    ? 'cursor-pointer hover:bg-white/10 group'
                    : ''
                }`}
              >
                <span className="text-white/40 flex-shrink-0 select-none">
                  [{ev.timestamp}]
                </span>
                <span className={`break-words flex-1 ${getEventTextColor(ev.type)}`}>
                  {ev.message}
                </span>
                {isClickable && (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#2f6bff] flex items-center space-x-0.5 flex-shrink-0 text-[10px]">
                    <span>W#{winId}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredEvents.length === 0 && (
          <div className="text-white/40 italic py-4 text-center">
            {events.length === 0 ? 'No events recorded yet.' : 'No events match current filter.'}
          </div>
        )}
      </div>
    </aside>
  );
};
