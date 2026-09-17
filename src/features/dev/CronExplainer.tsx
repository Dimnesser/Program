import { useMemo, useState } from 'react';
import { AlarmClock, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { CopyButton } from '@/components/ui/CopyButton';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { cn } from '@/lib/utils';
import type { ToolProps } from '@/types';

interface FieldSpec {
  name: string;
  min: number;
  max: number;
  names?: string[];
}

const FIELDS: FieldSpec[] = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'dayOfMonth', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12, names: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] },
  { name: 'dayOfWeek', min: 0, max: 6, names: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] },
];

/** Expands one cron field into the concrete values it matches. */
function expandField(expression: string, spec: FieldSpec): number[] | null {
  const values = new Set<number>();

  for (const part of expression.split(',')) {
    const [rangePart, stepPart] = part.split('/');
    const step = stepPart === undefined ? 1 : Number(stepPart);
    if (!Number.isInteger(step) || step < 1) return null;

    let from: number;
    let to: number;

    if (rangePart === '*') {
      from = spec.min;
      to = spec.max;
    } else {
      const bounds = rangePart.split('-');
      const parseValue = (raw: string): number | null => {
        const lower = raw.trim().toLowerCase();
        if (spec.names) {
          const index = spec.names.indexOf(lower);
          if (index >= 0) return spec.min === 1 ? index + 1 : index;
        }
        const numeric = Number(lower);
        if (!Number.isInteger(numeric)) return null;
        // Both 0 and 7 mean Sunday in cron.
        if (spec.name === 'dayOfWeek' && numeric === 7) return 0;
        return numeric;
      };

      const start = parseValue(bounds[0]);
      if (start === null) return null;
      from = start;
      if (bounds.length === 1) {
        to = stepPart === undefined ? start : spec.max;
      } else {
        const end = parseValue(bounds[1]);
        if (end === null) return null;
        to = end;
      }
    }

    if (from < spec.min || to > spec.max || from > to) return null;
    for (let value = from; value <= to; value += step) values.add(value);
  }

  return values.size > 0 ? [...values].sort((a, b) => a - b) : null;
}

interface ParsedCron {
  fields: Record<string, number[]>;
  raw: string[];
}

function parseCron(expression: string): ParsedCron | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const fields: Record<string, number[]> = {};
  for (let i = 0; i < FIELDS.length; i += 1) {
    const expanded = expandField(parts[i], FIELDS[i]);
    if (!expanded) return null;
    fields[FIELDS[i].name] = expanded;
  }
  return { fields, raw: parts };
}

/** Walks forward minute by minute to find the next matching times. */
function nextRuns(parsed: ParsedCron, count: number): Date[] {
  const runs: Date[] = [];
  const cursor = new Date();
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  const limit = 60 * 24 * 366 * 2; // two years of minutes is enough for any 5-field cron
  for (let i = 0; i < limit && runs.length < count; i += 1) {
    const matchesDom = parsed.fields.dayOfMonth.includes(cursor.getDate());
    const matchesDow = parsed.fields.dayOfWeek.includes(cursor.getDay());
    const domRestricted = parsed.raw[2] !== '*';
    const dowRestricted = parsed.raw[4] !== '*';
    // Cron ORs the two day fields when both are restricted.
    const dayMatches =
      domRestricted && dowRestricted ? matchesDom || matchesDow : domRestricted ? matchesDom : dowRestricted ? matchesDow : true;

    if (
      parsed.fields.minute.includes(cursor.getMinutes()) &&
      parsed.fields.hour.includes(cursor.getHours()) &&
      parsed.fields.month.includes(cursor.getMonth() + 1) &&
      dayMatches
    ) {
      runs.push(new Date(cursor));
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return runs;
}

const PRESETS = [
  { expression: '* * * * *', key: 'cron.everyMinute' },
  { expression: '*/15 * * * *', key: 'cron.every15' },
  { expression: '0 * * * *', key: 'cron.hourly' },
  { expression: '0 9 * * 1-5', key: 'cron.weekdays9' },
  { expression: '0 0 * * 0', key: 'cron.weekly' },
  { expression: '0 3 1 * *', key: 'cron.monthly' },
] as const;

export default function CronExplainer({ initial }: ToolProps) {
  const { t, locale } = useI18n();
  const [expression, setExpression] = useState(initial?.expression ?? '0 9 * * 1-5');

  const parsed = useMemo(() => (expression.trim() ? parseCron(expression) : null), [expression]);
  const runs = useMemo(() => (parsed ? nextRuns(parsed, 8) : []), [parsed]);

  const summarize = (name: string, values: number[], raw: string) => {
    if (raw === '*') return t('cron.any');
    if (values.length > 12) return `${values.length} ${t('cron.values')}`;
    if (name === 'dayOfWeek') {
      const days = values.map((value) =>
        new Date(Date.UTC(2024, 0, 7 + value)).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' }),
      );
      return days.join(', ');
    }
    if (name === 'month') {
      return values
        .map((value) => new Date(Date.UTC(2024, value - 1, 1)).toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' }))
        .join(', ');
    }
    return values.join(', ');
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_1fr]">
      <Card className="space-y-4">
        <Input
          label={t('cron.expression')}
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          className="font-mono text-lg"
          invalid={Boolean(expression.trim()) && !parsed}
          spellCheck={false}
          placeholder="0 9 * * 1-5"
        />

        {expression.trim() && !parsed ? (
          <p className="flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/[0.05] px-3.5 py-2.5 text-[13px] text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t('cron.invalid')}
          </p>
        ) : null}

        <div className="grid grid-cols-5 gap-1.5 text-center">
          {['cron.minute', 'cron.hour', 'cron.dom', 'cron.month', 'cron.dow'].map((key, index) => (
            <div key={key} className="rounded-lg border border-line bg-surface/60 px-1 py-2">
              <div className="font-mono text-[13px] text-accent">{parsed?.raw[index] ?? '—'}</div>
              <div className="mt-0.5 truncate text-[10px] text-faint">{t(key as 'cron.minute')}</div>
            </div>
          ))}
        </div>

        <div>
          <span className="mb-2 block text-[13px] font-medium text-muted">{t('cron.presets')}</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.expression}
                type="button"
                onClick={() => setExpression(preset.expression)}
                className={cn('nova-chip', expression === preset.expression && 'border-accent/40 bg-accent/10 text-accent')}
              >
                {t(preset.key)}
              </button>
            ))}
          </div>
        </div>

        <PrivacyBadge />
      </Card>

      <div className="space-y-5">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
            <AlarmClock className="h-4 w-4 text-accent" />
            {t('cron.breakdown')}
          </h2>
          {parsed ? (
            <dl className="divide-y divide-line">
              {FIELDS.map((field, index) => (
                <div key={field.name} className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="shrink-0 text-[12px] uppercase tracking-[0.06em] text-faint">
                    {t(`cron.${['minute', 'hour', 'dom', 'month', 'dow'][index]}` as 'cron.minute')}
                  </dt>
                  <dd className="truncate text-right text-[13px] text-ink">
                    {summarize(field.name, parsed.fields[field.name], parsed.raw[index])}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="py-6 text-center text-[13px] text-muted">{t('cron.invalid')}</p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[13px] font-semibold text-ink">{t('cron.nextRuns')}</h2>
            {runs.length > 0 ? (
              <CopyButton
                value={runs.map((run) => run.toLocaleString(locale)).join('\n')}
                size="xs"
                variant="ghost"
                compact
              />
            ) : null}
          </div>
          {runs.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">{t('cron.noRuns')}</p>
          ) : (
            <ol className="space-y-1.5">
              {runs.map((run, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface/50 px-3 py-2"
                >
                  <span className="font-mono text-[13px] text-ink">
                    {run.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  {index === 0 ? <Badge tone="accent">{t('cron.next')}</Badge> : null}
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
