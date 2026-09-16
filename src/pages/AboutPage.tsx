import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/Logo';
import { LinkButton } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { tools } from '@/data/tools';
import { categories } from '@/data/categories';

const STACK = ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Canvas API', 'Web Crypto', 'PWA'];

export default function AboutPage() {
  const { t } = useI18n();
  useDocumentTitle(t('about.title'), t('about.subtitle'));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <Logo showTagline />
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">{t('about.title')}</h1>
        <p className="mt-1.5 text-[15px] text-muted">{t('about.subtitle')}</p>
      </header>

      <Card className="space-y-4">
        <p className="text-[14px] leading-relaxed text-muted">{t('about.text1')}</p>
        <p className="text-[14px] leading-relaxed text-muted">{t('about.text2')}</p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { value: String(tools.length), label: t('about.toolsCount') },
          { value: String(categories.length), label: t('about.categoriesCount') },
          { value: '0', label: t('about.serversCount') },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <p className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">{stat.value}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted sm:text-xs">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-[14px] font-semibold text-ink">{t('about.stack')}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {STACK.map((item) => (
            <span
              key={item}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted"
            >
              {item}
            </span>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <LinkButton to="/tools" variant="primary" block>
          {t('nav.tools')}
        </LinkButton>
        <LinkButton to="/privacy" block>
          {t('nav.privacy')}
        </LinkButton>
      </div>
    </div>
  );
}
