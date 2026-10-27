import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trash2, X, ShieldAlert } from 'lucide-react';
import { useVaultStore } from '@/store/useVaultStore';
import { Button } from '@/shared/ui/Button';

export const SimulationConfirmModal: React.FC = () => {
  const pendingAction = useVaultStore((s) => s.pendingSimulationAction);
  const setPendingAction = useVaultStore((s) => s.setPendingSimulationAction);
  const setSkipSimulationConfirm = useVaultStore((s) => s.setSkipSimulationConfirm);
  const triggerModification = useVaultStore((s) => s.triggerModification);
  const simulateDeletion = useVaultStore((s) => s.simulateDeletion);

  const [dontAskAgain, setDontAskAgain] = useState(false);

  if (!pendingAction) return null;

  const handleCancel = () => {
    setPendingAction(null);
  };

  const handleConfirm = async () => {
    if (dontAskAgain) {
      setSkipSimulationConfirm(true);
    }
    const action = pendingAction;
    setPendingAction(null);

    if (action === 'tamper') {
      await triggerModification('tamper');
    } else if (action === 'delete') {
      await simulateDeletion();
    }
  };

  const isTamper = pendingAction === 'tamper';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="relative w-full max-w-lg p-6 rounded-2xl bg-[#0d1527] border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.8)] text-white overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute -top-20 -right-20 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-20 ${
              isTamper ? 'bg-[#e11d2e]' : 'bg-amber-500'
            }`}
          />

          {/* Close button */}
          <button
            type="button"
            onClick={handleCancel}
            className="absolute top-4 right-4 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start space-x-3 mb-4">
            <div
              className={`p-3 rounded-xl border flex-shrink-0 ${
                isTamper
                  ? 'border-[#e11d2e]/40 bg-[#e11d2e]/10 text-[#ff4d5a]'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
              }`}
            >
              {isTamper ? <Zap className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-vault-muted bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  Operational Safeguard
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Simulation Vector
                </span>
              </div>
              <h3 id="confirm-modal-title" className="font-heading font-black text-xl uppercase tracking-wider text-white mt-1">
                {isTamper ? 'Confirm Attack Simulation' : 'Confirm Deletion Simulation'}
              </h3>
            </div>
          </div>

          {/* Body Content */}
          <div className="space-y-3 font-sans text-sm text-vault-muted leading-relaxed">
            <p>
              {isTamper ? (
                <>
                  This action will inject a <strong className="text-white">cryptographic hash mutation</strong> into{' '}
                  <span className="font-mono text-[#ff4d5a]">Interval #07</span> to test deterministic integrity verification, red alerts, and audit trail generation.
                </>
              ) : (
                <>
                  This action will simulate an <strong className="text-white">omitted interval record</strong> by removing an intact log window to test gap and omission detection.
                </>
              )}
            </p>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs font-mono space-y-1">
              <div className="flex items-center space-x-2 text-white/70">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Scope: Sandbox Fault Injection (Demonstration Mode)</span>
              </div>
              <p className="text-[11px] text-white/50 pl-5">
                Original immutable ledger snapshots remain preserved and can be restored anytime via Reset Demo [R].
              </p>
            </div>
          </div>

          {/* Do not ask again checkbox */}
          <div className="mt-5 pt-3 border-t border-white/10 flex items-center space-x-2">
            <input
              type="checkbox"
              id="dont-ask-again"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="w-4 h-4 rounded bg-white/10 border-white/20 text-[#2f6bff] focus:ring-[#2f6bff] focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="dont-ask-again" className="text-xs text-white/70 font-sans cursor-pointer select-none">
              Do not prompt for confirmation again this session
            </label>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={handleCancel}
              className="py-2 px-4 text-xs font-mono uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              variant={isTamper ? 'danger' : 'primary'}
              onClick={handleConfirm}
              className={`py-2 px-5 text-xs font-mono uppercase tracking-wider font-bold ${
                !isTamper ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400/40' : ''
              }`}
            >
              {isTamper ? 'Inject Mutation' : 'Simulate Deletion'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
