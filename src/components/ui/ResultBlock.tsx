import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CopyButton } from './CopyButton';

/** Read-only output surface with a copy affordance — used across the tools. */
export function ResultBlock({
  value,
  label,
  mono = true,
  placeholder,
  className,
  actions,
  rows,
}: {
  value: string;
  label?: string;
  mono?: boolean;
  placeholder?: string;
  className?: string;
  actions?: ReactNode;
  rows?: number;
}) {
  return (
    <div className={cn('flex h-full flex-col', className)}>
      {(label || actions || value) && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-muted">{label}</span>
          <div className="flex items-center gap-1.5">
            {actions}
            {value ? <CopyButton value={value} size="xs" variant="ghost" compact /> : null}
          </div>
        </div>
      )}
      <div
        className={cn(
          'relative flex-1 overflow-auto rounded-xl border border-line bg-surface/70 p-3.5',
          mono ? 'font-mono text-[13px]' : 'text-sm',
          'leading-relaxed',
        )}
        style={rows ? { minHeight: `${rows * 1.6}em` } : undefined}
      >
        {value ? (
          <pre className="whitespace-pre-wrap break-words text-ink">{value}</pre>
        ) : (
          <span className="text-faint">{placeholder}</span>
        )}
      </div>
    </div>
  );
}

export function StatRow({ items }: { items: { label: string; value: ReactNode; tone?: 'accent' | 'success' }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-line bg-surface/60 px-3 py-2.5">
          <div className="text-[11px] uppercase tracking-[0.06em] text-faint">{item.label}</div>
          <div
            className={cn(
              'mt-0.5 truncate text-lg font-semibold tabular-nums text-ink',
              item.tone === 'accent' && 'text-accent',
              item.tone === 'success' && 'text-success',
            )}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
