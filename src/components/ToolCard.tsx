import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Tool } from '@/types';
import { useI18n } from '@/lib/i18n';
import { useFavorites } from '@/hooks/useFavorites';
import { categoryMap } from '@/data/categories';
import { cn } from '@/lib/utils';
import { Badge } from './ui/Badge';

export function ToolIcon({ tool, className }: { tool: Tool; className?: string }) {
  const Icon = tool.icon;
  const tint = categoryMap.get(tool.category)?.tint;
  return (
    <span
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface transition-colors duration-200',
        className,
      )}
      style={{ color: tint }}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
    </span>
  );
}

export function ToolCard({ tool, compact = false }: { tool: Tool; compact?: boolean }) {
  const { tl, t } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(tool.id);

  return (
    <div className="group relative">
      <Link
        to={tool.route}
        className={cn(
          'flex h-full flex-col rounded-2xl border border-line bg-card/70 p-4 transition-all duration-200 ease-nova',
          'hover:-translate-y-0.5 hover:border-line-strong hover:bg-card hover:shadow-lift',
          'focus-visible:-translate-y-0.5 focus-visible:border-accent/40',
        )}
      >
        <div className="flex items-start gap-3">
          <ToolIcon tool={tool} className="group-hover:border-line-strong" />
          <div className="min-w-0 flex-1 pr-7">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-ink">{tl(tool.name)}</h3>
              {tool.isNew ? (
                <Badge tone="accent" className="shrink-0">
                  {t('common.new')}
                </Badge>
              ) : null}
            </div>
            {!compact ? (
              <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{tl(tool.description)}</p>
            ) : null}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => toggleFavorite(tool.id)}
        aria-label={favorite ? t('tools.removeFavorite') : t('tools.addFavorite')}
        aria-pressed={favorite}
        title={favorite ? t('tools.removeFavorite') : t('tools.addFavorite')}
        className={cn(
          'absolute right-2.5 top-2.5 rounded-lg p-1.5 transition-all duration-150',
          favorite
            ? 'text-warning opacity-100'
            : 'text-faint opacity-0 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100',
        )}
      >
        <Star className={cn('h-4 w-4', favorite && 'fill-current')} />
      </button>
    </div>
  );
}

export function ToolChip({ tool }: { tool: Tool }) {
  const { tl } = useI18n();
  const Icon = tool.icon;
  const tint = categoryMap.get(tool.category)?.tint;

  return (
    <Link
      to={tool.route}
      className={cn(
        'group inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-card/70 py-2 pl-2.5 pr-3.5',
        'text-[13px] font-medium text-ink transition-all duration-200 ease-nova',
        'hover:-translate-y-0.5 hover:border-line-strong hover:bg-card hover:shadow-soft',
      )}
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-surface"
        style={{ color: tint }}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <span className="truncate">{tl(tool.name)}</span>
    </Link>
  );
}

export function ToolRow({ tool, meta }: { tool: Tool; meta?: string }) {
  const { tl } = useI18n();
  return (
    <Link
      to={tool.route}
      className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition-colors duration-150 hover:border-line hover:bg-card/70"
    >
      <ToolIcon tool={tool} className="h-9 w-9 rounded-lg" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink">{tl(tool.name)}</span>
        <span className="block truncate text-xs text-muted">{meta ?? tl(tool.description)}</span>
      </span>
    </Link>
  );
}
