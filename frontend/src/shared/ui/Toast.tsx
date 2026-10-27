import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

export interface ToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number;
  type?: ToastType;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  onClose,
  duration = 5000,
  type = 'info',
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  const borderAndIcon = () => {
    switch (type) {
      case 'success':
        return {
          border: 'border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.25)]',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
          accent: 'bg-emerald-500',
        };
      case 'error':
        return {
          border: 'border-[#e11d2e]/60 shadow-[0_0_25px_rgba(225,29,46,0.35)]',
          icon: <AlertTriangle className="w-5 h-5 text-[#e11d2e] flex-shrink-0" />,
          accent: 'bg-[#e11d2e]',
        };
      case 'warning':
        return {
          border: 'border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.25)]',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
          accent: 'bg-amber-500',
        };
      case 'info':
      default:
        return {
          border: 'border-[#2f6bff]/50 shadow-[0_0_25px_rgba(47,107,255,0.25)]',
          icon: <Info className="w-5 h-5 text-[#2f6bff] flex-shrink-0" />,
          accent: 'bg-[#2f6bff]',
        };
    }
  };

  const style = borderAndIcon();

  return (
    <aside
      aria-label="Notifications"
      aria-live="polite"
      role="status"
      className="fixed top-6 right-6 z-[100] pointer-events-none"
    >
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`pointer-events-auto max-w-md min-w-[300px] p-4 rounded-xl bg-[#0d1527]/95 backdrop-blur-xl border ${style.border} text-white font-sans text-sm flex items-start justify-between gap-3 shadow-2xl relative overflow-hidden`}
          >
            <div className="flex items-start space-x-3">
              {style.icon}
              <div className="flex-1 pt-0.5">
                <p className="font-medium text-white/95 leading-snug">{message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss notification"
              className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <X className="w-4 h-4" />
            </button>
            {/* Ambient indicator stripe */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-0.5 ${style.accent} opacity-60`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
