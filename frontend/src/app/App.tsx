import React, { useCallback } from 'react';
import { Monitor } from 'lucide-react';
import { Hero } from '@/features/hero/Hero';
import { Timeline } from '@/features/timeline/Timeline';
import { AttackOverlay } from '@/features/attack/AttackOverlay';
import { SimulationConfirmModal } from '@/features/verification/SimulationConfirmModal';
import { Toast } from '@/shared/ui/Toast';
import { CursorFollower } from '@/shared/ui/CursorFollower';
import { useVaultStore } from '@/store/useVaultStore';

export const App: React.FC = () => {
  const isAttackOverlayOpen = useVaultStore((s) => s.isAttackOverlayOpen);
  const setIsAttackOverlayOpen = useVaultStore((s) => s.setIsAttackOverlayOpen);
  const heroVideoPlaying = useVaultStore((s) => s.heroVideoPlaying);
  const setHeroVideoPlaying = useVaultStore((s) => s.setHeroVideoPlaying);
  const triggerModification = useVaultStore((s) => s.triggerModification);
  const skipSimulationConfirm = useVaultStore((s) => s.skipSimulationConfirm);
  const setPendingSimulationAction = useVaultStore((s) => s.setPendingSimulationAction);
  const glitchActive = useVaultStore((s) => s.glitchActive);
  const toastMessage = useVaultStore((s) => s.toastMessage);
  const setToastMessage = useVaultStore((s) => s.setToastMessage);

  const handleSimulateAttack = useCallback(() => {
    if (skipSimulationConfirm) {
      triggerModification('tamper');
    } else {
      setPendingSimulationAction('tamper');
    }
  }, [skipSimulationConfirm, triggerModification, setPendingSimulationAction]);

  const handleSimulateDeletion = useCallback(() => {
    if (skipSimulationConfirm) {
      triggerModification('delete');
    } else {
      setPendingSimulationAction('delete');
    }
  }, [skipSimulationConfirm, triggerModification, setPendingSimulationAction]);

  const handleCloseAttack = useCallback(() => {
    setIsAttackOverlayOpen(false);
  }, [setIsAttackOverlayOpen]);

  const handleHeroPlaying = useCallback(() => {
    setHeroVideoPlaying(true);
  }, [setHeroVideoPlaying]);

  return (
    <>
      {/* Custom Glowing Cursor Follower (Phase 5) */}
      <CursorFollower />

      {/* Operational Safeguard Confirmation Modal for Destructive Testing */}
      <SimulationConfirmModal />

      {/* 0.4s Red Glitch overlay on non-cinematic modifications */}
      {glitchActive && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[9998] pointer-events-none bg-[#e11d2e]/30 border-4 border-[#e11d2e] animate-pulse"
        />
      )}

      {/* Global Toast for modifications and resets */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
        type="error"
        duration={5000}
      />

      {/* Below 1024px: Render only a centered notice */}
      <div className="flex lg:hidden fixed inset-0 z-[9999] bg-[#070b14] items-center justify-center p-8 text-center">
        <div className="max-w-md p-8 rounded-2xl bg-[#0d1527] border border-white/10 shadow-2xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#2f6bff]/20 border border-[#2f6bff]/40 flex items-center justify-center text-[#2f6bff]">
            <Monitor className="w-7 h-7" />
          </div>
          <h2 className="font-heading font-black text-xl text-white tracking-wide uppercase">
            Best viewed on a desktop screen
          </h2>
          <p className="mt-3 text-sm text-vault-muted font-sans leading-relaxed">
            This cryptographic ledger dashboard is designed for desktop monitors (1280px – 2560px).
            Please expand your browser or access on a desktop screen.
          </p>
        </div>
      </div>

      {/* Desktop App (>= 1024px) */}
      <div className="hidden lg:flex min-h-screen bg-[#070b14] text-white flex-col font-sans selection:bg-[#2f6bff] selection:text-white">
        {/* Attack Overlay - Mounted once, fixed above everything */}
        <AttackOverlay
          isOpen={isAttackOverlayOpen}
          onClose={handleCloseAttack}
          canPreloadVillain={heroVideoPlaying}
        />

        {/* Hero Section */}
        <Hero
          onSimulateAttack={handleSimulateAttack}
          onSimulateDeletion={handleSimulateDeletion}
          onHeroPlaying={handleHeroPlaying}
        />

        {/* Timeline Section */}
        <Timeline />

        {/* Footer */}
        <footer className="w-full py-8 border-t border-white/5 text-center text-xs text-vault-muted font-mono">
          TAMPER-PROOF SECURITY LOG VAULT // INDEPENDENT HASH VERIFICATION
        </footer>
      </div>
    </>
  );
};
