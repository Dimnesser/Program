import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The masthead every routed page shares: an eyebrow in the mono face, a serif
 * title, and a rule that separates it from the body.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('border-b border-ink pb-6', className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <p className="nova-caps">{eyebrow}</p> : null}
          <h1 className="nova-display mt-3 text-[36px] text-ink sm:text-[46px]">{title}</h1>
          {subtitle ? <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-muted">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
