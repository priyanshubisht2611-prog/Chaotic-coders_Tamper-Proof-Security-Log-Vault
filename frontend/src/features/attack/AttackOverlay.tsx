import React, { useEffect, useState, useReducer, useRef, useCallback } from 'react';
import { attackReducer, INITIAL_ATTACK_STATE } from './attackMachine';
import { BackgroundVideo } from '@/shared/ui/BackgroundVideo';
import { Button } from '@/shared/ui/Button';
import { VILLAIN_VIDEO_CONFIG } from '@/shared/config/videoConfig';
import { useVaultStore } from '@/store/useVaultStore';
import { AttackToast } from './AttackToast';

export interface AttackOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  canPreloadVillain?: boolean;
}

const CAPTION_TEXT = 'Intruder detected: log modification in progress...';

export const AttackOverlay: React.FC<AttackOverlayProps> = ({
  isOpen,
  onClose,
  canPreloadVillain = false,
}) => {
  const [state, dispatch] = useReducer(attackReducer, INITIAL_ATTACK_STATE);
  const [caption, setCaption] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const tamperWindow = useVaultStore((s) => s.tamperWindow);
  const deleteWindow = useVaultStore((s) => s.deleteWindow);
  const windows = useVaultStore((s) => s.windows);
  const attackKind = useVaultStore((s) => s.attackKind);
  const heroVideoPlaying = useVaultStore((s) => s.heroVideoPlaying);
  const setIsModifying = useVaultStore((s) => s.setIsModifying);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEndingRef = useRef(false);

  useEffect(() => {
    if (isOpen && state === 'idle') {
      isEndingRef.current = false;
      dispatch({ type: 'TRIGGER_ATTACK' });
    }
  }, [isOpen, state]);

  // Always restore body scroll when not active
  useEffect(() => {
    if (state !== 'idle') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [state]);

  const handleFightEnd = useCallback(async () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    dispatch({ type: 'END_ATTACK' });

    // Apply modification based on attackKind
    if (attackKind === 'delete') {
      await deleteWindow(7);
    } else {
      await tamperWindow(7);
    }

    useVaultStore.getState().setSelectedId(7);

    const win7 = windows.find((w) => w.id === 7);
    const time = win7?.anchoredAt
      ? new Date(win7.anchoredAt).toLocaleTimeString()
      : new Date().toLocaleTimeString();

    const msg =
      attackKind === 'delete'
        ? 'Window deleted. Record marked as missing.'
        : `Window tampered. Original hash recorded at ${time}.`;

    setToastMessage(msg);
    onClose();

    setTimeout(() => {
      dispatch({ type: 'FINISH' });
      setIsModifying(false);
      const card7 = document.getElementById('window-card-7');
      if (card7) {
        card7.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 400);
  }, [attackKind, deleteWindow, tamperWindow, windows, onClose, setIsModifying]);

  useEffect(() => {
    if (state === 'warning') {
      const timer = setTimeout(() => dispatch({ type: 'START_FIGHT' }), 600);
      return () => clearTimeout(timer);
    }

    if (state === 'fighting') {
      // Safety rule: 15s timeout
      timeoutRef.current = setTimeout(handleFightEnd, 15000);

      let idx = 0;
      setCaption('');
      const interval = setInterval(() => {
        idx++;
        setCaption(CAPTION_TEXT.slice(0, idx));
        if (idx >= CAPTION_TEXT.length) clearInterval(interval);
      }, 45);

      return () => {
        clearInterval(interval);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [state, handleFightEnd]);

  // Do not set villain video src until hero video has started playing
  const canSetVillainSrc = canPreloadVillain || heroVideoPlaying;

  useEffect(() => {
    if (canSetVillainSrc && state === 'idle' && typeof document !== 'undefined') {
      const existing = document.querySelector(`link[href="${VILLAIN_VIDEO_CONFIG.src}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = VILLAIN_VIDEO_CONFIG.src;
        document.head.appendChild(link);
      }
    }
  }, [canSetVillainSrc, state]);

  return (
    <>
      <AttackToast message={toastMessage} onClose={() => setToastMessage(null)} />

      {state !== 'idle' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden select-none"
          style={{ filter: 'none', backdropFilter: 'none', opacity: 1, transform: 'none' }}
        >
          {state === 'warning' && (
            <div className="absolute inset-0 bg-[#e11d2e]/30 flex items-center justify-center p-6">
              <div className="font-heading font-black text-3xl sm:text-5xl md:text-6xl text-[#e11d2e] tracking-widest text-center uppercase drop-shadow-[0_0_30px_rgba(225,29,46,0.9)] animate-pulse">
                SPIDER-SENSE TINGLING
              </div>
            </div>
          )}

          {state === 'fighting' && (
            /* Centered Villain Video Box with exact 16:9 aspect ratio and fit contain */
            <div
              id="villain-video-box"
              className="relative bg-black flex items-center justify-center overflow-hidden"
              style={{
                aspectRatio: '16 / 9',
                width: 'min(100vw, calc(100vh * 16 / 9))',
                filter: 'none',
                backdropFilter: 'none',
                opacity: 1,
                transform: 'none',
              }}
            >
              <BackgroundVideo
                src={canSetVillainSrc ? VILLAIN_VIDEO_CONFIG.src : ''}
                poster={VILLAIN_VIDEO_CONFIG.poster}
                fit="contain"
                loop={false}
                onEnded={handleFightEnd}
                onError={handleFightEnd}
                className="w-full h-full"
              />

              {/* Small solid HUD badge ("SPIDER-SENSE") positioned absolutely at top: 1%; right: 1.5%; width: 6.5% */}
              <div
                className="absolute z-20 bg-[#e11d2e] text-white font-heading font-black uppercase text-center flex items-center justify-center shadow-md select-none pointer-events-none"
                style={{
                  top: '1%',
                  right: '1.5%',
                  width: '6.5%',
                  padding: '3px 1px',
                  fontSize: 'clamp(7px, 0.65vw, 11px)',
                  letterSpacing: '0.05em',
                  lineHeight: 1.1,
                }}
              >
                SPIDER-SENSE
              </div>

              {/* Top Controls with Skip button */}
              <div className="absolute top-[2%] left-[2%] z-20 flex items-center space-x-3">
                <span className="font-heading text-xs tracking-widest text-[#e11d2e] uppercase font-bold bg-black/80 px-2.5 py-1 rounded border border-[#e11d2e]/40 shadow-sm">
                  CRITICAL ALERT // LEVEL 5 INTRUSION
                </span>
                <Button
                  variant="secondary"
                  onClick={handleFightEnd}
                  className="py-1 px-4 text-xs bg-neutral-900/90 hover:bg-neutral-800 text-white border border-white/20"
                >
                  Skip
                </Button>
              </div>

              {/* Caption sitting in bottom 12% of the box */}
              <div
                className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center px-6 bg-gradient-to-t from-black via-black/90 to-transparent"
                style={{ height: '12%' }}
              >
                <p className="font-mono text-sm sm:text-base text-white tracking-wider">
                  {caption}
                  <span className="animate-ping">_</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </>
  );
};
