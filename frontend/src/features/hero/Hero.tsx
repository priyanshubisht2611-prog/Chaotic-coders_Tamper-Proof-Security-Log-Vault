import React, { useEffect, useState, useMemo } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { BackgroundVideo } from '@/shared/ui/BackgroundVideo';
import { Button } from '@/shared/ui/Button';
import { HERO_VIDEO_CONFIG } from '@/shared/config/videoConfig';

export interface HeroProps {
  onSimulateAttack: () => void;
  onSimulateDeletion?: () => void;
  onHeroPlaying?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onSimulateAttack,
  onSimulateDeletion,
  onHeroPlaying,
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  // Mouse Parallax (max 12px movement)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const parallaxX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const parallaxY = useSpring(mouseY, { stiffness: 120, damping: 20 });

  // Floating web lines inverse parallax
  const webParallaxX = useSpring(useMotionValue(0), { stiffness: 90, damping: 25 });
  const webParallaxY = useSpring(useMotionValue(0), { stiffness: 90, damping: 25 });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    const handleMouseMove = (e: MouseEvent) => {
      if (mediaQuery.matches) return;
      const { innerWidth, innerHeight } = window;
      // Normalize from -1 to 1, max 12px
      const normX = ((e.clientX / innerWidth) - 0.5) * 24;
      const normY = ((e.clientY / innerHeight) - 0.5) * 24;

      const clampedX = Math.max(-12, Math.min(12, normX));
      const clampedY = Math.max(-12, Math.min(12, normY));

      mouseX.set(clampedX);
      mouseY.set(clampedY);
      webParallaxX.set(-clampedX * 0.8);
      webParallaxY.set(-clampedY * 0.8);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      mediaQuery.removeEventListener('change', handler);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY, webParallaxX, webParallaxY]);

  const handleScrollToTimeline = () => {
    const el = document.getElementById('timeline');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Letter-by-letter split for title
  const titleLine1 = useMemo(() => 'TAMPER-PROOF'.split(''), []);
  const titleLine2 = useMemo(() => 'SECURITY LOG VAULT'.split(''), []);

  return (
    <section className="relative w-full bg-[#070b14] overflow-hidden flex flex-col justify-between">
      {/* Hero Video Wrapper with exact framing (1920x800 aspect ratio) */}
      <div
        id="hero-video-box"
        className="relative w-full"
        style={{
          width: '100%',
          maxWidth: '1920px',
          margin: '0 auto',
          aspectRatio: '1920 / 800',
        }}
      >
        <BackgroundVideo
          src={HERO_VIDEO_CONFIG.src}
          poster={HERO_VIDEO_CONFIG.poster}
          fit="cover"
          loop
          onPlaying={onHeroPlaying}
          className="absolute inset-0 z-0"
        />

        {/* Text overlay uses simple linear-gradient (no blur) for readability */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(7, 11, 20, 0.45) 0%, rgba(7, 11, 20, 0.25) 45%, rgba(7, 11, 20, 0.95) 100%)',
          }}
        />

        {/* Floating SVG Web Lines in Top-Left Corner (Slow Drift + Parallax) */}
        <motion.div
          aria-hidden="true"
          style={{
            x: webParallaxX,
            y: webParallaxY,
            willChange: 'transform',
          }}
          className="absolute top-0 left-0 w-72 h-72 z-10 pointer-events-none opacity-40 select-none"
        >
          <motion.svg
            viewBox="0 0 200 200"
            fill="none"
            animate={
              reducedMotion
                ? {}
                : {
                    x: [0, 8, -4, 0],
                    y: [0, -6, 8, 0],
                  }
            }
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-full h-full"
          >
            <path
              d="M0 0 L180 180 M0 0 L195 90 M0 0 L90 195 M0 0 L200 30 M0 0 L30 200"
              stroke="#2f6bff"
              strokeWidth="0.8"
              opacity="0.6"
            />
            <path
              d="M40 0 C40 30 30 40 0 40 M80 0 C80 60 60 80 0 80 M120 0 C120 90 90 120 0 120 M160 0 C160 120 120 160 0 160"
              stroke="#2f6bff"
              strokeWidth="0.7"
              opacity="0.4"
            />
          </motion.svg>
        </motion.div>

        {/* Floating SVG Web Lines in Bottom-Right Corner (Slow Drift + Parallax) */}
        <motion.div
          aria-hidden="true"
          style={{
            x: webParallaxX,
            y: webParallaxY,
            willChange: 'transform',
          }}
          className="absolute bottom-0 right-0 w-72 h-72 z-10 pointer-events-none opacity-30 select-none"
        >
          <motion.svg
            viewBox="0 0 200 200"
            fill="none"
            animate={
              reducedMotion
                ? {}
                : {
                    x: [0, -7, 6, 0],
                    y: [0, 8, -6, 0],
                  }
            }
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-full h-full"
          >
            <path
              d="M200 200 L20 20 M200 200 L5 110 M200 200 L110 5 M200 200 L0 170 M200 200 L170 0"
              stroke="#e11d2e"
              strokeWidth="0.8"
              opacity="0.5"
            />
            <path
              d="M160 200 C160 170 170 160 200 160 M120 200 C120 140 140 120 200 120 M80 200 C80 110 110 80 200 80"
              stroke="#e11d2e"
              strokeWidth="0.7"
              opacity="0.35"
            />
          </motion.svg>
        </motion.div>

        {/* Hero Overlay Content */}
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-6">
          {/* Top Bar without blur */}
          <header className="w-full max-w-7xl mx-auto flex items-center justify-between bg-[#070b14]/90 border-b border-white/10 rounded-b-xl px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-[#2f6bff] shadow-[0_0_10px_#2f6bff]" />
              <span className="font-heading font-black text-lg tracking-wider text-white">
                LOG<span className="text-[#2f6bff]">VAULT</span>
              </span>
            </div>

            {/* Spider-Sense Status Badge */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#070b14] border border-white/10">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e11d2e] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e11d2e]" />
              </span>
              <span className="font-heading text-xs uppercase tracking-wider text-white/90">
                Spider-Sense: Active
              </span>
            </div>
          </header>

          {/* Center Content with Subtle Mouse Parallax */}
          <motion.main
            style={{
              x: parallaxX,
              y: parallaxY,
              willChange: 'transform',
            }}
            className="max-w-4xl mx-auto text-center flex flex-col items-center my-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-block px-4 py-1 mb-3 rounded-full bg-[#2f6bff]/20 border border-[#2f6bff]/40 text-[#2f6bff] font-heading text-xs tracking-widest uppercase"
            >
              Zero-Trust Auditing Infrastructure
            </motion.div>

            {/* Letter-by-Letter Title Reveal (Phase 5) */}
            <h1
              className="font-heading font-black text-3xl sm:text-5xl md:text-6xl tracking-tight text-white uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] select-none"
              aria-label="Tamper-Proof Security Log Vault"
            >
              <span className="block mb-1">
                {titleLine1.map((char, i) => (
                  <motion.span
                    key={`line1-${i}`}
                    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: reducedMotion ? 0 : 0.05 + i * 0.025,
                      ease: 'easeOut',
                    }}
                    className="inline-block"
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </span>

              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#2f6bff] to-[#e11d2e] block">
                {titleLine2.map((char, i) => (
                  <motion.span
                    key={`line2-${i}`}
                    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: reducedMotion ? 0.1 : 0.35 + i * 0.025,
                      ease: 'easeOut',
                    }}
                    className="inline-block"
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-4 text-base sm:text-lg text-vault-muted max-w-2xl font-normal leading-relaxed"
            >
              Deterministic cryptographic verification for time-bucketed event streams. Independent
              hashes per window guarantee instant anomaly detection without chaining dependencies.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-6 flex flex-wrap gap-3 justify-center items-center"
            >
              <Button
                variant="primary"
                onClick={handleScrollToTimeline}
                className="hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Open Dashboard
              </Button>
              <Button
                variant="danger"
                onClick={onSimulateAttack}
                className="hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Simulate Attack
              </Button>
              {onSimulateDeletion && (
                <Button
                  variant="secondary"
                  onClick={onSimulateDeletion}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-600 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  Simulate Deletion
                </Button>
              )}
            </motion.div>
          </motion.main>

          <div className="h-4" />
        </div>
      </div>
    </section>
  );
};
