import { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Input, Segmented, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { PrivacyBadge } from '@/components/PrivacyBadge';

type Mode = 'between' | 'add' | 'age';

const pad = (value: number) => String(value).padStart(2, '0');
const toInput = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const DAY = 86400000;

/** Calendar-aware difference: months and years respect varying month lengths. */
function preciseDiff(from: Date, to: Date) {
  const [start, end] = from <= to ? [from, to] : [to, from];
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

function countWeekdays(from: Date, to: Date): number {
  const [start, end] = from <= to ? [from, to] : [to, from];
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export default function DateCalculator() {
  const { t, locale } = useI18n();
  const today = new Date();
  const [mode, setMode] = useState<Mode>('between');
  const [from, setFrom] = useState(toInput(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [to, setTo] = useState(toInput(today));
  const [birth, setBirth] = useState('2000-01-01');
  const [amount, setAmount] = useState('30');
  const [unit, setUnit] = useState('days');
  const [direction, setDirection] = useState<'add' | 'sub'>('add');

  const between = useMemo(() => {
    const start = new Date(from);
    const end = new Date(to);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    const totalDays = Math.round((end.getTime() - start.getTime()) / DAY);
    return {
      totalDays,
      absDays: Math.abs(totalDays),
      precise: preciseDiff(start, end),
      weekdays: Math.abs(totalDays) > 3650 ? null : countWeekdays(start, end),
      weeks: Math.abs(totalDays) / 7,
      hours: Math.abs(totalDays) * 24,
    };
  }, [from, to]);

  const shifted = useMemo(() => {
    const start = new Date(from);
    const value = Number(amount);
    if (Number.isNaN(start.getTime()) || !Number.isFinite(value)) return null;
    const sign = direction === 'add' ? 1 : -1;
    const result = new Date(start);
    if (unit === 'days') result.setDate(result.getDate() + sign * value);
    else if (unit === 'weeks') result.setDate(result.getDate() + sign * value * 7);
    else if (unit === 'months') result.setMonth(result.getMonth() + sign * value);
    else result.setFullYear(result.getFullYear() + sign * value);
    return result;
  }, [from, amount, unit, direction]);

  const age = useMemo(() => {
    const start = new Date(birth);
    if (Number.isNaN(start.getTime())) return null;
    const now = new Date();
    const precise = preciseDiff(start, now);
    const next = new Date(now.getFullYear(), start.getMonth(), start.getDate());
    if (next < now) next.setFullYear(next.getFullYear() + 1);
    return {
      precise,
      totalDays: Math.floor((now.getTime() - start.getTime()) / DAY),
      untilBirthday: Math.ceil((next.getTime() - now.getTime()) / DAY),
      weekday: start.toLocaleDateString(locale, { weekday: 'long' }),
    };
  }, [birth, locale]);

  const formatDate = (date: Date) => date.toLocaleDateString(locale, { dateStyle: 'full' });

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_1fr]">
      <Card className="space-y-4">
        <Segmented
          value={mode}
          onChange={setMode}
          ariaLabel={t('common.options')}
          options={[
            { value: 'between', label: t('date.between') },
            { value: 'add', label: t('date.shift') },
            { value: 'age', label: t('date.age') },
          ]}
        />

        {mode === 'age' ? (
          <Input label={t('date.birth')} type="date" value={birth} onChange={(event) => setBirth(event.target.value)} />
        ) : (
          <Input label={t('common.from')} type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        )}

        {mode === 'between' ? (
          <Input label={t('common.to')} type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        ) : null}

        {mode === 'add' ? (
          <>
            <Segmented
              value={direction}
              onChange={setDirection}
              ariaLabel={t('date.shift')}
              options={[
                { value: 'add', label: '+' },
                { value: 'sub', label: '−' },
              ]}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('common.value')}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="numeric"
              />
              <Select
                label={t('ts.unit')}
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                options={[
                  { value: 'days', label: t('unit.time') },
                  { value: 'weeks', label: t('date.weeks') },
                  { value: 'months', label: t('date.months') },
                  { value: 'years', label: t('date.years') },
                ]}
              />
            </div>
          </>
        ) : null}

        {mode !== 'age' ? (
          <Button size="sm" onClick={() => setFrom(toInput(new Date()))}>
            {t('ts.now')}
          </Button>
        ) : null}

        <PrivacyBadge />
      </Card>

      <Card>
        {mode === 'between' && between ? (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-faint">{t('date.difference')}</p>
              <p className="mt-1 font-mono text-4xl font-semibold text-ink">{between.absDays}</p>
              <p className="mt-1 text-[13px] text-muted">{t('date.days')}</p>
            </div>
            <dl className="divide-y divide-line border-t border-line pt-2 text-[13px]">
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted">{t('date.precise')}</dt>
                <dd className="font-mono text-ink">
                  {between.precise.years}{t('date.y')} {between.precise.months}{t('date.m')} {between.precise.days}{t('date.d')}
                </dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted">{t('date.weeks')}</dt>
                <dd className="font-mono text-ink">{between.weeks.toFixed(1)}</dd>
              </div>
              {between.weekdays !== null ? (
                <div className="flex justify-between gap-3 py-2">
                  <dt className="text-muted">{t('date.weekdays')}</dt>
                  <dd className="font-mono text-ink">{between.weekdays}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted">{t('common.hours')}</dt>
                <dd className="font-mono text-ink">{between.hours}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {mode === 'add' && shifted ? (
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-faint">{t('common.result')}</p>
            <p className="font-mono text-2xl font-semibold text-ink sm:text-3xl">{toInput(shifted)}</p>
            <p className="text-[14px] text-muted">{formatDate(shifted)}</p>
            <CopyButton value={toInput(shifted)} size="sm" />
          </div>
        ) : null}

        {mode === 'age' && age ? (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-faint">{t('date.age')}</p>
              <p className="mt-1 font-mono text-4xl font-semibold text-ink">{age.precise.years}</p>
              <p className="mt-1 text-[13px] text-muted">
                {age.precise.months} {t('date.m')} · {age.precise.days} {t('date.d')}
              </p>
            </div>
            <dl className="divide-y divide-line border-t border-line pt-2 text-[13px]">
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted">{t('date.days')}</dt>
                <dd className="font-mono text-ink">{age.totalDays}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted">{t('date.untilBirthday')}</dt>
                <dd className="font-mono text-ink">{age.untilBirthday}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted">{t('date.bornOn')}</dt>
                <dd className="font-mono capitalize text-ink">{age.weekday}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {((mode === 'between' && !between) || (mode === 'add' && !shifted) || (mode === 'age' && !age)) ? (
          <p className="flex h-full items-center justify-center gap-2 py-10 text-[13px] text-muted">
            <CalendarDays className="h-4 w-4" />
            {t('error.invalidInput')}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
