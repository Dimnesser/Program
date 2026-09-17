import { useI18n } from '@/lib/i18n';
import { LinkButton } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Spark } from '@/components/Logo';

export default function NotFound() {
  const { t } = useI18n();
  useDocumentTitle(t('error.404'));

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <Spark className="h-5 w-5 text-accent" />
      <p className="nova-caps mt-6">404</p>
      <h1 className="nova-display mt-3 text-[40px] text-ink">{t('error.404')}</h1>
      <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-muted">{t('error.404text')}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <LinkButton to="/" variant="primary">
          {t('nav.home')}
        </LinkButton>
        <LinkButton to="/tools">{t('nav.tools')}</LinkButton>
      </div>
    </div>
  );
}
