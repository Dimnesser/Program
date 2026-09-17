import { NavLink } from 'react-router-dom';
import { Clock, Home, LayoutGrid, Settings, Star } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const { t } = useI18n();

  const items = [
    { to: '/', icon: Home, label: t('nav.home'), end: true },
    { to: '/tools', icon: LayoutGrid, label: t('nav.toolsShort') },
    { to: '/favorites', icon: Star, label: t('nav.favorites') },
    { to: '/history', icon: Clock, label: t('nav.history') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  return (
    <nav
      aria-label={t('nav.menu')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-13 flex-col items-center justify-center gap-1 py-2.5 font-mono text-[9px] uppercase tracking-caps transition-colors',
                    isActive ? 'text-ink' : 'text-faint hover:text-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <span aria-hidden="true" className="absolute inset-x-4 top-0 h-[2px] bg-accent" />
                    ) : null}
                    <Icon className="h-[17px] w-[17px]" strokeWidth={isActive ? 2 : 1.6} />
                    <span className="max-w-full truncate px-1">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
