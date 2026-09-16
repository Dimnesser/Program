import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

export function Label({
  children,
  htmlFor,
  hint,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('mb-1.5 flex items-center justify-between gap-2 text-[13px] font-medium text-muted', className)}
    >
      <span>{children}</span>
      {hint ? <span className="text-xs font-normal text-faint">{hint}</span> : null}
    </label>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: ReactNode;
  invalid?: boolean;
  addon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, invalid, className, addon, id, ...props },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className="w-full">
      {label ? (
        <Label htmlFor={inputId} hint={hint}>
          {label}
        </Label>
      ) : null}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={invalid || undefined}
          className={cn(
            'nova-field',
            invalid && 'border-danger/60 focus:border-danger focus:ring-danger/25',
            addon && 'pr-24',
            className,
          )}
          {...props}
        />
        {addon ? (
          <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">{addon}</div>
        ) : null}
      </div>
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: ReactNode;
  invalid?: boolean;
  mono?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, invalid, mono, className, id, ...props },
  ref,
) {
  const generated = useId();
  const areaId = id ?? generated;
  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      {label ? (
        <Label htmlFor={areaId} hint={hint}>
          {label}
        </Label>
      ) : null}
      <textarea
        ref={ref}
        id={areaId}
        spellCheck={false}
        aria-invalid={invalid || undefined}
        className={cn(
          'nova-field min-h-[140px] flex-1 resize-y leading-relaxed',
          mono && 'font-mono text-[13px]',
          invalid && 'border-danger/60 focus:border-danger focus:ring-danger/25',
          className,
        )}
        {...props}
      />
    </div>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: ReactNode;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, options, className, id, ...props },
  ref,
) {
  const generated = useId();
  const selectId = id ?? generated;
  return (
    <div className="w-full">
      {label ? (
        <Label htmlFor={selectId} hint={hint}>
          {label}
        </Label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn('nova-field cursor-pointer appearance-none pr-9', className)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
});

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
  className,
}: {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  suffix?: string;
  className?: string;
}) {
  const id = useId();
  const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <Label htmlFor={id}>
          <span className="flex w-full items-center justify-between gap-3">
            <span>{label}</span>
            <span className="tabular-nums font-semibold text-ink">
              {value}
              {suffix ? <span className="ml-0.5 font-normal text-faint">{suffix}</span> : null}
            </span>
          </span>
        </Label>
      ) : null}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ ['--range-progress' as string]: `${progress}%` }}
        className="w-full"
      />
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'group flex w-full items-center justify-between gap-3 rounded-xl px-1 py-2 text-left',
        'transition-colors duration-150 hover:bg-elevated/60',
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-accent bg-accent' : 'border-line-strong bg-surface',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-200 ease-nova',
            checked ? 'left-[26px] bg-accent-fg' : 'left-[3px] bg-faint',
          )}
        />
      </span>
    </button>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-[13px] text-ink',
        'transition-colors duration-150 hover:bg-elevated/70',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border transition-all duration-150',
          checked ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong bg-surface',
        )}
      >
        {checked ? (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
            <path d="m2.5 6.2 2.2 2.3L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
  className?: string;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex w-full items-center gap-1 rounded-xl border border-line bg-surface/80 p-1',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150 ease-nova',
              size === 'sm' ? 'h-7 px-2 text-xs' : 'h-8 px-3 text-[13px]',
              active
                ? 'bg-elevated text-ink shadow-[0_1px_2px_rgb(0_0_0/0.15)] ring-1 ring-line'
                : 'text-muted hover:text-ink',
            )}
          >
            {option.icon}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('w-full', className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-2 py-1.5 transition-colors hover:border-line-strong">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-7 w-9 cursor-pointer rounded-md border border-line bg-transparent p-0"
          aria-label={label}
        />
        <input
          value={value.toUpperCase()}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent font-mono text-[13px] uppercase text-ink outline-none"
          aria-label={`${label} HEX`}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
