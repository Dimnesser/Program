import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('nova-card p-5 shadow-soft', className)} {...props}>
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

export function SectionHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          {icon ? <span className="text-accent">{icon}</span> : null}
          <span className="truncate">{title}</span>
        </h2>
        {subtitle ? <p className="mt-1 text-[13px] text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
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
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-line bg-card/70 p-4 transition-colors duration-200',
        'hover:border-line-strong',
        accent && 'border-accent/25 bg-accent/[0.06]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">{label}</span>
        {icon ? <span className={cn('text-faint', accent && 'text-accent')}>{icon}</span> : null}
      </div>
      <div className="mt-2 truncate text-2xl font-semibold tracking-[-0.02em] text-ink">{value}</div>
      {hint ? <div className="mt-0.5 truncate text-xs text-muted">{hint}</div> : null}
    </div>
  );
}
