import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { formatNumber, cn } from '@/lib/utils';
import { convertUnits, unitCategories, unitCategoryMap, type UnitCategoryId } from './units';
import type { ToolProps } from '@/types';

export default function UnitConverter({ preset, initial }: ToolProps) {
  const { t, tl } = useI18n();

  const startCategory = (initial?.category ?? preset ?? 'length') as UnitCategoryId;
  const [category, setCategory] = useState<UnitCategoryId>(
    unitCategoryMap.has(startCategory) ? startCategory : 'length',
  );
  const definition = unitCategoryMap.get(category)!;

  const [from, setFrom] = useState(initial?.from ?? definition.defaults[0]);
  const [to, setTo] = useState(initial?.to ?? definition.defaults[1]);
  const [value, setValue] = useState(initial?.value ?? '1');

  useEffect(() => {
    if (!initial) return;
    if (initial.category && unitCategoryMap.has(initial.category as UnitCategoryId)) {
      setCategory(initial.category as UnitCategoryId);
    }
    if (initial.from) setFrom(initial.from);
    if (initial.to) setTo(initial.to);
    if (initial.value) setValue(initial.value);
  }, [initial]);

  const changeCategory = (next: UnitCategoryId) => {
    const target = unitCategoryMap.get(next)!;
    setCategory(next);
    setFrom(target.defaults[0]);
    setTo(target.defaults[1]);
  };

  const options = definition.units.map((unit) => ({
    value: unit.id,
    label: `${tl(unit.name)} (${unit.symbol})`,
  }));

  const numeric = Number(value.replace(',', '.'));
  const valid = value.trim() !== '' && Number.isFinite(numeric);
  const result = valid ? convertUnits(category, from, to, numeric) : Number.NaN;

  const fromUnit = definition.units.find((unit) => unit.id === from);
  const toUnit = definition.units.find((unit) => unit.id === to);

  /* A row of everyday conversions for the active category. */
  const commonRows = useMemo(() => {
    if (!valid || !Number.isFinite(result)) return [];
    return definition.units
      .filter((unit) => unit.id !== from)
      .slice(0, 6)
      .map((unit) => ({
        unit,
        value: convertUnits(category, from, unit.id, numeric),
      }));
  }, [definition.units, category, from, numeric, valid, result]);

  return (
    <div className="space-y-5">
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1 no-scrollbar">
        {unitCategories.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => changeCategory(item.id)}
            className={cn('nova-chip shrink-0', category === item.id && 'border-accent/40 bg-accent/10 text-accent hover:text-accent')}
          >
            {tl(item.name)}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Card className="space-y-4">
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-3">
              <Input
                label={t('common.from')}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                inputMode="decimal"
                invalid={!valid && value.trim() !== ''}
                placeholder="0"
              />
              <Select value={from} onChange={(event) => setFrom(event.target.value)} options={options} />
            </div>

            <IconButton
              label={t('common.swap')}
              onClick={() => {
                setFrom(to);
                setTo(from);
              }}
              className="mx-auto my-1 sm:mb-1.5"
              variant="secondary"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </IconButton>

            <div className="space-y-3">
              <div>
                <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('common.to')}</span>
                <div className="flex h-[42px] items-center justify-between gap-2 rounded-xl border border-line bg-surface/70 px-3.5">
                  <span className="truncate font-mono text-[15px] font-medium text-ink" aria-live="polite">
                    {Number.isFinite(result) ? formatNumber(result) : '—'}
                  </span>
                  {Number.isFinite(result) ? (
                    <CopyButton value={String(result)} size="xs" variant="ghost" compact />
                  ) : null}
                </div>
              </div>
              <Select value={to} onChange={(event) => setTo(event.target.value)} options={options} />
            </div>
          </div>

          {valid && Number.isFinite(result) ? (
            <p className="rounded-xl border border-line bg-surface/50 px-3.5 py-3 font-mono text-[13px] text-muted">
              {formatNumber(numeric)} {fromUnit?.symbol} = {formatNumber(result)} {toUnit?.symbol}
            </p>
          ) : null}
        </Card>

        <Card>
          <h2 className="mb-3 text-[13px] font-semibold text-ink">{t('unit.common')}</h2>
          {commonRows.length === 0 ? (
            <p className="text-[13px] text-muted">{t('error.invalidInput')}</p>
          ) : (
            <ul className="space-y-1">
              {commonRows.map((row) => (
                <li key={row.unit.id}>
                  <button
                    type="button"
                    onClick={() => setTo(row.unit.id)}
                    className="flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface/70"
                  >
                    <span className="truncate text-[13px] text-muted">{tl(row.unit.name)}</span>
                    <span className="shrink-0 font-mono text-[13px] font-medium text-ink">
                      {formatNumber(row.value)} {row.unit.symbol}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
