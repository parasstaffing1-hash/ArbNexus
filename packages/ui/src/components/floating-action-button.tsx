import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'cyan' | 'emerald';
  icon?: React.ReactNode;
}

export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ className, variant = 'gold', icon, children, ...props }, ref) => {
    const variantStyles = {
      gold: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_24px_rgba(245,166,35,0.4)]',
      cyan: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_24px_rgba(0,242,254,0.4)]',
      emerald:
        'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.4)]',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-sans text-sm font-semibold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/50',
          variantStyles[variant],
          className,
        )}
        {...(props as any)}
      >
        {icon}
        {children}
      </motion.button>
    );
  },
);

FloatingActionButton.displayName = 'FloatingActionButton';
