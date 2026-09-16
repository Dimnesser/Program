import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Checkbox, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { formatDuration, clamp } from '@/lib/utils';
import { playChime } from './sound';
import { Ring } from './Ring';
import type { ToolProps } from '@/types';

const QUICK = [1, 3, 5, 10, 15, 25, 45, 60];
const STUDY = [25, 45, 50, 60, 90, 120];

export default function Timer({ preset, initial }: ToolProps) {
  const { t } = useI18n();
  const { success } = useToast();
  const presets = preset === 'study' ? STUDY : QUICK;

  const startMinutes = clamp(Number(initial?.minutes) || (preset === 'study' ? 45 : 5), 1, 600);
  const [total, setTotal] = useState(startMinutes * 60);
  const [remaining, setRemaining] = useState(startMinutes * 60);
  const [running, setRunning] = useState(false);
  const [withSound, setWithSound] = useState(true);
  const [custom, setCustom] = useState({ hours: '0', minutes: String(startMinutes), seconds: '0' });
  const deadline = useRef<number>(0);

  useEffect(() => {
    if (!initial?.minutes) return;
    const minutes = clamp(Number(initial.minutes), 1, 600);
    setTotal(minutes * 60);
    setRemaining(minutes * 60);
    setCustom({ hours: '0', minutes: String(minutes), seconds: '0' });
  }, [initial?.minutes]);

  const finish = useCallback(() => {
    setRunning(false);
    setRemaining(0);
    if (withSound) playChime(3);
    success(t('timer.done'));
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('NOVA', { body: t('timer.done'), icon: '/icons/icon-192.png' });
    }
  }, [withSound, success, t]);

  useEffect(() => {
    if (!running) return;

    deadline.current = Date.now() + remaining * 1000;
    const tick = () => {
      const left = Math.max(0, Math.round((deadline.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) finish();
    };

    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
    // `remaining` is intentionally excluded: the deadline is captured on start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, finish]);

  const applyCustom = () => {
    const seconds =
      (Number(custom.hours) || 0) * 3600 + (Number(custom.minutes) || 0) * 60 + (Number(custom.seconds) || 0);
    const clamped = clamp(seconds, 1, 86400);
    setTotal(clamped);
    setRemaining(clamped);
    setRunning(false);
  };

  const setMinutes = (minutes: number) => {
    setTotal(minutes * 60);
    setRemaining(minutes * 60);
    setRunning(false);
    setCustom({ hours: '0', minutes: String(minutes), seconds: '0' });
  };

  const progress = total > 0 ? remaining / total : 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="flex flex-col items-center justify-center gap-6 py-10">
        <Ring progress={progress} tone={remaining === 0 ? 'success' : remaining < 30 ? 'warning' : 'accent'}>
          <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-ink sm:text-5xl">
            {formatDuration(remaining)}
          </span>
          <span className="mt-2 text-[12px] text-muted">
            {running ? t('timer.running') : remaining === 0 ? t('timer.done') : formatDuration(total)}
          </span>
        </Ring>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="primary"
            size="lg"
            icon={running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            disabled={remaining === 0}
            onClick={() => {
              if (!running && 'Notification' in window && Notification.permission === 'default') {
                void Notification.requestPermission();
              }
              setRunning(!running);
            }}
          >
            {running ? t('common.pause') : t('common.start')}
          </Button>
          <Button
            size="lg"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={() => {
              setRunning(false);
              setRemaining(total);
            }}
          >
            {t('common.reset')}
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <span className="mb-2 block text-[13px] font-medium text-muted">{t('timer.presets')}</span>
          <div className="flex flex-wrap gap-2">
            {presets.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setMinutes(minutes)}
                className={`nova-chip ${total === minutes * 60 ? 'border-accent/40 bg-accent/10 text-accent' : ''}`}
              >
                {minutes} {t('common.minutes')}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-line pt-4">
          <span className="mb-2 block text-[13px] font-medium text-muted">{t('timer.setTime')}</span>
          <div className="grid grid-cols-3 gap-2">
            <Input
              label={t('common.hours')}
              value={custom.hours}
              onChange={(event) => setCustom({ ...custom, hours: event.target.value })}
              inputMode="numeric"
            />
            <Input
              label={t('common.minutes')}
              value={custom.minutes}
              onChange={(event) => setCustom({ ...custom, minutes: event.target.value })}
              inputMode="numeric"
            />
            <Input
              label={t('common.seconds')}
              value={custom.seconds}
              onChange={(event) => setCustom({ ...custom, seconds: event.target.value })}
              inputMode="numeric"
            />
          </div>
          <Button block size="sm" className="mt-3" onClick={applyCustom}>
            {t('common.apply')}
          </Button>
        </div>

        <div className="border-t border-line pt-3">
          <Checkbox checked={withSound} onChange={setWithSound} label={t('timer.notify')} />
        </div>
      </Card>
    </div>
  );
}
