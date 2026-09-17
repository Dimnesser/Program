import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger' | 'success';
type Size = 'xs' | 'sm' | 'md' | 'lg';

const base =
  'relative inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium ' +
  'transition-colors duration-150 ease-nova disabled:pointer-events-none disabled:opacity-40 whitespace-nowrap';

/* Primary is ink on paper — the accent colour is reserved for links and state. */
const variants: Record<Variant, string> = {
  primary: 'bg-ink text-bg hover:bg-ink/90',
  secondary: 'border border-line bg-surface text-ink hover:border-line-strong hover:bg-bg',
  ghost: 'text-muted hover:bg-accent/[0.06] hover:text-ink',
  subtle: 'border border-accent/25 bg-accent/[0.07] text-accent hover:bg-accent/[0.12]',
  danger: 'border border-danger/30 bg-danger/[0.06] text-danger hover:bg-danger/[0.12]',
  success: 'border border-success/30 bg-success/[0.06] text-success hover:bg-success/[0.12]',
};

const sizes: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs',
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-4 text-[13px]',
  lg: 'h-11 px-5 text-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', icon, iconRight, block, loading, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  );
});

export function LinkButton({
  to,
  className,
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  block,
  children,
}: {
  to: string;
  className?: string;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

const iconSizes = { sm: 'h-7 w-7', md: 'h-8 w-8', lg: 'h-9 w-9' };

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, className, variant = 'ghost', size = 'md', active, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        base,
        variants[variant],
        iconSizes[size],
        'rounded-xl p-0',
        active && 'bg-accent/10 text-accent',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
