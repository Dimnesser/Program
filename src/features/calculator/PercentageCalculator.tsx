import { useEffect, useMemo, useState } from 'react';
import { Percent } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Input, Segmented } from '@/components/ui/Field';
import { CopyButton } from '@/components/ui/CopyButton';
import { formatNumber } from '@/lib/utils';
import type { ToolProps } from '@/types';

type Mode = 'of' | 'share' | 'change' | 'addsub';

export default function PercentageCalculator({ initial }: ToolProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>((initial?.mode as Mode) ?? 'of');
  const [a, setA] = useState(initial?.a ?? '15');
  const [b, setB] = useState(initial?.b ?? '800');

  useEffect(() => {
    if (!initial) return;
    if (initial.mode) setMode(initial.mode as Mode);
    if (initial.a) setA(initial.a);
    if (initial.b) setB(initial.b);
  }, [initial]);

  const numA = Number(a.replace(',', '.'));
  const numB = Number(b.replace(',', '.'));
  const valid = Number.isFinite(numA) && Number.isFinite(numB) && a.trim() !== '' && b.trim() !== '';

  const { result, formula } = useMemo(() => {
    if (!valid) return { result: null as number | null, formula: '' };
    switch (mode) {
      case 'of':
        return { result: (numB * numA) / 100, formula: `${formatNumber(numA)}% × ${formatNumber(numB)} ÷ 100` };
      case 'share':
        return {
          result: numB === 0 ? null : (numA / numB) * 100,
          formula: `${formatNumber(numA)} ÷ ${formatNumber(numB)} × 100`,
        };
      case 'change':
        return {
          result: numA === 0 ? null : ((numB - numA) / Math.abs(numA)) * 100,
          formula: `(${formatNumber(numB)} − ${formatNumber(numA)}) ÷ ${formatNumber(numA)} × 100`,
        };
      case 'addsub':
      default:
        return {
          result: numA + (numA * numB) / 100,
          formula: `${formatNumber(numA)} + ${formatNumber(numA)} × ${formatNumber(numB)}%`,
        };
    }
  }, [mode, numA, numB, valid]);

  const labels: Record<Mode, { a: string; b: string; suffix: string }> = {
    of: { a: '%', b: t('common.value'), suffix: '' },
    share: { a: t('common.value'), b: t('common.value'), suffix: '%' },
    change: { a: t('common.from'), b: t('common.to'), suffix: '%' },
    addsub: { a: t('common.value'), b: '%', suffix: '' },
  };

  const display = result === null ? '—' : `${formatNumber(result)}${labels[mode].suffix}`;

  /* Everyday shortcuts people actually reach for. */
  const quick = [
    { label: '10%', mode: 'of' as Mode, a: '10' },
    { label: '15%', mode: 'of' as Mode, a: '15' },
    { label: '20%', mode: 'of' as Mode, a: '20' },
    { label: '+18%', mode: 'addsub' as Mode, b: '18' },
    { label: '−25%', mode: 'addsub' as Mode, b: '-25' },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="space-y-5">
        <Segmented
          value={mode}
          onChange={setMode}
          ariaLabel={t('common.options')}
          options={[
            { value: 'of', label: t('percent.mode.of') },
            { value: 'share', label: t('percent.mode.isWhat') },
            { value: 'change', label: t('percent.mode.change') },
            { value: 'addsub', label: t('percent.mode.addSub') },
          ]}
          className="flex-wrap"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={labels[mode].a}
            value={a}
            onChange={(event) => setA(event.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
          <Input
            label={labels[mode].b}
            value={b}
            onChange={(event) => setB(event.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {quick.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setMode(item.mode);
                if (item.a) setA(item.a);
                if (item.b) setB(item.b);
              }}
              className="nova-chip"
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col justify-center">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
          <Percent className="h-3.5 w-3.5" />
          {t('percent.result')}
        </div>
        <p
          className="mt-3 break-words font-mono text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
          aria-live="polite"
        >
          {display}
        </p>
        {valid && result !== null ? (
          <>
            <p className="mt-3 font-mono text-[13px] text-muted">{formula}</p>
            <CopyButton value={String(result)} size="sm" className="mt-5 self-start" />
          </>
        ) : (
          <p className="mt-3 text-[13px] text-muted">{t('error.invalidInput')}</p>
        )}
      </Card>
    </div>
  );
}
