import { useMemo, useState } from 'react';
import { Receipt } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Input, Slider } from '@/components/ui/Field';
import { CopyButton } from '@/components/ui/CopyButton';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { formatNumber, cn } from '@/lib/utils';

const QUICK_TIPS = [0, 5, 10, 12, 15, 20];

export default function TipCalculator() {
  const { t } = useI18n();
  const [bill, setBill] = useState('1200');
  const [tip, setTip] = useState(10);
  const [people, setPeople] = useState(2);
  const [roundUp, setRoundUp] = useState(false);

  const result = useMemo(() => {
    const amount = Number(bill.replace(',', '.'));
    if (!Number.isFinite(amount) || amount < 0) return null;

    const tipAmount = (amount * tip) / 100;
    let total = amount + tipAmount;
    if (roundUp) total = Math.ceil(total);

    const perPerson = people > 0 ? total / people : total;
    return {
      tipAmount: total - amount,
      total,
      perPerson,
      tipPerPerson: people > 0 ? (total - amount) / people : total - amount,
    };
  }, [bill, tip, people, roundUp]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_1fr]">
      <Card className="space-y-5">
        <Input
          label={t('tip.bill')}
          value={bill}
          onChange={(event) => setBill(event.target.value)}
          inputMode="decimal"
          className="text-lg"
          invalid={result === null && bill.trim() !== ''}
        />

        <div>
          <Slider label={t('tip.percent')} value={tip} min={0} max={30} onChange={setTip} suffix="%" />
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_TIPS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTip(value)}
                className={cn('nova-chip', tip === value && 'border-accent/40 bg-accent/10 text-accent hover:text-accent')}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>

        <Slider label={t('tip.people')} value={people} min={1} max={20} onChange={setPeople} />

        <button
          type="button"
          onClick={() => setRoundUp(!roundUp)}
          aria-pressed={roundUp}
          className={cn(
            'w-full rounded-xl border px-3.5 py-3 text-left text-[13px] transition-colors',
            roundUp ? 'border-accent/40 bg-accent/[0.07] text-ink' : 'border-line bg-surface/60 text-muted hover:text-ink',
          )}
        >
          {t('tip.round')}
        </button>

        <PrivacyBadge />
      </Card>

      <Card className="flex flex-col justify-center gap-5">
        {result ? (
          <>
            <div>
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-faint">
                <Receipt className="h-3.5 w-3.5" />
                {t('tip.perPerson')}
              </p>
              <p className="mt-2 font-mono text-4xl font-semibold text-ink sm:text-5xl">
                {formatNumber(result.perPerson, 2)}
              </p>
              <CopyButton value={result.perPerson.toFixed(2)} size="xs" variant="ghost" className="mt-2" />
            </div>

            <dl className="divide-y divide-line border-t border-line pt-3 text-[13px]">
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-muted">{t('tip.tipAmount')}</dt>
                <dd className="font-mono text-ink">{formatNumber(result.tipAmount, 2)}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-muted">{t('tip.total')}</dt>
                <dd className="font-mono text-lg font-semibold text-accent">{formatNumber(result.total, 2)}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-muted">{t('tip.tipPerPerson')}</dt>
                <dd className="font-mono text-ink">{formatNumber(result.tipPerPerson, 2)}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="text-center text-[13px] text-muted">{t('error.invalidInput')}</p>
        )}
      </Card>
    </div>
  );
}
