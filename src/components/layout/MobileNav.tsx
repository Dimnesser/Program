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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
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
                    'flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors duration-150',
                    isActive ? 'text-accent' : 'text-faint hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      {isActive ? (
                        <span className="absolute -inset-x-2.5 -inset-y-1.5 rounded-lg bg-accent/10" aria-hidden="true" />
                      ) : null}
                      <Icon className="relative h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                    </span>
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
