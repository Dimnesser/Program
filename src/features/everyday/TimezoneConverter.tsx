import { useMemo, useState } from 'react';
import { Globe2, Plus, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Field';
import { Button, IconButton } from '@/components/ui/Button';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { cn } from '@/lib/utils';

const FALLBACK_ZONES = [
  'Europe/Kyiv', 'Europe/London', 'Europe/Berlin', 'Europe/Warsaw', 'Europe/Lisbon',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo',
  'Asia/Dubai', 'Asia/Jerusalem', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Singapore',
  'Australia/Sydney', 'Pacific/Auckland', 'UTC',
];

/** Milliseconds a zone is ahead of UTC at a given instant. */
function zoneOffset(instant: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(instant)) parts[part.type] = part.value;
  const asUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  );
  return asUtc - instant.getTime();
}

/**
 * Converts a wall-clock reading in `timeZone` to the real instant. Two passes
 * settle the offset correctly across daylight-saving boundaries.
 */
function wallClockToInstant(value: string, timeZone: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number) as unknown as number[];
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let instant = guess - zoneOffset(new Date(guess), timeZone);
  instant = guess - zoneOffset(new Date(instant), timeZone);
  return new Date(instant);
}

const pad = (value: number) => String(value).padStart(2, '0');

export default function TimezoneConverter() {
  const { t, locale } = useI18n();

  const zones = useMemo(() => {
    const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
    const list = typeof supported === 'function' ? supported('timeZone') : FALLBACK_ZONES;
    return list.length > 0 ? list : FALLBACK_ZONES;
  }, []);

  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const now = new Date();
  const [source, setSource] = useState(localZone);
  const [value, setValue] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
  );
  const [targets, setTargets] = useState<string[]>(() =>
    ['Europe/Kyiv', 'Europe/London', 'America/New_York', 'Asia/Tokyo'].filter((zone) => zone !== localZone).slice(0, 4),
  );

  const instant = useMemo(() => wallClockToInstant(value, source), [value, source]);

  const rows = useMemo(() => {
    if (!instant) return [];
    const sourceOffset = zoneOffset(instant, source);
    return targets.map((zone) => {
      const offset = zoneOffset(instant, zone);
      const deltaHours = (offset - sourceOffset) / 3600000;
      const hour = Number(
        new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: '2-digit', hour12: false }).format(instant),
      );
      return {
        zone,
        time: new Intl.DateTimeFormat(locale, {
          timeZone: zone, dateStyle: 'medium', timeStyle: 'short',
        }).format(instant),
        offsetLabel: `UTC${offset >= 0 ? '+' : '−'}${pad(Math.floor(Math.abs(offset) / 3600000))}:${pad(
          Math.round((Math.abs(offset) % 3600000) / 60000),
        )}`,
        delta: deltaHours,
        night: hour < 7 || hour >= 22,
      };
    });
  }, [instant, targets, source, locale]);

  const options = zones.map((zone) => ({ value: zone, label: zone.replace(/_/g, ' ') }));

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="space-y-4">
        <Select label={t('tz.source')} value={source} onChange={(event) => setSource(event.target.value)} options={options} />
        <Input
          label={t('tz.moment')}
          type="datetime-local"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <Button
          size="sm"
          block
          onClick={() => {
            const current = new Date();
            setValue(
              `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}T${pad(
                current.getHours(),
              )}:${pad(current.getMinutes())}`,
            );
          }}
        >
          {t('ts.now')}
        </Button>

        <div className="border-t border-line pt-4">
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('tz.addZone')}</span>
          <Select
            value=""
            aria-label={t('tz.addZone')}
            onChange={(event) => {
              const zone = event.target.value;
              if (zone && !targets.includes(zone)) setTargets([...targets, zone]);
            }}
            options={[{ value: '', label: t('tz.addZone') }, ...options]}
          />
        </div>

        <PrivacyBadge />
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
          <Globe2 className="h-4 w-4 text-accent" />
          {t('tz.result')}
        </h2>

        {!instant ? (
          <p className="py-10 text-center text-[13px] text-muted">{t('error.invalidInput')}</p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-muted">{t('tz.addZone')}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.zone}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-3 transition-colors',
                  row.night ? 'bg-surface/40' : 'bg-surface/70',
                )}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-ink">{row.zone.replace(/_/g, ' ')}</span>
                    <span aria-hidden="true" className="text-[11px]">{row.night ? '🌙' : '☀️'}</span>
                  </span>
                  <span className="mt-0.5 block text-[11px] text-faint">
                    {row.offsetLabel} · {row.delta === 0 ? '±0' : `${row.delta > 0 ? '+' : ''}${row.delta}`} {t('common.hours')}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-[13px] text-ink">{row.time}</span>
                  <IconButton
                    label={t('common.delete')}
                    size="sm"
                    variant="ghost"
                    onClick={() => setTargets(targets.filter((zone) => zone !== row.zone))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </IconButton>
                </span>
              </li>
            ))}
          </ul>
        )}

        {targets.length < 8 ? (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-faint">
            <Plus className="h-3 w-3" />
            {t('tz.addHint')}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
