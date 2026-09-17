import { Link } from 'react-router-dom';
import { ArrowUpRight, Star } from 'lucide-react';
import type { Tool } from '@/types';
import { useI18n } from '@/lib/i18n';
import { useFavorites } from '@/hooks/useFavorites';
import { categoryMap } from '@/data/categories';
import { cn } from '@/lib/utils';

export function ToolIcon({ tool, className }: { tool: Tool; className?: string }) {
  const Icon = tool.icon;
  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center border border-line bg-bg text-muted transition-colors duration-150',
        className,
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.7} />
    </span>
  );
}

function FavoriteToggle({ tool, className }: { tool: Tool; className?: string }) {
  const { t } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(tool.id);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        toggleFavorite(tool.id);
      }}
      aria-label={favorite ? t('tools.removeFavorite') : t('tools.addFavorite')}
      aria-pressed={favorite}
      title={favorite ? t('tools.removeFavorite') : t('tools.addFavorite')}
      className={cn(
        'p-1 transition-all duration-150',
        favorite
          ? 'text-ink opacity-100'
          : 'text-faint opacity-0 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100',
        className,
      )}
    >
      <Star className={cn('h-3.5 w-3.5', favorite && 'fill-current')} />
    </button>
  );
}

/**
 * A catalogue entry, set like a line in a printed index: number, name,
 * description, section. This is the primary way tools are listed.
 */
export function ToolIndexRow({
  tool,
  index,
  showCategory = true,
}: {
  tool: Tool;
  index?: number;
  showCategory?: boolean;
}) {
  const { tl } = useI18n();
  const category = categoryMap.get(tool.category);

  return (
    <div className="nova-row group">
      {index !== undefined ? (
        <span className="w-7 shrink-0 font-mono text-[11px] text-faint">{String(index).padStart(2, '0')}</span>
      ) : null}

      <Link to={tool.route} className="flex min-w-0 flex-1 items-center gap-4">
        <ToolIcon tool={tool} className="h-7 w-7 group-hover:border-line-strong group-hover:text-ink" />

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-[14px] font-medium text-ink">{tl(tool.name)}</span>
            {tool.isNew ? (
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-caps text-accent">new</span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-muted">{tl(tool.description)}</span>
        </span>
      </Link>

      {showCategory ? (
        <span className="nova-caps hidden max-w-[150px] shrink-0 truncate whitespace-nowrap text-right md:block">
          {category ? tl(category.name) : ''}
        </span>
      ) : null}

      <FavoriteToggle tool={tool} className="shrink-0" />

      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

/** A ruled tile for grids, where a list would be too dense. */
export function ToolCard({ tool, compact = false }: { tool: Tool; compact?: boolean }) {
  const { tl } = useI18n();
  const category = categoryMap.get(tool.category);

  return (
    <div className="group relative">
      <Link
        to={tool.route}
        className={cn(
          'nova-card nova-interactive flex h-full flex-col hover:border-ink',
          compact ? 'p-3' : 'p-4',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="nova-caps mt-1 truncate">{category ? tl(category.name) : ''}</span>
          <ToolIcon tool={tool} className={cn('h-7 w-7 group-hover:text-ink', compact && 'h-6 w-6')} />
        </div>

        <h3 className={cn('mt-4 truncate font-sans font-medium text-ink', compact ? 'text-[13px]' : 'text-[15px]')}>
          {tl(tool.name)}
        </h3>

        {!compact ? (
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted">{tl(tool.description)}</p>
        ) : null}

        <span className="mt-auto flex items-center gap-1 pt-4">
          {tool.isNew ? <span className="font-mono text-[9px] uppercase tracking-caps text-accent">new</span> : null}
          <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      </Link>

      <div className="absolute bottom-2 left-2">
        <FavoriteToggle tool={tool} />
      </div>
    </div>
  );
}

/** An editorial feature block for one tool. */
export function ToolSpotlight({ tool, eyebrow }: { tool: Tool; eyebrow: string }) {
  const { tl, t } = useI18n();
  const Icon = tool.icon;
  const category = categoryMap.get(tool.category);

  return (
    <Link to={tool.route} className="group block border-t-2 border-ink pt-4">
      <div className="flex items-center justify-between gap-3">
        <span className="nova-caps text-accent">{eyebrow}</span>
        <span className="flex h-9 w-9 items-center justify-center border border-line bg-bg text-muted transition-colors group-hover:border-ink group-hover:text-ink">
          <Icon className="h-4 w-4" strokeWidth={1.7} />
        </span>
      </div>

      <h3 className="mt-6 font-serif text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink">
        {tl(tool.name)}
      </h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{tl(tool.description)}</p>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="nova-caps">{category ? tl(category.name) : ''}</span>
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent">
          {t('common.open')}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function ToolChip({ tool }: { tool: Tool }) {
  const { tl } = useI18n();
  const Icon = tool.icon;

  return (
    <Link
      to={tool.route}
      className={cn(
        'group inline-flex shrink-0 items-center gap-2 border border-line bg-surface py-1.5 pl-2 pr-3',
        'text-[12.5px] text-ink transition-colors duration-150 hover:border-ink',
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-faint transition-colors group-hover:text-ink" strokeWidth={1.7} />
      <span className="truncate">{tl(tool.name)}</span>
    </Link>
  );
}

export function ToolRow({ tool, meta }: { tool: Tool; meta?: string }) {
  const { tl } = useI18n();
  return (
    <Link
      to={tool.route}
      className="group flex items-center gap-3 border-b border-line py-2.5 transition-colors duration-150 last:border-0 hover:bg-accent/[0.04]"
    >
      <ToolIcon tool={tool} className="h-7 w-7 group-hover:text-ink" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink">{tl(tool.name)}</span>
        <span className="block truncate font-mono text-[11px] text-faint">{meta ?? tl(tool.description)}</span>
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
