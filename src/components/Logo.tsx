import { cn } from '@/lib/utils';

export function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('h-5 w-5', className)} aria-hidden="true" fill="none">
      <path
        d="M32 8c1.9 11.8 11.3 21.2 23.1 23.1C43.3 33 33.9 42.4 32 54.2 30.1 42.4 20.7 33 8.9 31.1 20.7 29.2 30.1 19.8 32 8Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/70 text-accent-fg shadow-[0_4px_16px_-6px_rgb(var(--nova-accent)/0.9)]">
        <Spark className="h-[18px] w-[18px]" />
      </span>
      {!compact ? (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="text-[17px] font-semibold tracking-[-0.03em] text-ink">NOVA</span>
          {showTagline ? (
            <span className="mt-1 truncate text-[11px] font-medium text-faint">Everything you need. One place.</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
