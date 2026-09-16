import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { StorageKeys } from '@/lib/storage';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

interface CounterState {
  value: number;
  step: number;
  label: string;
}

export default function Counter() {
  const { t } = useI18n();
  const [state, setState] = useLocalStorage<CounterState>(StorageKeys.counter, {
    value: 0,
    step: 1,
    label: '',
  });

  const change = (delta: number) => setState({ ...state, value: state.value + delta });

  return (
    <div className="mx-auto grid max-w-3xl gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <Card className="flex flex-col items-center justify-center gap-8 py-14">
        <input
          value={state.label}
          onChange={(event) => setState({ ...state, label: event.target.value })}
          placeholder={t('counter.title')}
          aria-label={t('counter.title')}
          className="w-full max-w-xs bg-transparent text-center text-[13px] font-medium text-muted outline-none placeholder:text-faint"
        />

        <p className="font-mono text-6xl font-semibold tabular-nums tracking-tight text-ink sm:text-8xl" aria-live="polite">
          {state.value}
        </p>

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            className="h-16 w-16 rounded-2xl p-0"
            aria-label={`−${state.step}`}
            onClick={() => change(-state.step)}
          >
            <Minus className="h-6 w-6" />
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="h-16 w-16 rounded-2xl p-0"
            aria-label={`+${state.step}`}
            onClick={() => change(state.step)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <Input
          label={t('counter.increment')}
          value={String(state.step)}
          onChange={(event) => setState({ ...state, step: Math.max(1, Number(event.target.value) || 1) })}
          inputMode="numeric"
        />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 5, 10].map((step) => (
            <button key={step} type="button" onClick={() => setState({ ...state, step })} className="nova-chip">
              +{step}
            </button>
          ))}
        </div>
        <Button
          block
          variant="danger"
          icon={<RotateCcw className="h-4 w-4" />}
          onClick={() => setState({ ...state, value: 0 })}
        >
          {t('counter.reset')}
        </Button>
      </Card>
    </div>
  );
}
