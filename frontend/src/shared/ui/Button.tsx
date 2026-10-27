import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-heading text-sm uppercase tracking-wider px-6 py-3 rounded-lg font-bold transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#070b14] disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#2f6bff] text-white hover:bg-[#2557d6] focus:ring-[#2f6bff] shadow-[0_0_20px_rgba(47,107,255,0.45)] border border-[rgba(255,255,255,0.15)]',
    secondary:
      'bg-[rgba(13,21,39,0.7)] text-white hover:bg-[rgba(18,29,54,0.9)] focus:ring-white/40 border border-white/20 backdrop-blur-md',
    danger:
      'bg-[#e11d2e] text-white hover:bg-[#c41524] focus:ring-[#e11d2e] shadow-[0_0_20px_rgba(225,29,46,0.45)] border border-[rgba(255,255,255,0.15)]',
  };

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      disabled={disabled}
      className={clsx(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
};
