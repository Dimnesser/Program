import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { StrengthReport } from './strength';
import { formatCrackTime } from './strength';

const LABELS = ['pass.weak', 'pass.weak', 'pass.medium', 'pass.strong', 'pass.veryStrong'] as const;
const TONES = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-success', 'bg-success'];
const TEXT = ['text-danger', 'text-danger', 'text-warning', 'text-success', 'text-success'];

export function StrengthMeter({ report, showDetails = true }: { report: StrengthReport; showDetails?: boolean }) {
  const { t, locale } = useI18n();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-muted">{t('pass.strength')}</span>
        <span className={cn('text-[13px] font-semibold', TEXT[report.score])}>{t(LABELS[report.score])}</span>
      </div>

      <div className="flex gap-1.5" role="meter" aria-valuenow={report.score} aria-valuemin={0} aria-valuemax={4}>
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              index < Math.max(report.score, 1) && report.entropy > 0 ? TONES[report.score] : 'bg-line',
            )}
          />
        ))}
      </div>

      {showDetails ? (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
          <div className="rounded-lg border border-line bg-surface/60 px-3 py-2">
            <dt className="text-faint">{t('pass.entropy')}</dt>
            <dd className="mt-0.5 font-mono text-[13px] font-medium text-ink">{report.entropy.toFixed(1)} bits</dd>
          </div>
          <div className="rounded-lg border border-line bg-surface/60 px-3 py-2">
            <dt className="text-faint">{t('pass.crackTime')}</dt>
            <dd className="mt-0.5 truncate font-mono text-[13px] font-medium text-ink">
              {formatCrackTime(report.crackSeconds, locale, t('pass.instant'))}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
