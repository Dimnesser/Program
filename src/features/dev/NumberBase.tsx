import { useMemo, useState } from 'react';
import { Binary } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCopy } from '@/hooks/useCopy';
import { Card } from '@/components/ui/Card';
import { Input, Slider } from '@/components/ui/Field';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { cn } from '@/lib/utils';
import type { ToolProps } from '@/types';

const BASES = [
  { base: 2, label: 'BIN', name: 'binary' },
  { base: 8, label: 'OCT', name: 'octal' },
  { base: 10, label: 'DEC', name: 'decimal' },
  { base: 16, label: 'HEX', name: 'hexadecimal' },
];

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

const isValidForBase = (value: string, base: number) => {
  const allowed = DIGITS.slice(0, base);
  return value
    .trim()
    .toLowerCase()
    .split('')
    .every((char) => allowed.includes(char));
};

/** Grouped output (1010 1100) stays readable at a glance. */
const group = (value: string, size: number) =>
  value.length <= size ? value : value.replace(new RegExp(`\\B(?=(.{${size}})+$)`, 'g'), ' ');

export default function NumberBase({ initial }: ToolProps) {
  const { t } = useI18n();
  const { copy, isCopied } = useCopy();
  const [source, setSource] = useState({ base: 10, value: initial?.value ?? '2026' });
  const [customBase, setCustomBase] = useState(36);

  const parsed = useMemo(() => {
    const cleaned = source.value.replace(/[\s_]/g, '');
    if (!cleaned) return null;
    if (!isValidForBase(cleaned, source.base)) return Number.NaN;
    const value = Number.parseInt(cleaned, source.base);
    return Number.isFinite(value) ? value : Number.NaN;
  }, [source]);

  const valid = parsed !== null && !Number.isNaN(parsed);

  const rows = BASES.map((item) => ({
    ...item,
    output: valid ? parsed!.toString(item.base).toUpperCase() : '',
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <Card className="space-y-3">
        {rows.map((row) => {
          const active = source.base === row.base;
          return (
            <div key={row.base} className="flex items-end gap-3">
              <span
                className={cn(
                  'mb-2.5 w-11 shrink-0 font-mono text-[11px] font-semibold',
                  active ? 'text-accent' : 'text-faint',
                )}
              >
                {row.label}
              </span>
              <Input
                label={t(`base.${row.name}` as 'base.binary')}
                value={active ? source.value : group(row.output, row.base === 2 ? 4 : 3)}
                onChange={(event) => setSource({ base: row.base, value: event.target.value })}
                onFocus={() => setSource({ base: row.base, value: row.output })}
                className={cn('font-mono', active && 'border-accent/50')}
                invalid={active && parsed !== null && Number.isNaN(parsed)}
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => copy(row.output, row.label)}
                disabled={!row.output}
                className="mb-1 shrink-0 rounded-lg px-2 py-1.5 text-[11px] text-faint transition-colors hover:text-ink disabled:opacity-40"
              >
                {isCopied(row.label) ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          );
        })}

        {parsed !== null && Number.isNaN(parsed) ? (
          <p className="text-[13px] text-danger">{t('base.invalid')}</p>
        ) : null}
      </Card>

      <div className="space-y-5">
        <Card className="space-y-4">
          <Slider label={t('base.custom')} value={customBase} min={2} max={36} onChange={setCustomBase} />
          <div className="rounded-xl border border-line bg-surface/60 px-3.5 py-3">
            <div className="text-[11px] uppercase tracking-[0.06em] text-faint">
              {t('base.custom')} {customBase}
            </div>
            <button
              type="button"
              onClick={() => valid && copy(parsed!.toString(customBase).toUpperCase(), 'custom')}
              disabled={!valid}
              className="mt-1 block w-full break-all text-left font-mono text-lg font-semibold text-ink transition-colors enabled:hover:text-accent"
            >
              {valid ? parsed!.toString(customBase).toUpperCase() : '—'}
            </button>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
            <Binary className="h-4 w-4 text-accent" />
            {t('base.info')}
          </h2>
          <dl className="space-y-2 text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">{t('base.bits')}</dt>
              <dd className="font-mono text-ink">{valid ? parsed!.toString(2).length : '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">{t('base.bytes')}</dt>
              <dd className="font-mono text-ink">{valid ? Math.ceil(parsed!.toString(2).length / 8) : '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">{t('base.isSafe')}</dt>
              <dd className="font-mono text-ink">
                {valid ? (Number.isSafeInteger(parsed!) ? t('common.enabled') : t('common.disabled')) : '—'}
              </dd>
            </div>
          </dl>
        </Card>

        <PrivacyBadge />
      </div>
    </div>
  );
}
