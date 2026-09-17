import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Star, StickyNote } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useFavorites } from '@/hooks/useFavorites';
import { useRecent } from '@/hooks/useRecent';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { StorageKeys } from '@/lib/storage';
import { featuredTools, newTools, popularTools, toolMap, tools } from '@/data/tools';
import { categories } from '@/data/categories';
import { formatSpan, isoWeekKey } from '@/lib/utils';
import { SmartSearch } from '@/components/SmartSearch';
import { ToolChip, ToolIndexRow, ToolRow, ToolSpotlight } from '@/components/ToolCard';
import { SectionHeader, StatTile } from '@/components/ui/Card';
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

/** Day-of-year rotation: changes daily, never flickers between renders. */
function pickSpotlight(pool: Tool[]): Tool {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
  return pool[dayOfYear % pool.length];
}

export default function Home() {
  const { t, tl, locale } = useI18n();
  const { favorites } = useFavorites();
  const { recent, usage } = useRecent();
  const [notes] = useLocalStorage<Note[]>(StorageKeys.notes, []);
  useDocumentTitle(t('dash.question'));

  const hasHistory = recent.length > 0;
  const today = new Date().toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

  const quickActions = useMemo(
    () => QUICK_ACTION_IDS.map((id) => toolMap.get(id)).filter((tool): tool is Tool => Boolean(tool)),
    [],
  );

  const recentTools = useMemo(
    () =>
      recent
        .map((entry) => ({ tool: toolMap.get(entry.toolId), entry }))
        .filter((item): item is { tool: Tool; entry: (typeof recent)[number] } => Boolean(item.tool))
        .slice(0, 5),
    [recent],
  );

  const favoriteTools = useMemo(
    () => favorites.map((id) => toolMap.get(id)).filter((tool): tool is Tool => Boolean(tool)),
    [favorites],
  );

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
    return merged.slice(0, 8);
  }, [recent]);

  const spotlight = useMemo(() => pickSpotlight(featuredTools.length > 0 ? featuredTools : popularTools), []);
  const weekCount = usage.weekly[isoWeekKey()] ?? 0;

  const topTool = useMemo(() => {
    const sorted = [...recent].sort((a, b) => b.count - a.count);
    return sorted[0] ? toolMap.get(sorted[0].toolId) : undefined;
  }, [recent]);

  return (
    <div className="space-y-14">
      {/* Masthead */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <p className="nova-caps">
            {t(greetingKey(new Date().getHours()))} · {today}
          </p>
          <PrivacyBadge className="hidden sm:inline-flex" />
        </div>

        <h1 className="nova-display mt-8 max-w-3xl text-[42px] text-ink sm:text-[58px]">{t('dash.question')}</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">{t('dash.searchHint')}</p>

        <div className="mt-8 max-w-3xl">
          <SmartSearch />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {quickActions.map((tool) => (
            <ToolChip key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {hasHistory ? (
        <section>
          <SectionHeader title={t('dash.stats')} index="01" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
            <StatTile label={t('dash.statsWeek')} value={weekCount} accent={weekCount > 0} />
            <StatTile label={t('dash.statsTotal')} value={usage.total} />
            <StatTile label={t('dash.statsSaved')} value={`~${formatSpan(usage.total * 120)}`} hint="≈2 min / tool" />
            <StatTile label={t('dash.statsFavorite')} value={topTool ? tl(topTool.name) : '—'} />
          </div>
        </section>
      ) : null}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-12">
          {favoriteTools.length > 0 ? (
            <section>
              <SectionHeader
                title={t('dash.favoriteTools')}
                index={hasHistory ? '02' : '01'}
                action={
                  <Link
                    to="/favorites"
                    className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-caps text-muted transition-colors hover:text-ink"
                  >
                    {t('common.all')}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />
              <div className="border-t border-line">
                {favoriteTools.slice(0, 6).map((tool, index) => (
                  <ToolIndexRow key={tool.id} tool={tool} index={index + 1} />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <SectionHeader
              title={hasHistory ? t('dash.recommended') : t('dash.popularTools')}
              index={favoriteTools.length > 0 ? (hasHistory ? '03' : '02') : hasHistory ? '02' : '01'}
            />
            <div className="border-t border-line">
              {recommended.map((tool, index) => (
                <ToolIndexRow key={tool.id} tool={tool} index={index + 1} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title={t('nav.categories')} />
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {categories.map((category, index) => {
                const count = tools.filter((tool) => tool.category === category.id).length;
                return (
                  <Link
                    key={category.id}
                    to={`/tools?category=${category.id}`}
                    className="group flex items-baseline gap-3 border-b border-line py-2.5 transition-colors hover:border-ink"
                  >
                    <span className="font-mono text-[11px] text-faint">{String(index + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-ink">{tl(category.name)}</span>
                      <span className="block truncate text-[12px] text-muted">{tl(category.description)}</span>
                    </span>
                    <span className="font-mono text-[11px] text-faint">{count}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-12">
          <section>
            <ToolSpotlight tool={spotlight} eyebrow={t('dash.spotlight')} />
          </section>

          {hasHistory ? (
            <section>
              <SectionHeader
                title={t('dash.recentTools')}
                action={
                  <Link
                    to="/history"
                    className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-caps text-muted transition-colors hover:text-ink"
                  >
                    {t('nav.history')}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />
              <div>
                {recentTools.map(({ tool, entry }) => (
                  <ToolRow key={tool.id} tool={tool} meta={relativeTime(entry.at, locale)} />
                ))}
              </div>
            </section>
          ) : null}

          {newTools.length > 0 ? (
            <section>
              <SectionHeader title={t('common.new')} />
              <div className="flex flex-wrap gap-2">
                {newTools.map((tool) => (
                  <ToolChip key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          ) : null}

          {notes.length > 0 ? (
            <section>
              <SectionHeader title={t('dash.savedItems')} icon={<StickyNote className="h-3.5 w-3.5" />} />
              <div>
                {notes
                  .slice()
                  .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
                  .slice(0, 3)
                  .map((note) => (
                    <Link
                      key={note.id}
                      to="/tools/notes"
                      className="block border-b border-line py-2.5 transition-colors last:border-0 hover:bg-accent/[0.04]"
                    >
                      <p className="truncate text-[13px] font-medium text-ink">{note.title || t('notes.untitled')}</p>
                      <p className="mt-0.5 line-clamp-1 text-[12px] text-muted">
                        {note.body || t('notes.bodyPlaceholder')}
                      </p>
                    </Link>
                  ))}
                <Link
                  to="/tools/notes"
                  className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-caps text-accent"
                >
                  {notes.length} {t('notes.count')}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </section>
          ) : null}

          {hasHistory && favoriteTools.length === 0 ? (
            <section>
              <SectionHeader title={t('dash.noFavorites')} icon={<Star className="h-3.5 w-3.5" />} />
              <p className="text-[13px] leading-relaxed text-muted">{t('dash.noFavoritesHint')}</p>
            </section>
          ) : null}

          <section>
            <SectionHeader title={t('dash.trending')} icon={<Clock className="h-3.5 w-3.5" />} />
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
