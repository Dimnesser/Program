import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/** Circular progress ring used by the timer and pomodoro. */
export function Ring({
  progress,
  children,
  className,
  tone = 'accent',
}: {
  progress: number;
  children: ReactNode;
  className?: string;
  tone?: 'accent' | 'success' | 'warning';
}) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  const strokes = {
    accent: 'stroke-accent',
    success: 'stroke-success',
    warning: 'stroke-warning',
  };

  return (
    <div className={cn('relative aspect-square w-full max-w-[300px]', className)}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="4" className="stroke-line" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-[stroke-dashoffset] duration-500 ease-linear', strokes[tone])}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
