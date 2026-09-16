import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger' | 'success';
type Size = 'xs' | 'sm' | 'md' | 'lg';

const base =
  'relative inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium ' +
  'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-nova ' +
  'active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45 whitespace-nowrap';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-fg shadow-[0_6px_20px_-8px_rgb(var(--nova-accent)/0.9)] ' +
    'hover:brightness-110 hover:shadow-[0_10px_28px_-10px_rgb(var(--nova-accent)/0.95)]',
  secondary: 'border border-line bg-elevated text-ink hover:border-line-strong hover:bg-elevated/70',
  ghost: 'text-muted hover:bg-elevated hover:text-ink',
  subtle: 'bg-accent/10 text-accent hover:bg-accent/15',
  danger: 'bg-danger/12 text-danger hover:bg-danger/20',
  success: 'bg-success/12 text-success hover:bg-success/20',
};

const sizes: Record<Size, string> = {
  xs: 'h-8 px-2.5 text-xs',
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
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
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
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
    <Link
      to={to}
      className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}
    >
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

const iconSizes = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-10 w-10' };

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
        active && 'bg-accent/12 text-accent',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
