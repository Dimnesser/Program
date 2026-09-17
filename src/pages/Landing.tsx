import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Command, Gauge, Lock, Sparkles, WifiOff } from 'lucide-react';
import { useI18n, LANGUAGES } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';
import { writeStorage, StorageKeys } from '@/lib/storage';
import { categories } from '@/data/categories';
import { popularTools, tools } from '@/data/tools';
import { Logo } from '@/components/Logo';
import { ToolCard } from '@/components/ToolCard';
import { PalettePreview } from '@/components/PalettePreview';
import { Button, LinkButton } from '@/components/ui/Button';
import { Kbd } from '@/components/ui/Badge';
import { Footer } from '@/components/layout/Footer';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type { Language } from '@/types';
import { Moon, Sun } from 'lucide-react';

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
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/welcome" aria-label="NOVA">
            <Logo />
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            <div className="hidden items-center rounded-xl border border-line bg-surface/70 p-0.5 sm:flex">
              {LANGUAGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLanguage(item.id as Language)}
                  aria-pressed={language === item.id}
                  className={cn(
                    'flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors',
                    language === item.id ? 'bg-elevated text-ink shadow-soft' : 'text-faint hover:text-ink',
                  )}
                >
                  <span aria-hidden="true">{item.flag}</span>
                  {item.native}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
              aria-label={t('shortcuts.toggleTheme')}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-elevated hover:text-ink"
            >
              {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button variant="primary" size="sm" className="ml-1" onClick={() => enter('/dashboard')}>
              {t('landing.cta')}
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1.5 text-[12px] font-medium text-muted backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            {t('landing.badge')}
          </span>

          <h1 className="nova-display mx-auto mt-6 max-w-3xl text-balance text-[42px] text-ink sm:text-[64px]">
            {t('landing.title')}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-[17px] leading-relaxed text-muted">
            {t('landing.subtitle')}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="primary"
              size="lg"
              onClick={() => enter('/dashboard')}
              iconRight={<ArrowRight className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              {t('landing.cta')}
            </Button>
            <Button size="lg" onClick={() => enter('/tools')} className="w-full sm:w-auto">
              {t('landing.ctaSecondary')}
            </Button>
          </div>

          <div className="relative mx-auto mt-14 max-w-xl">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-10 -top-8 bottom-0 rounded-[40px] bg-accent/[0.07] blur-3xl"
            />
            <PalettePreview />
          </div>

          <p className="mt-5 flex items-center justify-center gap-2 text-[13px] text-faint">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
            <span>{t('shortcuts.palette')}</span>
          </p>

          <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-3">
            {[
              { value: `${tools.length}+`, label: t('about.toolsCount') },
              { value: String(categories.length), label: t('about.categoriesCount') },
              { value: '0', label: t('about.serversCount') },
            ].map((stat) => (
              <div key={stat.label} className="nova-card rounded-2xl px-3 py-4">
                <dt className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">{stat.value}</dt>
                <dd className="mt-1 text-[11px] leading-snug text-muted sm:text-xs">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Popular tools */}
        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">{t('landing.popular')}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popularTools.slice(0, 9).map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        {/* Why NOVA */}
        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">{t('landing.why')}</h2>
          <p className="mt-1.5 text-[15px] text-muted">{t('landing.whySubtitle')}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.titleKey} className="nova-card rounded-2xl p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-4 text-[14px] font-semibold text-ink">{t(item.titleKey)}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{t(item.textKey)}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Privacy */}
        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <div className="nova-card flex flex-col gap-6 rounded-3xl p-6 sm:p-10 lg:flex-row lg:items-center">
            <div className="flex-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/[0.08] px-3 py-1 text-[12px] font-medium text-success">
                <Lock className="h-3.5 w-3.5" />
                {t('privacy.badge')}
              </span>
              <h2 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">
                {t('privacy.p1.title')}
              </h2>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted">{t('privacy.p1.text')}</p>
              <LinkButton to="/privacy" size="sm" className="mt-5" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                {t('nav.privacy')}
              </LinkButton>
            </div>
            <ul className="grid flex-1 gap-2.5">
              {['privacy.p2.title', 'privacy.p3.title', 'privacy.p4.title', 'privacy.p6.title'].map((key) => (
                <li
                  key={key}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-surface/60 px-3.5 py-3 text-[13px] text-ink"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                  {t(key as 'privacy.p2.title')}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">{t('landing.categories')}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const count = tools.filter((tool) => tool.category === category.id).length;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => enter(`/tools?category=${category.id}`)}
                  className="nova-card nova-interactive group rounded-2xl p-5 text-left hover:border-line-strong"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface"
                    style={{ color: category.tint }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.9} />
                  </span>
                  <h3 className="mt-4 text-[14px] font-semibold text-ink">{tl(category.name)}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{tl(category.description)}</p>
                  <p className="mt-3 text-xs text-faint">{count}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">{t('landing.faq')}</h2>
          <div className="nova-card mt-5 divide-y divide-line overflow-hidden rounded-2xl">
            {FAQ.map((item, index) => {
              const open = openFaq === index;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : index)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-[14px] font-medium text-ink">{t(item.q)}</span>
                    <ChevronDown
                      className={cn('h-4 w-4 shrink-0 text-faint transition-transform duration-200', open && 'rotate-180')}
                    />
                  </button>
                  {open ? (
                    <p className="animate-fade-in px-5 pb-4 text-[13px] leading-relaxed text-muted">{t(item.a)}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto w-full max-w-6xl px-4 py-14 text-center sm:px-6">
          <h2 className="text-balance text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">
            {t('brand.tagline')}
          </h2>
          <Button
            variant="primary"
            size="lg"
            className="mt-6"
            onClick={() => enter('/dashboard')}
            iconRight={<ArrowRight className="h-4 w-4" />}
          >
            {t('landing.cta')}
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
