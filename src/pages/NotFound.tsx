import { useI18n } from '@/lib/i18n';
import { LinkButton } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Spark } from '@/components/Logo';

export default function NotFound() {
  const { t } = useI18n();
  useDocumentTitle(t('error.404'));

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-card text-accent">
        <Spark className="h-6 w-6" />
      </span>
      <p className="mt-6 font-mono text-[13px] text-faint">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">{t('error.404')}</h1>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted">{t('error.404text')}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <LinkButton to="/" variant="primary">
          {t('nav.home')}
        </LinkButton>
        <LinkButton to="/tools">{t('nav.tools')}</LinkButton>
      </div>
    </div>
  );
}
