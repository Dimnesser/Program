import { Link } from 'react-router-dom';
import { Github, Monitor, Moon, Sun } from 'lucide-react';
import { useI18n, LANGUAGES } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';
import { Logo } from '@/components/Logo';
import { tools } from '@/data/tools';
import { cn } from '@/lib/utils';
import type { Language, ThemeMode } from '@/types';

export function Footer() {
  const { t, language, setLanguage } = useI18n();
  const { mode, setMode } = useTheme();

  const themes: { id: ThemeMode; icon: typeof Sun; label: string }[] = [
    { id: 'light', icon: Sun, label: t('settings.themeLight') },
    { id: 'dark', icon: Moon, label: t('settings.themeDark') },
    { id: 'system', icon: Monitor, label: t('settings.themeSystem') },
  ];

  const columns = [
    {
      title: t('footer.product'),
      links: [
        { to: '/tools', label: t('nav.tools') },
        { to: '/favorites', label: t('nav.favorites') },
        { to: '/welcome', label: t('landing.cta') },
      ],
    },
    {
      title: t('footer.resources'),
      links: [
        { to: '/privacy', label: t('nav.privacy') },
        { to: '/about', label: t('nav.about') },
        { to: '/shortcuts', label: t('nav.shortcuts') },
      ],
    },
  ];

  return (
    <footer className="mt-20 border-t border-ink">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo showTagline />
            <p className="mt-6 font-mono text-[11px] uppercase tracking-caps text-faint">
              {tools.length} {t('about.toolsCount')} · {t('footer.builtWith')}
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="nova-caps border-b border-line pb-2">{column.title}</h3>
              <ul className="mt-3 space-y-2 text-[13px]">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-muted transition-colors hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
                {column.title === t('footer.resources') ? (
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
                ) : null}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="nova-caps border-b border-line pb-2">{t('footer.preferences')}</h3>
            <div className="mt-3 space-y-4">
              <div className="flex items-center gap-3">
                {LANGUAGES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLanguage(item.id as Language)}
                    aria-pressed={language === item.id}
                    className={cn(
                      'font-mono text-[11px] uppercase tracking-caps transition-colors',
                      language === item.id
                        ? 'text-ink underline decoration-accent underline-offset-4'
                        : 'text-faint hover:text-muted',
                    )}
                  >
                    {item.native}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
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
                        'flex h-7 w-7 items-center justify-center transition-colors',
                        mode === item.id ? 'text-ink' : 'text-faint hover:text-muted',
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

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-5 font-mono text-[11px] uppercase tracking-caps text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>{t('footer.rights')}</span>
          <span>{t('brand.tagline')}</span>
        </div>
      </div>
    </footer>
  );
}
