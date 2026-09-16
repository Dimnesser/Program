import type { ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Home,
  Info,
  Keyboard,
  LayoutGrid,
  Settings,
  Star,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { StorageKeys } from '@/lib/storage';
import { categories } from '@/data/categories';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { Tooltip } from '@/components/ui/Tooltip';

function NavItem({
  to,
  icon,
  label,
  collapsed,
  end,
  tint,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  collapsed: boolean;
  end?: boolean;
  tint?: string;
}) {
  const location = useLocation();

  // NavLink ignores the query string, so category links (/tools?category=…)
  // would all light up at once. Resolve those against the search params.
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
        'group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ease-nova',
        collapsed && 'justify-center px-0',
        active ? 'bg-accent/10 text-ink' : 'text-muted hover:bg-elevated/70 hover:text-ink',
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
      ) : null}
      <span
        className={cn('shrink-0 transition-colors', active ? 'text-accent' : 'text-faint group-hover:text-ink')}
        style={!active && tint ? { color: tint } : undefined}
      >
        {icon}
      </span>
      {!collapsed ? <span className="truncate">{label}</span> : null}
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

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface/50 backdrop-blur-xl transition-[width] duration-200 ease-nova lg:flex',
        collapsed ? 'w-[68px]' : 'w-[248px]',
      )}
      aria-label={t('nav.menu')}
    >
      <div className={cn('flex h-16 shrink-0 items-center px-4', collapsed && 'justify-center px-0')}>
        <Link to="/" className="rounded-xl" aria-label="NOVA">
          <Logo compact={collapsed} />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 nova-scroll-fade">
        <NavItem to="/" end icon={<Home className="h-4 w-4" />} label={t('nav.home')} collapsed={collapsed} />
        <NavItem to="/tools" icon={<LayoutGrid className="h-4 w-4" />} label={t('nav.tools')} collapsed={collapsed} />
        <NavItem to="/favorites" icon={<Star className="h-4 w-4" />} label={t('nav.favorites')} collapsed={collapsed} />
        <NavItem to="/history" icon={<Clock className="h-4 w-4" />} label={t('nav.recent')} collapsed={collapsed} />

        <div className="!my-3 h-px bg-line" />

        {!collapsed ? (
          <p className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
            {t('nav.categories')}
          </p>
        ) : null}

        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <NavItem
              key={category.id}
              to={`/tools?category=${category.id}`}
              icon={<Icon className="h-4 w-4" />}
              label={tl(category.name)}
              collapsed={collapsed}
              tint={category.tint}
            />
          );
        })}

        <div className="!my-3 h-px bg-line" />

        <NavItem to="/settings" icon={<Settings className="h-4 w-4" />} label={t('nav.settings')} collapsed={collapsed} />
        <NavItem
          to="/shortcuts"
          icon={<Keyboard className="h-4 w-4" />}
          label={t('nav.shortcuts')}
          collapsed={collapsed}
        />
        <NavItem to="/about" icon={<Info className="h-4 w-4" />} label={t('nav.about')} collapsed={collapsed} />
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-faint',
            'transition-colors duration-150 hover:bg-elevated/70 hover:text-ink',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed ? <span>{t('nav.collapse')}</span> : null}
        </button>
      </div>
    </aside>
  );
}
