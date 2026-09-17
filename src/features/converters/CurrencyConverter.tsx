import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Info, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Field';
import { Button, IconButton } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Badge } from '@/components/ui/Badge';
import { formatNumber } from '@/lib/utils';
import { convertCurrency, currencies, fetchRates, referenceRates, REFERENCE_DATE } from './currencies';
import type { ToolProps } from '@/types';

export default function CurrencyConverter({ initial }: ToolProps) {
  const { t, tl } = useI18n();
  const [amount, setAmount] = useState(initial?.amount ?? '100');
  const [from, setFrom] = useState(initial?.from ?? 'USD');
  const [to, setTo] = useState(initial?.to ?? 'UAH');
  const [rates, setRates] = useState<Record<string, number>>(referenceRates);
  const [updated, setUpdated] = useState(REFERENCE_DATE);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initial) return;
    if (initial.amount) setAmount(initial.amount);
    if (initial.from) setFrom(initial.from);
    if (initial.to) setTo(initial.to);
  }, [initial]);

  const load = async () => {
    setLoading(true);
    const payload = await fetchRates();
    setRates(payload.rates);
    setUpdated(payload.date);
    setLive(payload.live);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const options = currencies.map((currency) => ({
    value: currency.code,
    label: `${currency.code} — ${tl(currency.name)}`,
  }));

  const numeric = Number(amount.replace(',', '.'));
  const valid = amount.trim() !== '' && Number.isFinite(numeric);
  const result = valid ? convertCurrency(rates, from, to, numeric) : Number.NaN;
  const unitRate = convertCurrency(rates, from, to, 1);

  const table = useMemo(
    () =>
      currencies
        .filter((currency) => currency.code !== from)
        .map((currency) => ({ currency, value: convertCurrency(rates, from, currency.code, valid ? numeric : 1) }))
        .filter((row) => Number.isFinite(row.value)),
    [from, numeric, rates, valid],
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <Card className="space-y-4">
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-3">
            <Input
              label={t('currency.amount')}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              invalid={!valid && amount.trim() !== ''}
            />
            <Select value={from} onChange={(event) => setFrom(event.target.value)} options={options} />
          </div>

          <IconButton
            label={t('common.swap')}
            variant="secondary"
            className="mx-auto my-1 sm:mb-1.5"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
          >
            <ArrowLeftRight className="h-4 w-4" />
          </IconButton>

          <div className="space-y-3">
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('common.result')}</span>
              <div className="flex h-[42px] items-center justify-between gap-2 rounded-xl border border-line bg-surface/70 px-3.5">
                <span className="truncate font-mono text-[15px] font-medium text-ink" aria-live="polite">
                  {Number.isFinite(result) ? formatNumber(result, 2) : '—'}
                </span>
                {Number.isFinite(result) ? (
                  <CopyButton value={result.toFixed(2)} size="xs" variant="ghost" compact />
                ) : null}
              </div>
            </div>
            <Select value={to} onChange={(event) => setTo(event.target.value)} options={options} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/50 px-3.5 py-3">
          <span className="font-mono text-[13px] text-muted">
            1 {from} = {formatNumber(unitRate, 4)} {to}
          </span>
          <div className="flex items-center gap-2">
            <Badge tone={live ? 'success' : 'neutral'}>
              {t('currency.updated')}: {updated}
            </Badge>
            <Button size="xs" icon={<RefreshCw className="h-3.5 w-3.5" />} loading={loading} onClick={() => void load()}>
              {t('currency.rates')}
            </Button>
          </div>
        </div>

        {!live ? (
          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-faint">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t('currency.ratesHint')}
          </p>
        ) : null}
      </Card>

      <Card>
        <h2 className="mb-3 text-[13px] font-semibold text-ink">{t('currency.rates')}</h2>
        <ul className="space-y-1">
          {table.map((row) => (
            <li key={row.currency.code}>
              <button
                type="button"
                onClick={() => setTo(row.currency.code)}
                className="flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface/70"
              >
                <span className="flex items-center gap-2 truncate text-[13px] text-muted">
                  <span className="font-mono text-ink">{row.currency.code}</span>
                  <span className="truncate">{tl(row.currency.name)}</span>
                </span>
                <span className="shrink-0 font-mono text-[13px] font-medium text-ink">{formatNumber(row.value, 2)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
