import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Hover/focus tooltip. Content is also exposed to screen readers via title. */
export function Tooltip({
  content,
  children,
  side = 'top',
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
    >
      {children}
      {open ? (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 w-max max-w-[240px] animate-scale-in rounded-lg border border-line',
            'bg-elevated px-2.5 py-1.5 text-center text-[11px] font-medium leading-snug text-ink shadow-lift',
            positions[side],
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
