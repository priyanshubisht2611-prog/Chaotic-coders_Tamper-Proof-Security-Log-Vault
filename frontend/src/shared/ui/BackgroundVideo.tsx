import React, { useEffect, useState, useRef } from 'react';
import clsx from 'clsx';

export interface BackgroundVideoProps {
  src: string;
  poster: string;
  fit?: 'cover' | 'contain';
  loop?: boolean;
  onEnded?: () => void;
  onError?: (err: unknown) => void;
  onPlaying?: () => void;
  className?: string;
  autoPlay?: boolean;
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  src,
  poster,
  fit = 'cover',
  loop = false,
  onEnded,
  onError,
  onPlaying,
  className,
  autoPlay = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    setHasError(true);
    if (onError) {
      onError(e);
    }
  };

  const objectFitClass = fit === 'contain' ? 'object-contain' : 'object-cover';

  if (reducedMotion || hasError || !src) {
    return (
      <div className={clsx('relative w-full h-full overflow-hidden', className)}>
        <img
          src={poster}
          alt="Video fallback poster"
          className={clsx('w-full h-full select-none pointer-events-none', objectFitClass)}
        />
      </div>
    );
  }

  return (
    <div className={clsx('relative w-full h-full overflow-hidden', className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted
        playsInline
        preload="auto"
        loop={loop}
        onEnded={onEnded}
        onError={handleError}
        onPlaying={onPlaying}
        className={clsx('w-full h-full select-none pointer-events-none', objectFitClass)}
      />
    </div>
  );
};
