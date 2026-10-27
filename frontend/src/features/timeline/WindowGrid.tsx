import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Search, Layers } from 'lucide-react';
import { useVaultStore, selectFilteredWindows, selectIntactCount, selectTamperedCount, selectMissingCount } from '@/store/useVaultStore';
import { LogWindow } from '@/types/log';
import { WindowCard } from './WindowCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

export const WindowGrid: React.FC = () => {
  const windows = useVaultStore((s) => s.windows);
  const hoveredId = useVaultStore((s) => s.hoveredId);
  const setHoveredId = useVaultStore((s) => s.setHoveredId);
  const selectedId = useVaultStore((s) => s.selectedId);
  const setSelectedId = useVaultStore((s) => s.setSelectedId);

  const statusFilter = useVaultStore((s) => s.statusFilter);
  const setStatusFilter = useVaultStore((s) => s.setStatusFilter);
  const windowSearchQuery = useVaultStore((s) => s.windowSearchQuery);
  const setWindowSearchQuery = useVaultStore((s) => s.setWindowSearchQuery);

  const intactCount = useVaultStore(selectIntactCount);
  const tamperedCount = useVaultStore(selectTamperedCount);
  const missingCount = useVaultStore(selectMissingCount);

  const filteredWindows = useVaultStore(selectFilteredWindows);

  const isFiltered = statusFilter !== 'all' || windowSearchQuery.trim() !== '';

  const handleClearFilters = () => {
    setStatusFilter('all');
    setWindowSearchQuery('');
  };

  return (
    <div className="space-y-4 w-full">
      {/* Filter and Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <div className="flex items-center space-x-1 text-vault-muted mr-1">
            <Filter className="w-3.5 h-3.5 text-[#2f6bff]" />
            <span className="text-[11px] uppercase tracking-wider text-white/50">Filter:</span>
          </div>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#2f6bff]/20 text-white border border-[#2f6bff]/50 font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            All ({windows.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('intact')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === 'intact'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                : 'text-white/60 hover:text-emerald-400 hover:bg-emerald-500/5 border border-transparent'
            }`}
          >
            Intact ({intactCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('tampered')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === 'tampered'
                ? 'bg-[#e11d2e]/20 text-[#ff4d5a] border border-[#e11d2e]/50 font-bold'
                : 'text-white/60 hover:text-[#ff4d5a] hover:bg-[#e11d2e]/5 border border-transparent'
            }`}
          >
            Tampered ({tamperedCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('missing')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === 'missing'
                ? 'bg-neutral-800 text-neutral-200 border border-neutral-600 font-bold'
                : 'text-white/60 hover:text-neutral-300 hover:bg-white/5 border border-transparent'
            }`}
          >
            Missing ({missingCount})
          </button>
        </div>

        {/* Search Input & Reset Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={windowSearchQuery}
              onChange={(e) => setWindowSearchQuery(e.target.value)}
              placeholder="Search ID, hash..."
              className="pl-8 pr-7 py-1 text-xs font-mono rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#2f6bff]/50 w-44 transition-colors"
            />
            {windowSearchQuery && (
              <button
                type="button"
                onClick={() => setWindowSearchQuery('')}
                className="absolute right-2 text-white/40 hover:text-white"
                aria-label="Clear window search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-mono border border-white/10 transition-colors flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Content */}
      <AnimatePresence mode="wait">
        {filteredWindows.length === 0 ? (
          <motion.div
            key="empty-filter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-10 rounded-2xl border border-white/10 bg-[#0d1527]/40 text-center flex flex-col items-center justify-center space-y-3"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-vault-muted">
              <Layers className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-sm font-heading uppercase text-white tracking-wider">
              No matching log windows
            </p>
            <p className="text-xs font-mono text-vault-muted max-w-sm">
              No intervals match your active filter criteria ({statusFilter !== 'all' ? `status: ${statusFilter}` : ''} {windowSearchQuery ? `query: "${windowSearchQuery}"` : ''}).
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-1.5 rounded-lg bg-[#2f6bff]/20 hover:bg-[#2f6bff]/30 text-[#2f6bff] text-xs font-mono font-semibold border border-[#2f6bff]/40 transition-colors"
            >
              Clear Filters
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="grid-list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-3 gap-4 w-full"
          >
            {filteredWindows.map((w: LogWindow) => (
              <motion.div key={w.id} variants={itemVariants} className="w-full">
                <WindowCard
                  window={w}
                  isHovered={hoveredId === w.id}
                  isSelected={selectedId === w.id}
                  onHover={setHoveredId}
                  onSelect={setSelectedId}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
