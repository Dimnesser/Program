import { Link } from 'react-router-dom';
import { ArrowUpRight, Star } from 'lucide-react';
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
        'nova-glyph flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface',
        'transition-colors duration-200',
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
          'nova-card nova-interactive flex h-full flex-col rounded-2xl',
          compact ? 'p-3' : 'p-4',
          'hover:border-line-strong focus-visible:-translate-y-0.5 focus-visible:border-accent/50',
        )}
      >
        <div className="flex items-start gap-3">
          <ToolIcon tool={tool} className={cn(compact && 'h-9 w-9 rounded-lg')} />
          <div className="min-w-0 flex-1 pr-6">
            <div className="flex items-center gap-1.5">
              <h3 className={cn('truncate font-semibold text-ink', compact ? 'text-[13px]' : 'text-sm')}>
                {tl(tool.name)}
              </h3>
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

        <ArrowUpRight
          className={cn(
            'absolute bottom-3 right-3 h-3.5 w-3.5 text-faint opacity-0 transition-all duration-200',
            'group-hover:translate-x-0.5 group-hover:opacity-100',
            compact && 'hidden',
          )}
          aria-hidden="true"
        />
      </Link>

      <button
        type="button"
        onClick={() => toggleFavorite(tool.id)}
        aria-label={favorite ? t('tools.removeFavorite') : t('tools.addFavorite')}
        aria-pressed={favorite}
        title={favorite ? t('tools.removeFavorite') : t('tools.addFavorite')}
        className={cn(
          'absolute right-2 top-2 rounded-lg p-1.5 transition-all duration-150',
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

/** A large, editorial card used to spotlight one tool on the dashboard. */
export function ToolSpotlight({ tool, eyebrow }: { tool: Tool; eyebrow: string }) {
  const { tl, t } = useI18n();
  const open = t('common.open');
  const tint = categoryMap.get(tool.category)?.tint;
  const Icon = tool.icon;

  return (
    <Link
      to={tool.route}
      className="nova-card nova-interactive group relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 hover:border-line-strong"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-[0.16] blur-2xl transition-opacity duration-300 group-hover:opacity-25"
        style={{ background: tint }}
      />

      <div className="flex items-start justify-between gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">{eyebrow}</span>
        <span
          className="nova-glyph flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-surface"
          style={{ color: tint }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-semibold tracking-[-0.025em] text-ink">{tl(tool.name)}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{tl(tool.description)}</p>
      </div>

      <span className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent">
        {open}
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </Link>
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
        className="nova-glyph flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-surface"
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
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
