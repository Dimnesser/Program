import { Link } from 'react-router-dom';
import { Github, Languages, Monitor, Moon, Sun } from 'lucide-react';
import { useI18n, LANGUAGES } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import type { Language, ThemeMode } from '@/types';

export function Footer() {
  const { t, language, setLanguage } = useI18n();
  const { mode, setMode } = useTheme();

  const themes: { id: ThemeMode; icon: typeof Sun; label: string }[] = [
    { id: 'dark', icon: Moon, label: t('settings.themeDark') },
    { id: 'light', icon: Sun, label: t('settings.themeLight') },
    { id: 'system', icon: Monitor, label: t('settings.themeSystem') },
  ];

  return (
    <footer className="mt-16 border-t border-line bg-surface/40">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo showTagline />
            <p className="mt-4 text-[13px] leading-relaxed text-muted">{t('footer.builtWith')}</p>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">{t('footer.product')}</h3>
            <ul className="mt-3 space-y-2 text-[13px]">
              <li>
                <Link to="/tools" className="text-muted transition-colors hover:text-ink">
                  {t('nav.tools')}
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="text-muted transition-colors hover:text-ink">
                  {t('nav.favorites')}
                </Link>
              </li>
              <li>
                <Link to="/welcome" className="text-muted transition-colors hover:text-ink">
                  {t('landing.title')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">{t('footer.resources')}</h3>
            <ul className="mt-3 space-y-2 text-[13px]">
              <li>
                <Link to="/privacy" className="text-muted transition-colors hover:text-ink">
                  {t('nav.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted transition-colors hover:text-ink">
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link to="/shortcuts" className="text-muted transition-colors hover:text-ink">
                  {t('nav.shortcuts')}
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Dimnesser/Program"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">
              {t('footer.preferences')}
            </h3>
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-faint" />
                <div className="flex rounded-lg border border-line bg-surface p-0.5">
                  {LANGUAGES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLanguage(item.id as Language)}
                      aria-pressed={language === item.id}
                      className={cn(
                        'rounded-md px-2 py-1 text-[11px] font-semibold transition-colors',
                        language === item.id ? 'bg-elevated text-ink' : 'text-faint hover:text-ink',
                      )}
                    >
                      {item.native}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex rounded-lg border border-line bg-surface p-0.5">
                {themes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id)}
                      aria-pressed={mode === item.id}
                      aria-label={item.label}
                      title={item.label}
                      className={cn(
                        'flex h-7 w-8 items-center justify-center rounded-md transition-colors',
                        mode === item.id ? 'bg-elevated text-ink' : 'text-faint hover:text-ink',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>{t('footer.rights')}</span>
          <span>{t('brand.tagline')}</span>
        </div>
      </div>
    </footer>
  );
}
