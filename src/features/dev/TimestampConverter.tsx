import { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Input, Segmented } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import type { ToolProps } from '@/types';

type Unit = 'seconds' | 'milliseconds';

const pad = (value: number) => String(value).padStart(2, '0');
const toLocalInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}`;

export default function TimestampConverter({ initial }: ToolProps) {
  const { t, locale } = useI18n();
  const [unit, setUnit] = useState<Unit>('seconds');
  const [stamp, setStamp] = useState(initial?.timestamp ?? String(Math.floor(Date.now() / 1000)));
  const [dateValue, setDateValue] = useState(toLocalInput(new Date()));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (initial?.timestamp) setStamp(initial.timestamp);
  }, [initial?.timestamp]);

  const date = useMemo(() => {
    const numeric = Number(stamp);
    if (!stamp.trim() || !Number.isFinite(numeric)) return null;
    const milliseconds = unit === 'seconds' ? numeric * 1000 : numeric;
    const parsed = new Date(milliseconds);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [stamp, unit]);

  const relative = useMemo(() => {
    if (!date) return '';
    const diff = date.getTime() - now;
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const units: [number, Intl.RelativeTimeFormatUnit][] = [
      [60000, 'second'],
      [3600000, 'minute'],
      [86400000, 'hour'],
      [2629800000, 'day'],
      [31557600000, 'month'],
    ];
    const divisors: Record<string, number> = {
      second: 1000,
      minute: 60000,
      hour: 3600000,
      day: 86400000,
      month: 2629800000,
      year: 31557600000,
    };
    for (const [limit, candidate] of units) {
      if (Math.abs(diff) < limit) return formatter.format(Math.round(diff / divisors[candidate]), candidate);
    }
    return formatter.format(Math.round(diff / divisors.year), 'year');
  }, [date, now, locale]);

  const rows = date
    ? [
        { label: t('ts.local'), value: date.toLocaleString(locale, { dateStyle: 'full', timeStyle: 'medium' }) },
        { label: t('ts.utc'), value: date.toUTCString() },
        { label: t('ts.iso'), value: date.toISOString() },
        { label: t('ts.relative'), value: relative },
        { label: `${t('ts.unix')} (s)`, value: String(Math.floor(date.getTime() / 1000)) },
        { label: `${t('ts.unix')} (ms)`, value: String(date.getTime()) },
      ]
    : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_1fr]">
      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/60 px-3.5 py-2.5">
          <span className="flex items-center gap-2 text-[13px] text-muted">
            <Clock className="h-3.5 w-3.5" />
            {t('ts.now')}
          </span>
          <button
            type="button"
            onClick={() => {
              setStamp(String(unit === 'seconds' ? Math.floor(Date.now() / 1000) : Date.now()));
              setDateValue(toLocalInput(new Date()));
            }}
            className="font-mono text-[13px] font-medium text-ink transition-colors hover:text-accent"
          >
            {Math.floor(now / 1000)}
          </button>
        </div>

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('ts.unit')}</span>
          <Segmented
            value={unit}
            onChange={setUnit}
            ariaLabel={t('ts.unit')}
            options={[
              { value: 'seconds', label: t('ts.seconds') },
              { value: 'milliseconds', label: t('ts.milliseconds') },
            ]}
          />
        </div>

        <Input
          label={t('ts.unix')}
          value={stamp}
          onChange={(event) => setStamp(event.target.value)}
          inputMode="numeric"
          className="font-mono"
          invalid={stamp.trim() !== '' && !date}
        />

        <div className="border-t border-line pt-4">
          <Input
            label={t('ts.date')}
            type="datetime-local"
            step={1}
            value={dateValue}
            onChange={(event) => {
              setDateValue(event.target.value);
              const parsed = new Date(event.target.value);
              if (!Number.isNaN(parsed.getTime())) {
                setStamp(String(unit === 'seconds' ? Math.floor(parsed.getTime() / 1000) : parsed.getTime()));
              }
            }}
          />
          <Button
            size="sm"
            className="mt-3"
            onClick={() => {
              const current = new Date();
              setDateValue(toLocalInput(current));
              setStamp(String(unit === 'seconds' ? Math.floor(current.getTime() / 1000) : current.getTime()));
            }}
          >
            {t('ts.now')}
          </Button>
        </div>
      </Card>

      <Card>
        {date ? (
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="shrink-0 text-[12px] uppercase tracking-[0.06em] text-faint">{row.label}</span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-mono text-[13px] text-ink">{row.value}</span>
                  <CopyButton value={row.value} size="xs" variant="ghost" compact />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-[13px] text-muted">{t('error.invalidInput')}</p>
        )}
      </Card>
    </div>
  );
}
