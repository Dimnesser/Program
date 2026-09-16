import { useMemo, useState } from 'react';
import { Eye, EyeOff, Lightbulb } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/Button';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { analyzePassword } from './strength';
import { StrengthMeter } from './StrengthMeter';

export default function PasswordStrength() {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);

  const report = useMemo(() => analyzePassword(password), [password]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="space-y-5">
        <Input
          label={t('pass.strength')}
          type={visible ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t('pass.enterPassword')}
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
          addon={
            <IconButton
              label={visible ? t('common.close') : t('common.preview')}
              size="sm"
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </IconButton>
          }
        />

        <StrengthMeter report={report} />

        <PrivacyBadge />
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <Lightbulb className="h-4 w-4 text-warning" />
          {t('pass.suggestions')}
        </h2>
        <ul className="mt-3 space-y-2">
          {report.tips.map((tip) => (
            <li
              key={tip}
              className="flex items-start gap-2.5 rounded-xl border border-line bg-surface/50 px-3.5 py-2.5 text-[13px] leading-relaxed text-muted"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {t(tip)}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
