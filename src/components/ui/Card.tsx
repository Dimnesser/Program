import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('nova-card p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function Panel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('nova-panel p-4', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Section headings are set like a printed contents page: a rule, a number in
 * the mono face, then the title.
 */
export function SectionHeader({
  title,
  subtitle,
  icon,
  action,
  index,
  divider = 'top',
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  index?: string;
  /** 'top' for page sections, 'bottom' for headings inside a ruled card. */
  divider?: 'top' | 'bottom' | 'none';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-4',
        divider === 'top' && 'border-t border-ink/80 pt-3',
        divider === 'bottom' && 'border-b border-line pb-2.5',
        className,
      )}
    >
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-baseline gap-2.5 font-sans text-[13px] font-semibold uppercase tracking-caps text-ink">
            {index ? <span className="font-mono text-[11px] font-normal text-faint">{index}</span> : null}
            {icon ? <span className="translate-y-0.5 text-faint">{icon}</span> : null}
            <span className="truncate">{title}</span>
          </h2>
          {subtitle ? <p className="mt-1.5 text-[13px] text-muted">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={cn('border-t border-line pt-3', accent && 'border-ink')}>
      <div className="flex items-center justify-between gap-2">
        <span className="nova-caps">{label}</span>
        {icon ? <span className={cn('text-faint', accent && 'text-accent')}>{icon}</span> : null}
      </div>
      <div
        className={cn(
          'mt-2 truncate font-serif text-[26px] font-semibold tracking-[-0.02em] text-ink',
          accent && 'text-accent',
        )}
      >
        {value}
      </div>
      {hint ? <div className="mt-0.5 truncate font-mono text-[11px] text-faint">{hint}</div> : null}
    </div>
  );
}
