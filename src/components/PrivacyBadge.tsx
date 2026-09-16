import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function PrivacyBadge({ className, asLink = true }: { className?: string; asLink?: boolean }) {
  const { t } = useI18n();
  const content = (
    <>
      <Lock className="h-3 w-3 shrink-0" />
      <span className="truncate">{t('privacy.badge')}</span>
    </>
  );

  const classes = cn(
    'inline-flex max-w-full items-center gap-1.5 rounded-full border border-success/25 bg-success/[0.07]',
    'px-2.5 py-1 text-[11px] font-medium text-success transition-colors',
    asLink && 'hover:border-success/40 hover:bg-success/10',
    className,
  );

  if (!asLink) return <span className={classes}>{content}</span>;
  return (
    <Link to="/privacy" className={classes}>
      {content}
    </Link>
  );
}
