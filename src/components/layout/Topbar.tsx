import { Link, useNavigate } from 'react-router-dom';
import { Languages, Monitor, Moon, Search, Settings, Sun, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useI18n, LANGUAGES } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';
import { useCommandPalette } from '@/components/CommandPalette';
import { Logo } from '@/components/Logo';
import { Kbd } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';
import type { Language, ThemeMode } from '@/types';

export function Topbar() {
  const { t, language, setLanguage } = useI18n();
  const { mode, setMode, resolved } = useTheme();
  const { openWith } = useCommandPalette();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const themeOptions: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: 'dark', label: t('settings.themeDark'), icon: Moon },
    { id: 'light', label: t('settings.themeLight'), icon: Sun },
    { id: 'system', label: t('settings.themeSystem'), icon: Monitor },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="rounded-xl lg:hidden" aria-label="NOVA">
          <Logo compact />
        </Link>

        <button
          type="button"
          onClick={() => openWith('')}
          className={cn(
            'group flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-line bg-surface/70 px-3',
            'text-left text-[13px] text-faint transition-all duration-200 ease-nova',
            'hover:border-line-strong hover:bg-surface md:max-w-md',
          )}
        >
          <Search className="h-4 w-4 shrink-0 transition-colors group-hover:text-muted" />
          <span className="flex-1 truncate">{t('common.searchAnything')}</span>
          <span className="hidden shrink-0 items-center gap-1 sm:flex">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <div className="hidden items-center rounded-xl border border-line bg-surface/70 p-0.5 sm:flex">
            {LANGUAGES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLanguage(item.id as Language)}
                aria-pressed={language === item.id}
                title={item.label}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors duration-150',
                  language === item.id ? 'bg-elevated text-ink shadow-soft' : 'text-faint hover:text-ink',
                )}
              >
                <span aria-hidden="true">{item.flag}</span>
                <span>{item.native}</span>
              </button>
            ))}
          </div>

          <IconButton
            label={t('settings.language')}
            className="sm:hidden"
            onClick={() => setLanguage(language === 'uk' ? 'en' : 'uk')}
          >
            <Languages className="h-4 w-4" />
          </IconButton>

          <div className="hidden items-center rounded-xl border border-line bg-surface/70 p-0.5 md:flex">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMode(option.id)}
                  aria-pressed={mode === option.id}
                  title={option.label}
                  aria-label={option.label}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150',
                    mode === option.id ? 'bg-elevated text-ink shadow-soft' : 'text-faint hover:text-ink',
                  )}
                >
                  <Icon className="h-[15px] w-[15px]" />
                </button>
              );
            })}
          </div>

          <IconButton
            label={t('shortcuts.toggleTheme')}
            className="md:hidden"
            onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
          >
            {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </IconButton>

          <IconButton label={t('nav.settings')} onClick={() => navigate('/settings')} className="hidden sm:inline-flex">
            <Settings className="h-4 w-4" />
          </IconButton>

          <IconButton label={t('nav.profile')} onClick={() => setProfileOpen(true)}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-elevated text-muted">
              <UserRound className="h-3.5 w-3.5" />
            </span>
          </IconButton>
        </div>
      </div>

      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title={t('nav.profile')}
        description={t('privacy.p2.text')}
      >
        <div className="space-y-3 text-[13px] text-muted">
          <p>{t('privacy.p3.text')}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/settings"
              onClick={() => setProfileOpen(false)}
              className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-center text-[13px] font-medium text-ink transition-colors hover:border-line-strong"
            >
              {t('nav.settings')}
            </Link>
            <Link
              to="/privacy"
              onClick={() => setProfileOpen(false)}
              className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-center text-[13px] font-medium text-ink transition-colors hover:border-line-strong"
            >
              {t('nav.privacy')}
            </Link>
          </div>
        </div>
      </Dialog>
    </header>
  );
}
