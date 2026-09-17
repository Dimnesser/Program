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
    'inline-flex max-w-full items-center gap-1.5 font-mono text-[10px] uppercase tracking-caps text-success',
    asLink && 'transition-opacity hover:opacity-70',
    className,
  );

  if (!asLink) return <span className={classes}>{content}</span>;
  return (
    <Link to="/privacy" className={classes}>
      {content}
    </Link>
  );
}
