import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { StorageKeys } from '@/lib/storage';
import { Card } from '@/components/ui/Card';
import { Input, Segmented } from '@/components/ui/Field';
import { Button, IconButton } from '@/components/ui/Button';
import { formatDuration, formatSpan, todayKey, cn } from '@/lib/utils';
import { playChime } from './sound';
import { Ring } from './Ring';
import type { PomodoroStats } from '@/types';

type Mode = 'classic' | 'long' | 'custom';
type Phase = 'focus' | 'break';

const MODES: Record<Mode, { focus: number; rest: number }> = {
  classic: { focus: 25, rest: 5 },
  long: { focus: 50, rest: 10 },
  custom: { focus: 35, rest: 7 },
};

export default function Pomodoro() {
  const { t } = useI18n();
  const { success } = useToast();
  const [stats, setStats] = useLocalStorage<PomodoroStats>(StorageKeys.pomodoro, {
    date: todayKey(),
    sessions: 0,
    focusSeconds: 0,
  });

  const [mode, setMode] = useState<Mode>('classic');
  const [custom, setCustom] = useState({ focus: '35', rest: '7' });
  const [phase, setPhase] = useState<Phase>('focus');
  const [remaining, setRemaining] = useState(MODES.classic.focus * 60);
  const [running, setRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const deadline = useRef(0);

  const durations =
    mode === 'custom'
      ? {
          focus: Math.max(1, Number(custom.focus) || 35),
          rest: Math.max(1, Number(custom.rest) || 7),
        }
      : MODES[mode];

  const total = (phase === 'focus' ? durations.focus : durations.rest) * 60;

  /* Reset the daily counters when the date rolls over. */
  useEffect(() => {
    if (stats.date !== todayKey()) {
      setStats({ date: todayKey(), sessions: 0, focusSeconds: 0 });
    }
  }, [stats.date, setStats]);

  const switchPhase = useCallback(
    (next: Phase, announce = true) => {
      setPhase(next);
      const seconds = (next === 'focus' ? durations.focus : durations.rest) * 60;
      setRemaining(seconds);
      setRunning(false);
      if (announce) success(next === 'break' ? t('pomo.focusDone') : t('pomo.breakDone'));
    },
    [durations, success, t],
  );

  const complete = useCallback(() => {
    playChime(3);
    if (phase === 'focus') {
      setStats((current) => ({
        date: todayKey(),
        sessions: current.date === todayKey() ? current.sessions + 1 : 1,
        focusSeconds: (current.date === todayKey() ? current.focusSeconds : 0) + durations.focus * 60,
      }));
      switchPhase('break');
    } else {
      switchPhase('focus');
    }
  }, [phase, durations.focus, setStats, switchPhase]);

  useEffect(() => {
    if (!running) return;

    deadline.current = Date.now() + remaining * 1000;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.round((deadline.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) complete();
    }, 250);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, complete]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullscreen]);

  const changeMode = (next: Mode) => {
    setMode(next);
    const seconds =
      (next === 'custom' ? Math.max(1, Number(custom.focus) || 35) : MODES[next].focus) * 60;
    setPhase('focus');
    setRemaining(seconds);
    setRunning(false);
  };

  const clock = (
    <>
      <span
        className={cn(
          'font-mono font-semibold tabular-nums tracking-tight text-ink',
          fullscreen ? 'text-6xl sm:text-8xl' : 'text-4xl sm:text-5xl',
        )}
      >
        {formatDuration(remaining)}
      </span>
      <span className={cn('mt-2 font-medium', phase === 'focus' ? 'text-accent' : 'text-success')}>
        {phase === 'focus' ? t('pomo.focus') : t('pomo.break')}
      </span>
    </>
  );

  const controls = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button
        variant="primary"
        size="lg"
        icon={running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        onClick={() => setRunning(!running)}
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
      <Button
        size="lg"
        icon={<SkipForward className="h-4 w-4" />}
        onClick={() => switchPhase(phase === 'focus' ? 'break' : 'focus', false)}
      >
        {t('pomo.skip')}
      </Button>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-10 bg-bg p-6">
        <IconButton
          label={t('pomo.exitFullscreen')}
          className="absolute right-5 top-5"
          onClick={() => setFullscreen(false)}
        >
          <Minimize2 className="h-4 w-4" />
        </IconButton>
        <Ring progress={total > 0 ? remaining / total : 0} tone={phase === 'focus' ? 'accent' : 'success'} className="max-w-[420px]">
          {clock}
        </Ring>
        {controls}
        <p className="text-[13px] text-muted">
          {t('pomo.sessionsToday')}: <span className="font-mono text-ink">{stats.sessions}</span> ·{' '}
          {t('pomo.focusTime')}: <span className="font-mono text-ink">{formatSpan(stats.focusSeconds)}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="relative flex flex-col items-center justify-center gap-6 py-10">
        <IconButton label={t('pomo.fullscreen')} className="absolute right-4 top-4" onClick={() => setFullscreen(true)}>
          <Maximize2 className="h-4 w-4" />
        </IconButton>
        <Ring progress={total > 0 ? remaining / total : 0} tone={phase === 'focus' ? 'accent' : 'success'}>
          {clock}
        </Ring>
        {controls}
      </Card>

      <div className="space-y-5">
        <Card className="space-y-4">
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('pomo.mode')}</span>
            <Segmented
              value={mode}
              onChange={changeMode}
              ariaLabel={t('pomo.mode')}
              options={[
                { value: 'classic', label: '25 / 5' },
                { value: 'long', label: '50 / 10' },
                { value: 'custom', label: t('common.custom') },
              ]}
            />
          </div>

          {mode === 'custom' ? (
            <div className="grid grid-cols-2 gap-2">
              <Input
                label={t('pomo.focus')}
                value={custom.focus}
                onChange={(event) => setCustom({ ...custom, focus: event.target.value })}
                inputMode="numeric"
              />
              <Input
                label={t('pomo.break')}
                value={custom.rest}
                onChange={(event) => setCustom({ ...custom, rest: event.target.value })}
                inputMode="numeric"
              />
            </div>
          ) : null}

          {mode === 'custom' ? (
            <Button
              block
              size="sm"
              onClick={() => {
                setPhase('focus');
                setRemaining(Math.max(1, Number(custom.focus) || 35) * 60);
                setRunning(false);
              }}
            >
              {t('common.apply')}
            </Button>
          ) : null}
        </Card>

        <Card>
          <h2 className="mb-3 text-[13px] font-semibold text-ink">{t('common.today')}</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-line bg-surface/60 px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.06em] text-faint">{t('pomo.sessionsToday')}</div>
              <div className="mt-0.5 font-mono text-2xl font-semibold text-ink">{stats.sessions}</div>
            </div>
            <div className="rounded-xl border border-line bg-surface/60 px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.06em] text-faint">{t('pomo.focusTime')}</div>
              <div className="mt-0.5 font-mono text-2xl font-semibold text-ink">{formatSpan(stats.focusSeconds)}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
