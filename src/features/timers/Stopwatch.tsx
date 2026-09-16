import { useEffect, useRef, useState } from 'react';
import { Flag, Pause, Play, RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';

const format = (ms: number) => {
  const total = Math.max(0, ms);
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const hundredths = Math.floor((total % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
};

export default function Stopwatch() {
  const { t } = useI18n();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const origin = useRef(0);
  const frame = useRef<number>();

  useEffect(() => {
    if (!running) return;

    origin.current = performance.now() - elapsed;
    const tick = () => {
      setElapsed(performance.now() - origin.current);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
    // `elapsed` is read once when the run starts; adding it would restart the loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const fastest = laps.length > 1 ? Math.min(...laps) : -1;
  const slowest = laps.length > 1 ? Math.max(...laps) : -1;
  const lapTotal = laps.reduce((sum, lap) => sum + lap, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="flex flex-col items-center justify-center gap-8 py-14">
        <p className="font-mono text-5xl font-semibold tabular-nums tracking-tight text-ink sm:text-7xl" aria-live="off">
          {format(elapsed)}
        </p>

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
            icon={<Flag className="h-4 w-4" />}
            disabled={!running}
            onClick={() => setLaps((current) => [...current, elapsed - lapTotal])}
          >
            {t('stopwatch.lap')}
          </Button>
          <Button
            size="lg"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={() => {
              setRunning(false);
              setElapsed(0);
              setLaps([]);
            }}
          >
            {t('common.reset')}
          </Button>
        </div>
      </Card>

      <Card className="max-h-[520px] overflow-y-auto">
        <h2 className="mb-3 text-[13px] font-semibold text-ink">{t('stopwatch.laps')}</h2>
        {laps.length === 0 ? (
          <EmptyState compact icon={<Flag className="h-4 w-4" />} title={t('stopwatch.noLaps')} className="border-0" />
        ) : (
          <ul className="space-y-1">
            {laps
              .map((lap, index) => ({ lap, index }))
              .reverse()
              .map(({ lap, index }) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface/50 px-3 py-2"
                >
                  <span className="text-[13px] text-muted">
                    {t('stopwatch.lap')} {index + 1}
                  </span>
                  <span
                    className={`font-mono text-[13px] font-medium ${
                      lap === fastest ? 'text-success' : lap === slowest ? 'text-warning' : 'text-ink'
                    }`}
                  >
                    {format(lap)}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
