import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Command, Gauge, Lock, Moon, Sun, WifiOff } from 'lucide-react';
import { useI18n, LANGUAGES } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';
import { writeStorage, StorageKeys } from '@/lib/storage';
import { categories } from '@/data/categories';
import { popularTools, tools } from '@/data/tools';
import { Logo } from '@/components/Logo';
import { ToolIndexRow } from '@/components/ToolCard';
import { PalettePreview } from '@/components/PalettePreview';
import { Footer } from '@/components/layout/Footer';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type { Language } from '@/types';

const WHY = [
  { icon: Command, titleKey: 'landing.why1.title', textKey: 'landing.why1.text' },
  { icon: Lock, titleKey: 'landing.why2.title', textKey: 'landing.why2.text' },
  { icon: Gauge, titleKey: 'landing.why3.title', textKey: 'landing.why3.text' },
  { icon: WifiOff, titleKey: 'landing.why4.title', textKey: 'landing.why4.text' },
] as const;

const FAQ = [
  { q: 'landing.faq1.q', a: 'landing.faq1.a' },
  { q: 'landing.faq2.q', a: 'landing.faq2.a' },
  { q: 'landing.faq3.q', a: 'landing.faq3.a' },
  { q: 'landing.faq4.q', a: 'landing.faq4.a' },
  { q: 'landing.faq5.q', a: 'landing.faq5.a' },
] as const;

/** A numbered, ruled section heading — the spine of the page. */
function Rubric({ index, title, subtitle }: { index: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t-2 border-ink pt-3">
      <h2 className="flex items-baseline gap-3 font-sans text-[13px] font-semibold uppercase tracking-caps text-ink">
        <span className="font-mono text-[11px] font-normal text-faint">{index}</span>
        {title}
      </h2>
      {subtitle ? <p className="max-w-md text-[13px] text-muted">{subtitle}</p> : null}
    </div>
  );
}

export default function Landing() {
  const { t, tl, language, setLanguage } = useI18n();
  const { resolved, setMode } = useTheme();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  useDocumentTitle(undefined, t('landing.subtitle'));

  const enter = (to: string) => {
    writeStorage(StorageKeys.onboarded, true);
    navigate(to);
  };

  return (
    <div className="nova-backdrop min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Link to="/welcome" aria-label="NOVA">
            <Logo />
          </Link>
          <nav className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-1 sm:flex">
              {LANGUAGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLanguage(item.id as Language)}
                  aria-pressed={language === item.id}
                  className={cn(
                    'px-1 font-mono text-[11px] uppercase tracking-caps transition-colors',
                    language === item.id
                      ? 'text-ink underline decoration-accent underline-offset-4'
                      : 'text-faint hover:text-muted',
                  )}
                >
                  {item.native}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
              aria-label={t('shortcuts.toggleTheme')}
              className="flex h-7 w-7 items-center justify-center text-faint transition-colors hover:text-ink"
            >
              {resolved === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => enter('/dashboard')}
              className="h-8 bg-ink px-3.5 text-[13px] font-medium text-bg transition-opacity hover:opacity-90"
            >
              {t('landing.cta')}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        {/* Masthead */}
        <section className="border-b border-line py-16 sm:py-24">
          <p className="nova-caps">{t('landing.badge')}</p>

          <h1 className="nova-display mt-6 max-w-3xl text-[44px] text-ink sm:text-[72px]">{t('landing.title')}</h1>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <p className="max-w-md text-[16px] leading-relaxed text-muted">{t('landing.subtitle')}</p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => enter('/dashboard')}
                className="inline-flex h-11 items-center gap-2 bg-ink px-6 text-[14px] font-medium text-bg transition-opacity hover:opacity-90"
              >
                {t('landing.cta')}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => enter('/tools')}
                className="inline-flex h-11 items-center border border-line px-6 text-[14px] font-medium text-ink transition-colors hover:border-ink"
              >
                {t('landing.ctaSecondary')}
              </button>
            </div>
          </div>

          <div className="mt-16">
            <PalettePreview />
          </div>

          <dl className="mt-16 grid grid-cols-3 gap-px border border-line bg-line">
            {[
              { value: `${tools.length}`, label: t('about.toolsCount') },
              { value: String(categories.length), label: t('about.categoriesCount') },
              { value: '0', label: t('about.serversCount') },
            ].map((stat) => (
              <div key={stat.label} className="bg-bg px-4 py-6 text-center">
                <dt className="font-serif text-[32px] font-semibold tracking-[-0.02em] text-ink sm:text-[40px]">
                  {stat.value}
                </dt>
                <dd className="nova-caps mt-2">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Popular tools, as an index */}
        <section className="py-16">
          <Rubric index="01" title={t('landing.popular')} />
          <div className="border-t border-line">
            {popularTools.slice(0, 10).map((tool, index) => (
              <ToolIndexRow key={tool.id} tool={tool} index={index + 1} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => enter('/tools')}
            className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-caps text-accent transition-opacity hover:opacity-70"
          >
            {t('nav.tools')}
            <ArrowRight className="h-3 w-3" />
          </button>
        </section>

        {/* Why */}
        <section className="py-16">
          <Rubric index="02" title={t('landing.why')} subtitle={t('landing.whySubtitle')} />
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {WHY.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.titleKey} className="border-t border-line pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[11px] text-faint">{String(index + 1).padStart(2, '0')}</span>
                    <Icon className="h-4 w-4 text-faint" strokeWidth={1.7} />
                  </div>
                  <h3 className="mt-4 font-serif text-[20px] font-semibold text-ink">{t(item.titleKey)}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{t(item.textKey)}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Privacy */}
        <section className="py-16">
          <Rubric index="03" title={t('nav.privacy')} />
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div>
              <p className="font-serif text-[26px] font-semibold leading-[1.25] tracking-[-0.02em] text-ink sm:text-[32px]">
                {t('privacy.p1.text')}
              </p>
              <Link
                to="/privacy"
                className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-caps text-accent transition-opacity hover:opacity-70"
              >
                {t('nav.privacy')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ul>
              {['privacy.p2.title', 'privacy.p3.title', 'privacy.p4.title', 'privacy.p6.title'].map((key, index) => (
                <li key={key} className="flex items-baseline gap-3 border-b border-line py-3 text-[13.5px] text-ink">
                  <span className="font-mono text-[11px] text-faint">{String(index + 1).padStart(2, '0')}</span>
                  {t(key as 'privacy.p2.title')}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16">
          <Rubric index="04" title={t('landing.categories')} />
          <div className="grid gap-x-10 sm:grid-cols-2">
            {categories.map((category, index) => {
              const count = tools.filter((tool) => tool.category === category.id).length;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => enter(`/tools?category=${category.id}`)}
                  className="group flex items-baseline gap-3 border-b border-line py-4 text-left transition-colors hover:border-ink"
                >
                  <span className="font-mono text-[11px] text-faint">{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-[18px] font-semibold text-ink">
                      {tl(category.name)}
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-muted">{tl(category.description)}</span>
                  </span>
                  <span className="font-mono text-[11px] text-faint">{count}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <Rubric index="05" title={t('landing.faq')} />
          <div className="border-t border-line">
            {FAQ.map((item, index) => {
              const open = openFaq === index;
              return (
                <div key={item.q} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : index)}
                    aria-expanded={open}
                    className="flex w-full items-baseline justify-between gap-4 py-4 text-left"
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-mono text-[11px] text-faint">{String(index + 1).padStart(2, '0')}</span>
                      <span className="text-[15px] font-medium text-ink">{t(item.q)}</span>
                    </span>
                    <ChevronDown
                      className={cn('h-4 w-4 shrink-0 text-faint transition-transform duration-200', open && 'rotate-180')}
                    />
                  </button>
                  {open ? (
                    <p className="animate-fade-in pb-5 pl-8 text-[13.5px] leading-relaxed text-muted">{t(item.a)}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Colophon */}
        <section className="border-t-2 border-ink py-20 text-center">
          <p className="nova-display text-[32px] text-ink sm:text-[44px]">{t('brand.tagline')}</p>
          <button
            type="button"
            onClick={() => enter('/dashboard')}
            className="mt-8 inline-flex h-11 items-center gap-2 bg-ink px-8 text-[14px] font-medium text-bg transition-opacity hover:opacity-90"
          >
            {t('landing.cta')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
