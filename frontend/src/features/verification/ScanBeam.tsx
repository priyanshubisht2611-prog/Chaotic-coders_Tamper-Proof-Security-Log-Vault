import React from 'react';
import { motion } from 'framer-motion';
import { useVaultStore } from '@/store/useVaultStore';

export const ScanBeam: React.FC = () => {
  const isScanning = useVaultStore((s) => s.isScanning);
  const scanningIndex = useVaultStore((s) => s.scanningIndex);

  if (!isScanning) return null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-2xl">
      {/* Background Subtle Scanner Tint */}
      <div className="absolute inset-0 bg-emerald-500/5 transition-opacity duration-300" />

      {/* Sweeping Laser Beam (Transform-only left to right over ~2s) */}
      <motion.div
        initial={{ transform: 'translateX(-5%)' }}
        animate={{ transform: 'translateX(105%)' }}
        transition={{ duration: 2.04, ease: 'linear' }}
        className="absolute top-0 bottom-0 w-1.5 left-0"
        style={{ willChange: 'transform' }}
      >
        {/* Glow Line */}
        <div className="w-full h-full bg-gradient-to-b from-transparent via-emerald-400 to-transparent shadow-[0_0_30px_#10b981,0_0_60px_#34d399]" />

        {/* Floating Scanner Badge */}
        <div className="absolute top-4 left-3 whitespace-nowrap px-2.5 py-1 rounded-md bg-[#070b14]/95 border border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.4)] text-emerald-400 font-mono text-[11px] font-bold tracking-wider">
          Scanning window {scanningIndex ?? 1}/12
        </div>
      </motion.div>
    </div>
  );
};
