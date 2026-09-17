import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, Search, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { categories } from '@/data/categories';
import { tools } from '@/data/tools';
import { searchTools } from '@/lib/search';
import { usePreferences } from '@/hooks/usePreferences';
import { ToolCard } from '@/components/ToolCard';
import { EmptyState } from '@/components/ui/States';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type { CategoryId } from '@/types';

export default function ToolsPage() {
  const { t, tl, language } = useI18n();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const { compact } = usePreferences();
  useDocumentTitle(t('tools.title'), t('tools.subtitle'));

  const activeCategory = (params.get('category') as CategoryId | null) ?? null;

  const visible = useMemo(() => {
    const base = activeCategory ? tools.filter((tool) => tool.category === activeCategory) : tools;
    if (!query.trim()) return base;
    const ranked = searchTools(query, language, 100).map((entry) => entry.tool);
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

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">{t('tools.title')}</h1>
        <p className="mt-1.5 text-[15px] text-muted">{t('tools.subtitle')}</p>
      </header>

      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('common.searchAnything')}
            aria-label={t('common.search')}
            className="nova-field pl-10 pr-10"
            spellCheck={false}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('common.clear')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-faint transition-colors hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex max-w-full gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={cn(
              'nova-chip shrink-0',
              !activeCategory && 'border-accent/40 bg-accent/10 text-accent hover:text-accent',
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            {t('common.all')}
            <span className="text-faint">{tools.length}</span>
          </button>
          {categories.map((category) => {
            const Icon = category.icon;
            const count = tools.filter((tool) => tool.category === category.id).length;
            const active = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategory(active ? null : category.id)}
                className={cn('nova-chip shrink-0', active && 'border-accent/40 bg-accent/10 text-accent hover:text-accent')}
              >
                <Icon className="h-3.5 w-3.5" style={!active ? { color: category.tint } : undefined} />
                {tl(category.name)}
                <span className="text-faint">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<Search className="h-4 w-4" />} title={t('tools.empty')} description={t('search.noResultsHint')} />
      ) : grouped ? (
        <div className="space-y-10">
          {grouped.map(({ category, items }) => {
            const Icon = category.icon;
            return (
              <section key={category.id}>
                <div className="mb-4 flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-line bg-surface"
                    style={{ color: category.tint }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold text-ink">{tl(category.name)}</h2>
                    <p className="truncate text-xs text-muted">{tl(category.description)}</p>
                  </div>
                  <span className="ml-auto text-xs text-faint">{items.length}</span>
                </div>
                <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4', compact && 'gap-2 lg:grid-cols-4 2xl:grid-cols-6')}>
                  {items.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} compact={compact} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4', compact && 'gap-2 lg:grid-cols-4 2xl:grid-cols-6')}>
          {visible.map((tool) => (
            <ToolCard key={tool.id} tool={tool} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}
