import { useState } from 'react';
import { Dices } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCopy } from '@/hooks/useCopy';
import { Card } from '@/components/ui/Card';
import { Checkbox, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

const randomInRange = (min: number, max: number) => {
  const span = max - min + 1;
  const buffer = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / span) * span;
  let value = 0xffffffff;
  while (value >= limit) {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  }
  return min + (value % span);
};

export default function RandomNumber() {
  const { t } = useI18n();
  const { copy } = useCopy();
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [count, setCount] = useState('1');
  const [unique, setUnique] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [errorText, setErrorText] = useState('');

  const roll = () => {
    const low = Math.floor(Number(min));
    const high = Math.floor(Number(max));
    const amount = Math.max(1, Math.min(1000, Math.floor(Number(count)) || 1));

    if (!Number.isFinite(low) || !Number.isFinite(high) || low > high) {
      setErrorText(t('error.invalidInput'));
      setResults([]);
      return;
    }
    if (unique && high - low + 1 < amount) {
      setErrorText(t('error.invalidInput'));
      setResults([]);
      return;
    }

    setErrorText('');
    if (unique) {
      const pool = new Set<number>();
      while (pool.size < amount) pool.add(randomInRange(low, high));
      setResults([...pool]);
      return;
    }
    setResults(Array.from({ length: amount }, () => randomInRange(low, high)));
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('random.min')} value={min} onChange={(event) => setMin(event.target.value)} inputMode="numeric" />
          <Input label={t('random.max')} value={max} onChange={(event) => setMax(event.target.value)} inputMode="numeric" />
        </div>
        <Input
          label={t('random.count')}
          value={count}
          onChange={(event) => setCount(event.target.value)}
          inputMode="numeric"
        />
        <Checkbox checked={unique} onChange={setUnique} label={t('random.unique')} />
        {errorText ? <p className="text-[13px] text-danger">{errorText}</p> : null}
        <Button variant="primary" block icon={<Dices className="h-4 w-4" />} onClick={roll}>
          {t('random.roll')}
        </Button>
      </Card>

      <Card className="flex flex-col items-center justify-center py-10">
        {results.length === 0 ? (
          <p className="text-[13px] text-muted">{t('random.roll')}</p>
        ) : results.length === 1 ? (
          <button
            type="button"
            onClick={() => copy(String(results[0]))}
            className="font-mono text-6xl font-semibold tabular-nums tracking-tight text-ink transition-colors hover:text-accent sm:text-7xl"
            aria-live="polite"
          >
            {results[0]}
          </button>
        ) : (
          <div className="w-full">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-medium text-muted">
                {t('common.result')} · {results.length}
              </span>
              <Button size="xs" variant="ghost" onClick={() => copy(results.join(', '))}>
                {t('common.copy')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2" aria-live="polite">
              {results.map((value, index) => (
                <span
                  key={`${value}-${index}`}
                  className="rounded-xl border border-line bg-surface/60 px-3 py-1.5 font-mono text-[15px] font-medium text-ink"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
