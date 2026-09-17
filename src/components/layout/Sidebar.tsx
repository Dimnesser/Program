import type { ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { StorageKeys } from '@/lib/storage';
import { categories } from '@/data/categories';
import { tools } from '@/data/tools';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { Tooltip } from '@/components/ui/Tooltip';

function NavItem({
  to,
  icon,
  label,
  collapsed,
  end,
  count,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  collapsed: boolean;
  end?: boolean;
  count?: number;
}) {
  const location = useLocation();

  // NavLink ignores the query string, so category links are matched by hand.
  const [path, search] = to.split('?');
  const category = search ? new URLSearchParams(search).get('category') : null;
  const active = category
    ? location.pathname === path && new URLSearchParams(location.search).get('category') === category
    : end
      ? location.pathname === path
      : location.pathname === path ||
        (location.pathname.startsWith(`${path}/`) && !new URLSearchParams(location.search).get('category'));

  const link = (
    <NavLink
      to={to}
      end={end}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-2.5 py-[7px] text-[13px] transition-colors duration-150',
        collapsed ? 'justify-center' : 'pl-3 pr-2',
        active ? 'font-medium text-ink' : 'text-muted hover:text-ink',
      )}
    >
      {active && !collapsed ? (
        <span aria-hidden="true" className="absolute left-0 top-1/2 h-3 w-[2px] -translate-y-1/2 bg-accent" />
      ) : null}
      <span className={cn('shrink-0 transition-colors', active ? 'text-accent' : 'text-faint group-hover:text-muted')}>
        {icon}
      </span>
      {!collapsed ? (
        <>
          <span className="truncate">{label}</span>
          {count !== undefined ? (
            <span className="ml-auto font-mono text-[10px] text-faint">{String(count).padStart(2, '0')}</span>
          ) : null}
        </>
      ) : null}
    </NavLink>
  );

  return collapsed ? (
    <Tooltip content={label} side="right" className="w-full">
      <span className="w-full">{link}</span>
    </Tooltip>
  ) : (
    link
  );
}

export function Sidebar() {
  const { t, tl } = useI18n();
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(StorageKeys.sidebar, false);

  const primary = [
    { to: '/', end: true, key: 'nav.home' as const },
    { to: '/tools', key: 'nav.tools' as const },
    { to: '/favorites', key: 'nav.favorites' as const },
    { to: '/history', key: 'nav.recent' as const },
  ];

  const secondary = [
    { to: '/settings', key: 'nav.settings' as const },
    { to: '/shortcuts', key: 'nav.shortcuts' as const },
    { to: '/about', key: 'nav.about' as const },
  ];

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-bg transition-[width] duration-200 ease-nova lg:flex',
        collapsed ? 'w-[60px]' : 'w-[232px]',
      )}
      aria-label={t('nav.menu')}
    >
      <div className={cn('flex h-14 shrink-0 items-center border-b border-line', collapsed ? 'justify-center' : 'px-4')}>
        <Link to="/" aria-label="NOVA">
          <Logo compact={collapsed} />
        </Link>
      </div>

      <nav className="nova-scroll-fade flex-1 overflow-y-auto py-4">
        <div className={cn(!collapsed && 'px-2')}>
          {primary.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              end={item.end}
              collapsed={collapsed}
              label={t(item.key)}
              icon={<span className="block h-1 w-1 rounded-full bg-current" />}
            />
          ))}
        </div>

        <div className="my-4 border-t border-line" />

        {!collapsed ? <p className="nova-caps px-3 pb-2">{t('nav.categories')}</p> : null}

        <div className={cn(!collapsed && 'px-2')}>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <NavItem
                key={category.id}
                to={`/tools?category=${category.id}`}
                collapsed={collapsed}
                label={tl(category.name)}
                count={tools.filter((tool) => tool.category === category.id).length}
                icon={<Icon className="h-3.5 w-3.5" strokeWidth={1.7} />}
              />
            );
          })}
        </div>

        <div className="my-4 border-t border-line" />

        <div className={cn(!collapsed && 'px-2')}>
          {secondary.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              collapsed={collapsed}
              label={t(item.key)}
              icon={<span className="block h-1 w-1 rounded-full bg-current" />}
            />
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t border-line">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
          className={cn(
            'flex w-full items-center gap-2.5 py-3 text-[12px] text-faint transition-colors hover:text-ink',
            collapsed ? 'justify-center' : 'px-4',
          )}
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          {!collapsed ? <span className="font-mono text-[10px] uppercase tracking-caps">{t('nav.collapse')}</span> : null}
        </button>
      </div>
    </aside>
  );
}
