import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, Search, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { categories } from '@/data/categories';
import { tools } from '@/data/tools';
import { searchTools } from '@/lib/search';
import { usePreferences } from '@/hooks/usePreferences';
import { ToolCard, ToolIndexRow } from '@/components/ToolCard';
import { EmptyState } from '@/components/ui/States';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type { CategoryId } from '@/types';

type View = 'index' | 'grid';

export default function ToolsPage() {
  const { t, tl, language } = useI18n();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const { compact } = usePreferences();
  const [view, setView] = useState<View>('index');
  useDocumentTitle(t('tools.title'), t('tools.subtitle'));

  const activeCategory = (params.get('category') as CategoryId | null) ?? null;

  const visible = useMemo(() => {
    const base = activeCategory ? tools.filter((tool) => tool.category === activeCategory) : tools;
    if (!query.trim()) return base;
    const ranked = searchTools(query, language, 200).map((entry) => entry.tool);
    return ranked.filter((tool) => base.includes(tool));
  }, [activeCategory, query, language]);

  const grouped = useMemo(() => {
    if (activeCategory || query.trim()) return null;
    return categories.map((category) => ({
      category,
      items: tools.filter((tool) => tool.category === category.id),
    }));
  }, [activeCategory, query]);

  const setCategory = (id: CategoryId | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('category', id);
    else next.delete('category');
    setParams(next, { replace: true });
  };

  const renderList = (items: typeof tools, offset = 0, showCategory = true) =>
    view === 'grid' || compact ? (
      <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4', compact && 'gap-2 2xl:grid-cols-5')}>
        {items.map((tool) => (
          <ToolCard key={tool.id} tool={tool} compact={compact} />
        ))}
      </div>
    ) : (
      <div className="border-t border-line">
        {items.map((tool, index) => (
          <ToolIndexRow key={tool.id} tool={tool} index={offset + index + 1} showCategory={showCategory} />
        ))}
      </div>
    );

  return (
    <div className="space-y-10">
      <header className="border-b border-ink pb-6">
        <p className="nova-caps">{t('nav.categories')} · {tools.length}</p>
        <h1 className="nova-display mt-3 text-[40px] text-ink sm:text-[52px]">{t('tools.title')}</h1>
        <p className="mt-3 max-w-xl text-[15px] text-muted">{t('tools.subtitle')}</p>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('common.searchAnything')}
            aria-label={t('common.search')}
            className="h-9 w-full border-b border-line bg-transparent pl-6 pr-7 text-[14px] text-ink outline-none transition-colors placeholder:text-faint focus:border-ink"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('common.clear')}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-faint transition-colors hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-1 border border-line p-0.5">
          {([
            { id: 'index' as View, icon: List, label: t('tools.viewIndex') },
            { id: 'grid' as View, icon: LayoutGrid, label: t('tools.viewGrid') },
          ]).map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setView(option.id)}
                aria-pressed={view === option.id}
                aria-label={option.label}
                title={option.label}
                className={cn(
                  'flex h-7 w-7 items-center justify-center transition-colors',
                  view === option.id ? 'bg-ink text-bg' : 'text-faint hover:text-ink',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Category filter, set as a run of links rather than buttons */}
      <div className="-mx-1 flex max-w-full flex-wrap gap-x-5 gap-y-2 border-y border-line px-1 py-3">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={cn(
            'font-mono text-[11px] uppercase tracking-caps transition-colors',
            !activeCategory ? 'text-ink underline decoration-accent underline-offset-4' : 'text-faint hover:text-muted',
          )}
        >
          {t('common.all')} <span className="text-faint">{tools.length}</span>
        </button>
        {categories.map((category) => {
          const count = tools.filter((tool) => tool.category === category.id).length;
          const active = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategory(active ? null : category.id)}
              className={cn(
                'font-mono text-[11px] uppercase tracking-caps transition-colors',
                active ? 'text-ink underline decoration-accent underline-offset-4' : 'text-faint hover:text-muted',
              )}
            >
              {tl(category.name)} <span className="text-faint">{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<Search className="h-4 w-4" />} title={t('tools.empty')} description={t('search.noResultsHint')} />
      ) : grouped ? (
        <div className="space-y-12">
          {grouped.map(({ category, items }, groupIndex) => (
            <section key={category.id}>
              <div className="mb-3 flex items-end justify-between gap-4 border-b border-line pb-2">
                <h2 className="flex items-baseline gap-3 font-sans text-[13px] font-semibold uppercase tracking-caps text-ink">
                  <span className="font-mono text-[11px] font-normal text-faint">
                    {String(groupIndex + 1).padStart(2, '0')}
                  </span>
                  {tl(category.name)}
                </h2>
                <p className="hidden truncate text-[12px] text-muted sm:block">{tl(category.description)}</p>
              </div>
              {renderList(items, 0, false)}
            </section>
          ))}
        </div>
      ) : (
        renderList(visible)
      )}
    </div>
  );
}
