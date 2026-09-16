import { useState } from 'react';
import { Shuffle, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function RandomChoice() {
  const { t } = useI18n();
  const [raw, setRaw] = useState('Піца\nСуші\nБургер\nПаста');
  const [winner, setWinner] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const options = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const pick = () => {
    if (options.length < 2) return;
    setSpinning(true);

    // A short shuffle animation so the result feels earned rather than instant.
    let ticks = 0;
    const interval = setInterval(() => {
      const buffer = new Uint32Array(1);
      crypto.getRandomValues(buffer);
      setWinner(options[buffer[0] % options.length]);
      ticks += 1;
      if (ticks > 12) {
        clearInterval(interval);
        crypto.getRandomValues(buffer);
        const result = options[buffer[0] % options.length];
        setWinner(result);
        setHistory((current) => [result, ...current].slice(0, 8));
        setSpinning(false);
      }
    }, 70);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_1fr]">
      <Card className="flex flex-col p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-medium text-muted">{t('random.options')}</span>
          <span className="text-[11px] text-faint">{options.length}</span>
        </div>
        <Textarea
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder={t('random.optionsHint')}
          className="min-h-[260px]"
          aria-label={t('random.options')}
        />
        <p className="mt-2 text-[11px] text-faint">{t('random.optionsHint')}</p>
      </Card>

      <div className="space-y-5">
        <Card className="flex flex-col items-center justify-center gap-5 py-10">
          <span className="text-[11px] uppercase tracking-[0.08em] text-faint">{t('random.winner')}</span>
          <p
            className={cn(
              'min-h-[48px] break-words px-4 text-center text-3xl font-semibold tracking-tight text-ink transition-all duration-150 sm:text-4xl',
              spinning && 'opacity-60 blur-[1px]',
            )}
            aria-live="polite"
          >
            {winner ?? '—'}
          </p>
          <Button
            variant="primary"
            size="lg"
            loading={spinning}
            disabled={options.length < 2}
            icon={<Shuffle className="h-4 w-4" />}
            onClick={pick}
          >
            {t('random.pick')}
          </Button>
          {options.length < 2 ? <p className="text-[12px] text-muted">{t('random.needOptions')}</p> : null}
        </Card>

        {history.length > 0 ? (
          <Card>
            <h2 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              {t('nav.recent')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {history.map((item, index) => (
                <span key={`${item}-${index}`} className="nova-chip">
                  {item}
                </span>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
