import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../lib/utils';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'gold' | 'cyan' | 'emerald';
  glow?: boolean;
  hoverLift?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', glow = false, hoverLift = true, children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-[#0a1b2e]/70 border-[#1c3957]/60 hover:border-[#2a4d70]/80',
      gold: 'bg-[#0f1f33]/75 border-[#f5a623]/30 hover:border-[#f5a623]/60 shadow-[0_0_20px_rgba(245,166,35,0.08)]',
      cyan: 'bg-[#081e33]/75 border-[#00f2fe]/30 hover:border-[#00f2fe]/60 shadow-[0_0_20px_rgba(0,242,254,0.08)]',
      emerald:
        'bg-[#08222c]/75 border-[#10b981]/30 hover:border-[#10b981]/60 shadow-[0_0_20px_rgba(16,185,129,0.08)]',
    };

    return (
      <motion.div
        ref={ref}
        whileHover={hoverLift ? { y: -2, transition: { duration: 0.15 } } : undefined}
        className={cn(
          'relative rounded-xl border backdrop-blur-md transition-colors text-slate-100 p-5',
          variantStyles[variant],
          glow && 'shadow-lg',
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

GlassCard.displayName = 'GlassCard';
