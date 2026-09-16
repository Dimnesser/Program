import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Flame, Sparkles, Star, StickyNote, TrendingUp, Zap } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecent } from '@/hooks/useRecent';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { StorageKeys } from '@/lib/storage';
import { popularTools, toolMap, tools } from '@/data/tools';
import { categories } from '@/data/categories';
import { formatSpan, isoWeekKey } from '@/lib/utils';
import { SmartSearch } from '@/components/SmartSearch';
import { ToolCard, ToolChip, ToolRow } from '@/components/ToolCard';
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
  'notes',
  'pomodoro',
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

export default function Home() {
  const { t, tl, locale } = useI18n();
  const { favorites } = useFavorites();
  const { recent, usage } = useRecent();
  const [notes] = useLocalStorage<Note[]>(StorageKeys.notes, []);
  useDocumentTitle(t('dash.question'));

  const greeting = t(greetingKey(new Date().getHours()));

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

  /** Recommendations lean on the user's own history: same categories, tools not yet tried. */
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
    return merged.slice(0, 4);
  }, [recent]);

  const weekCount = usage.weekly[isoWeekKey()] ?? 0;
  const topTool = useMemo(() => {
    const sorted = [...recent].sort((a, b) => b.count - a.count);
    return sorted[0] ? toolMap.get(sorted[0].toolId) : undefined;
  }, [recent]);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="pt-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[13px] font-medium text-muted">
            {greeting} <span aria-hidden="true">👋</span>
          </p>
          <PrivacyBadge className="hidden sm:inline-flex" />
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">{t('dash.question')}</h1>
        <p className="mt-2 text-[15px] text-muted">{t('dash.searchHint')}</p>

        <div className="mt-6 max-w-3xl">
          <SmartSearch />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickActions.map((tool) => (
            <ToolChip key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* Stats */}
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
            value={usage.total > 0 ? `~${formatSpan(usage.total * 120)}` : '—'}
            hint={usage.total > 0 ? '≈2 min / tool' : undefined}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatTile
            label={t('dash.statsFavorite')}
            value={topTool ? tl(topTool.name) : '—'}
            icon={<Star className="h-4 w-4" />}
          />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-8">
          {/* Favorites */}
          <section>
            <SectionHeader
              title={t('dash.favoriteTools')}
              icon={<Star className="h-4 w-4" />}
              action={
                favoriteTools.length > 0 ? (
                  <Link
                    to="/favorites"
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-muted transition-colors hover:text-ink"
                  >
                    {t('common.all')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null
              }
            />
            {favoriteTools.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {favoriteTools.slice(0, 6).map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={<Star className="h-4 w-4" />}
                title={t('dash.noFavorites')}
                description={t('dash.noFavoritesHint')}
              />
            )}
          </section>

          {/* Recommended */}
          <section>
            <SectionHeader
              title={t('dash.recommended')}
              subtitle={recent.length > 0 ? undefined : t('dash.popularTools')}
              icon={<Sparkles className="h-4 w-4" />}
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              {recommended.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>

          {/* Categories */}
          <section>
            <SectionHeader title={t('nav.categories')} icon={<Zap className="h-4 w-4" />} />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {categories.map((category) => {
                const Icon = category.icon;
                const count = tools.filter((tool) => tool.category === category.id).length;
                return (
                  <Link
                    key={category.id}
                    to={`/tools?category=${category.id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-line bg-card/60 p-3.5 transition-all duration-200 ease-nova hover:-translate-y-0.5 hover:border-line-strong hover:bg-card hover:shadow-lift"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface"
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

        <div className="space-y-8">
          {/* Recent */}
          <section>
            <SectionHeader
              title={t('dash.recentTools')}
              icon={<Clock className="h-4 w-4" />}
              action={
                recentTools.length > 0 ? (
                  <Link
                    to="/history"
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-muted transition-colors hover:text-ink"
                  >
                    {t('nav.history')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null
              }
            />
            {recentTools.length > 0 ? (
              <div className="rounded-2xl border border-line bg-card/50 p-1.5">
                {recentTools.map(({ tool, entry }) => (
                  <ToolRow key={tool.id} tool={tool} meta={relativeTime(entry.at, locale)} />
                ))}
              </div>
            ) : (
              <EmptyState compact icon={<Clock className="h-4 w-4" />} title={t('dash.noRecent')} />
            )}
          </section>

          {/* Saved items */}
          <section>
            <SectionHeader title={t('dash.savedItems')} icon={<StickyNote className="h-4 w-4" />} />
            {notes.length > 0 ? (
              <div className="space-y-2">
                {notes
                  .slice()
                  .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
                  .slice(0, 4)
                  .map((note) => (
                    <Link
                      key={note.id}
                      to="/tools/notes"
                      className="block rounded-xl border border-line bg-card/60 p-3 transition-colors hover:border-line-strong hover:bg-card"
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
            ) : (
              <EmptyState
                compact
                icon={<StickyNote className="h-4 w-4" />}
                title={t('notes.empty')}
                description={t('notes.emptyHint')}
              />
            )}
          </section>

          {/* Popular */}
          <section>
            <SectionHeader title={t('dash.trending')} icon={<TrendingUp className="h-4 w-4" />} />
            <div className="flex flex-wrap gap-2">
              {popularTools.slice(0, 8).map((tool) => (
                <ToolChip key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
