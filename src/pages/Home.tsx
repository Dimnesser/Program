import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Flame, Sparkles, Star, StickyNote, TrendingUp, Zap } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecent } from '@/hooks/useRecent';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePreferences } from '@/hooks/usePreferences';
import { StorageKeys } from '@/lib/storage';
import { featuredTools, newTools, popularTools, toolMap, tools } from '@/data/tools';
import { categories } from '@/data/categories';
import { formatSpan, isoWeekKey, cn } from '@/lib/utils';
import { SmartSearch } from '@/components/SmartSearch';
import { ToolCard, ToolChip, ToolRow, ToolSpotlight } from '@/components/ToolCard';
import { SectionHeader, StatTile } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Note, Tool } from '@/types';

const QUICK_ACTION_IDS = [
  'qr-generator',
  'calculator',
  'image-compressor',
  'text-formatter',
  'unit-converter',
  'password-generator',
  'diff-checker',
  'notes',
];

function greetingKey(hour: number) {
  if (hour < 5) return 'dash.night' as const;
  if (hour < 12) return 'dash.morning' as const;
  if (hour < 18) return 'dash.afternoon' as const;
  return 'dash.evening' as const;
}

function relativeTime(timestamp: number, locale: string): string {
  const diff = timestamp - Date.now();
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
  const hours = Math.round(diff / 3600000);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  return formatter.format(Math.round(diff / 86400000), 'day');
}

/** Day-of-year rotation: the spotlight changes daily but never flickers on re-render. */
function pickSpotlight(pool: Tool[]): Tool {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
  return pool[dayOfYear % pool.length];
}

export default function Home() {
  const { t, tl, locale } = useI18n();
  const { favorites } = useFavorites();
  const { recent, usage } = useRecent();
  const { compact } = usePreferences();
  const [notes] = useLocalStorage<Note[]>(StorageKeys.notes, []);
  useDocumentTitle(t('dash.question'));

  const greeting = t(greetingKey(new Date().getHours()));
  const hasHistory = recent.length > 0;

  const quickActions = useMemo(
    () => QUICK_ACTION_IDS.map((id) => toolMap.get(id)).filter((tool): tool is Tool => Boolean(tool)),
    [],
  );

  const recentTools = useMemo(
    () =>
      recent
        .map((entry) => ({ tool: toolMap.get(entry.toolId), entry }))
        .filter((item): item is { tool: Tool; entry: (typeof recent)[number] } => Boolean(item.tool))
        .slice(0, 6),
    [recent],
  );

  const favoriteTools = useMemo(
    () => favorites.map((id) => toolMap.get(id)).filter((tool): tool is Tool => Boolean(tool)),
    [favorites],
  );

  /** Recommendations follow the user's own history; popular tools fill the gap. */
  const recommended = useMemo(() => {
    const usedCategories = new Set(
      recent.map((entry) => toolMap.get(entry.toolId)?.category).filter(Boolean) as string[],
    );
    const usedIds = new Set(recent.map((entry) => entry.toolId));
    const fromHistory = tools.filter((tool) => usedCategories.has(tool.category) && !usedIds.has(tool.id));
    const fallback = popularTools.filter((tool) => !usedIds.has(tool.id));

    const merged: Tool[] = [];
    for (const tool of [...fromHistory, ...fallback]) {
      if (!merged.some((item) => item.id === tool.id)) merged.push(tool);
    }
    return merged.slice(0, hasHistory ? 4 : 6);
  }, [recent, hasHistory]);

  const spotlight = useMemo(() => pickSpotlight(featuredTools.length > 0 ? featuredTools : popularTools), []);
  const weekCount = usage.weekly[isoWeekKey()] ?? 0;

  const topTool = useMemo(() => {
    const sorted = [...recent].sort((a, b) => b.count - a.count);
    return sorted[0] ? toolMap.get(sorted[0].toolId) : undefined;
  }, [recent]);

  const gridClass = cn('grid gap-3 sm:grid-cols-2 2xl:grid-cols-3', compact && 'gap-2 xl:grid-cols-3 2xl:grid-cols-4');

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="pt-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[13px] font-medium text-muted">
            {greeting} <span aria-hidden="true">👋</span>
          </p>
          <PrivacyBadge className="hidden sm:inline-flex" />
        </div>
        <h1 className="nova-display mt-2 text-[34px] text-ink sm:text-[44px]">{t('dash.question')}</h1>
        <p className="mt-3 text-[15px] text-muted">{t('dash.searchHint')}</p>

        <div className="mt-6 max-w-3xl">
          <SmartSearch />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickActions.map((tool) => (
            <ToolChip key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* Stats only once there is something real to count */}
      {hasHistory ? (
        <section>
          <SectionHeader title={t('dash.stats')} icon={<TrendingUp className="h-4 w-4" />} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label={t('dash.statsWeek')}
              value={weekCount}
              icon={<Zap className="h-4 w-4" />}
              accent={weekCount > 0}
            />
            <StatTile label={t('dash.statsTotal')} value={usage.total} icon={<Flame className="h-4 w-4" />} />
            <StatTile
              label={t('dash.statsSaved')}
              value={`~${formatSpan(usage.total * 120)}`}
              hint="≈2 min / tool"
              icon={<Clock className="h-4 w-4" />}
            />
            <StatTile
              label={t('dash.statsFavorite')}
              value={topTool ? tl(topTool.name) : '—'}
              icon={<Star className="h-4 w-4" />}
            />
          </div>
        </section>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          {favoriteTools.length > 0 ? (
            <section>
              <SectionHeader
                title={t('dash.favoriteTools')}
                icon={<Star className="h-4 w-4" />}
                action={
                  <Link
                    to="/favorites"
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-muted transition-colors hover:text-ink"
                  >
                    {t('common.all')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className={gridClass}>
                {favoriteTools.slice(0, compact ? 8 : 6).map((tool) => (
                  <ToolCard key={tool.id} tool={tool} compact={compact} />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <SectionHeader
              title={hasHistory ? t('dash.recommended') : t('dash.popularTools')}
              icon={<Sparkles className="h-4 w-4" />}
            />
            <div className={gridClass}>
              {recommended.map((tool) => (
                <ToolCard key={tool.id} tool={tool} compact={compact} />
              ))}
            </div>
          </section>

          {newTools.length > 0 ? (
            <section>
              <SectionHeader title={t('common.new')} icon={<Sparkles className="h-4 w-4" />} />
              <div className="flex flex-wrap gap-2">
                {newTools.map((tool) => (
                  <ToolChip key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <SectionHeader title={t('nav.categories')} icon={<Zap className="h-4 w-4" />} />
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {categories.map((category) => {
                const Icon = category.icon;
                const count = tools.filter((tool) => tool.category === category.id).length;
                return (
                  <Link
                    key={category.id}
                    to={`/tools?category=${category.id}`}
                    className="nova-card nova-interactive group flex items-center gap-3 rounded-2xl p-3.5 hover:border-line-strong"
                  >
                    <span
                      className="nova-glyph flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface"
                      style={{ color: category.tint }}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ink">{tl(category.name)}</span>
                      <span className="block text-xs text-faint">{count}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <section>
            <SectionHeader title={t('dash.spotlight')} icon={<Sparkles className="h-4 w-4" />} />
            <ToolSpotlight tool={spotlight} eyebrow={t('dash.spotlightEyebrow')} />
          </section>

          {hasHistory ? (
            <section>
              <SectionHeader
                title={t('dash.recentTools')}
                icon={<Clock className="h-4 w-4" />}
                action={
                  <Link
                    to="/history"
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-muted transition-colors hover:text-ink"
                  >
                    {t('nav.history')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="nova-card rounded-2xl p-1.5">
                {recentTools.map(({ tool, entry }) => (
                  <ToolRow key={tool.id} tool={tool} meta={relativeTime(entry.at, locale)} />
                ))}
              </div>
            </section>
          ) : null}

          {hasHistory && favoriteTools.length === 0 ? (
            <EmptyState
              compact
              icon={<Star className="h-4 w-4" />}
              title={t('dash.noFavorites')}
              description={t('dash.noFavoritesHint')}
            />
          ) : null}

          {notes.length > 0 ? (
            <section>
              <SectionHeader title={t('dash.savedItems')} icon={<StickyNote className="h-4 w-4" />} />
              <div className="space-y-2">
                {notes
                  .slice()
                  .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
                  .slice(0, 4)
                  .map((note) => (
                    <Link
                      key={note.id}
                      to="/tools/notes"
                      className="nova-card nova-interactive block rounded-xl p-3 hover:border-line-strong"
                    >
                      <p className="truncate text-[13px] font-medium text-ink">{note.title || t('notes.untitled')}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">
                        {note.body || t('notes.bodyPlaceholder')}
                      </p>
                    </Link>
                  ))}
                <Link
                  to="/tools/notes"
                  className="inline-flex items-center gap-1 px-1 text-[13px] font-medium text-accent transition-colors hover:brightness-110"
                >
                  {notes.length} {t('notes.count')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>
          ) : null}

          <section>
            <SectionHeader title={t('dash.trending')} icon={<TrendingUp className="h-4 w-4" />} />
            <div className="flex flex-wrap gap-2">
              {popularTools.slice(0, 10).map((tool) => (
                <ToolChip key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
