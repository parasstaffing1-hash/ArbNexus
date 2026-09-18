import * as React from 'react';
import { cn } from '../lib/utils';

export interface AnimatedNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  format?: (val: number) => string;
  durationMs?: number;
}

export function AnimatedNumber({
  value,
  format = (v) => v.toLocaleString('en-US'),
  durationMs = 600,
  className,
  ...props
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = React.useState(value);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const diff = value - startValue;

    if (diff === 0) return;

    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      // easeOutExpo easing
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValue + diff * ease;

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, durationMs]);

  return (
    <span className={cn('font-mono tabular-nums', className)} {...props}>
      {format(displayValue)}
    </span>
  );
}
