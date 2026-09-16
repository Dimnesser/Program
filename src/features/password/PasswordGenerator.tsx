import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCopy } from '@/hooks/useCopy';
import { Card } from '@/components/ui/Card';
import { Checkbox, Slider } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { analyzePassword, generatePassword, type GenerateOptions } from './strength';
import { StrengthMeter } from './StrengthMeter';
import { clamp, cn } from '@/lib/utils';
import type { ToolProps } from '@/types';

export default function PasswordGenerator({ initial }: ToolProps) {
  const { t } = useI18n();
  const { copy, isCopied } = useCopy();

  const [options, setOptions] = useState<GenerateOptions>({
    length: clamp(Number(initial?.length) || 20, 4, 128),
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: false,
  });
  const [password, setPassword] = useState('');

  const noSets = !options.uppercase && !options.lowercase && !options.numbers && !options.symbols;

  const regenerate = useCallback(() => {
    if (noSets) {
      setPassword('');
      return;
    }
    setPassword(generatePassword(options));
  }, [options, noSets]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const report = useMemo(() => analyzePassword(password), [password]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="flex flex-col gap-5">
        <div
          className={cn(
            'flex min-h-[104px] items-center justify-center rounded-2xl border border-line bg-surface/60 px-4 py-6',
            noSets && 'border-danger/30 bg-danger/[0.05]',
          )}
        >
          {noSets ? (
            <p className="text-center text-[13px] text-danger">{t('pass.noSets')}</p>
          ) : (
            <p
              className="break-all text-center font-mono text-xl font-medium tracking-tight text-ink sm:text-2xl"
              aria-live="polite"
            >
              {password}
            </p>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="primary"
            block
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={regenerate}
            disabled={noSets}
          >
            {t('common.generate')}
          </Button>
          <Button
            block
            disabled={!password}
            onClick={() => copy(password, 'pw')}
            icon={isCopied('pw') ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            className={cn(isCopied('pw') && 'text-success')}
          >
            {isCopied('pw') ? t('common.copied') : t('common.copy')}
          </Button>
        </div>

        <StrengthMeter report={report} />

        <p className="flex items-center gap-2 rounded-xl border border-line bg-surface/50 px-3.5 py-3 text-[12px] leading-relaxed text-muted">
          <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
          {t('pass.notStored')}
        </p>
      </Card>

      <Card className="space-y-4">
        <Slider
          label={t('pass.length')}
          value={options.length}
          min={4}
          max={64}
          onChange={(length) => setOptions((current) => ({ ...current, length }))}
        />

        <div className="space-y-0.5 border-t border-line pt-3">
          <Checkbox
            checked={options.uppercase}
            onChange={(checked) => setOptions((current) => ({ ...current, uppercase: checked }))}
            label={t('pass.uppercase')}
          />
          <Checkbox
            checked={options.lowercase}
            onChange={(checked) => setOptions((current) => ({ ...current, lowercase: checked }))}
            label={t('pass.lowercase')}
          />
          <Checkbox
            checked={options.numbers}
            onChange={(checked) => setOptions((current) => ({ ...current, numbers: checked }))}
            label={t('pass.numbers')}
          />
          <Checkbox
            checked={options.symbols}
            onChange={(checked) => setOptions((current) => ({ ...current, symbols: checked }))}
            label={t('pass.symbols')}
          />
          <Checkbox
            checked={options.excludeSimilar}
            onChange={(checked) => setOptions((current) => ({ ...current, excludeSimilar: checked }))}
            label={t('pass.excludeSimilar')}
          />
        </div>

        <div className="border-t border-line pt-4">
          <PrivacyBadge />
        </div>
      </Card>
    </div>
  );
}
