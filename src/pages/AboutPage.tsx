import { useI18n } from '@/lib/i18n';
import { LinkButton } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/PageHeader';
import { tools } from '@/data/tools';
import { categories } from '@/data/categories';

const STACK = ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Canvas API', 'Web Crypto', 'PWA'];

export default function AboutPage() {
  const { t } = useI18n();
  useDocumentTitle(t('about.title'), t('about.subtitle'));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader eyebrow="NOVA" title={t('about.title')} subtitle={t('about.subtitle')} />

      <div className="max-w-2xl space-y-5">
        <p className="font-serif text-[20px] leading-[1.5] text-ink">{t('about.text1')}</p>
        <p className="text-[14.5px] leading-relaxed text-muted">{t('about.text2')}</p>
      </div>

      <div className="grid grid-cols-3 gap-px border border-line bg-line">
        {[
          { value: String(tools.length), label: t('about.toolsCount') },
          { value: String(categories.length), label: t('about.categoriesCount') },
          { value: '0', label: t('about.serversCount') },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg px-4 py-6 text-center">
            <p className="font-serif text-[32px] font-semibold tracking-[-0.02em] text-ink">{stat.value}</p>
            <p className="nova-caps mt-2">{stat.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="nova-caps border-b border-line pb-2">{t('about.stack')}</h2>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {STACK.map((item) => (
            <span key={item} className="font-mono text-[12px] text-muted">
              {item}
            </span>
          ))}
        </div>
      </section>

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
