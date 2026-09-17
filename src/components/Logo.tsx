import { cn } from '@/lib/utils';

export function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-4 w-4', className)} aria-hidden="true" fill="none">
      <path
        d="M12 2c.7 4.4 4.9 8.6 10 9.3-5.1.7-9.3 4.9-10 10-.7-5.1-4.9-9.3-10-10C7.1 10.6 11.3 6.4 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** A typographic wordmark: the mark is a punctuation detail, not a badge. */
export function Logo({
  compact = false,
  className,
  showTagline = false,
}: {
  compact?: boolean;
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={cn('flex items-baseline gap-2', className)}>
      <Spark className="h-[13px] w-[13px] shrink-0 translate-y-[1px] text-accent" />
      {!compact ? (
        <span className="flex min-w-0 flex-col">
          <span className="font-serif text-[19px] font-semibold leading-none tracking-[-0.02em] text-ink">NOVA</span>
          {showTagline ? (
            <span className="mt-2 truncate font-mono text-[10px] uppercase tracking-caps text-faint">
              Everything you need. One place.
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
