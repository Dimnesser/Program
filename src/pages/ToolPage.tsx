import { Suspense, useEffect, useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { getToolByRoute } from '@/data/tools';
import { categoryMap } from '@/data/categories';
import { relatedTools } from '@/lib/search';
import { useFavorites } from '@/hooks/useFavorites';
import { recordToolUse } from '@/hooks/useRecent';
import { writeStorage, StorageKeys } from '@/lib/storage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ToolIcon, ToolChip } from '@/components/ToolCard';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToolSkeleton, EmptyState } from '@/components/ui/States';
import { LinkButton } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function ToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { t, tl } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();

  const tool = slug ? getToolByRoute(`/tools/${slug}`) : undefined;
  const category = tool ? categoryMap.get(tool.category) : undefined;
  const related = useMemo(() => (tool ? relatedTools(tool) : []), [tool]);
  const initial = (location.state as { initial?: Record<string, string> } | null)?.initial;

  useDocumentTitle(tool ? tl(tool.name) : t('tools.notFound'), tool ? tl(tool.description) : undefined);

  useEffect(() => {
    if (!tool) return;
    recordToolUse(tool.id);
    writeStorage(StorageKeys.onboarded, true);
  }, [tool]);

  if (!tool) {
    return (
      <EmptyState
        title={t('tools.notFound')}
        description={t('tools.notFoundHint')}
        action={
          <LinkButton to="/tools" variant="primary" size="sm">
            {t('nav.tools')}
          </LinkButton>
        }
      />
    );
  }

  const ToolComponent = tool.component;
  const favorite = isFavorite(tool.id);

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-faint">
        <Link to="/" className="transition-colors hover:text-ink">
          NOVA
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/tools?category=${tool.category}`} className="truncate transition-colors hover:text-ink">
          {category ? tl(category.name) : t('nav.tools')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-muted">{tl(tool.name)}</span>
      </nav>

      <header className="flex flex-wrap items-start gap-4">
        <ToolIcon tool={tool} className="h-12 w-12 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-[28px]">{tl(tool.name)}</h1>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">{tl(tool.description)}</p>
        </div>
        <div className="flex items-center gap-2">
          {tool.offline ? <PrivacyBadge className="hidden sm:inline-flex" /> : null}
          <button
            type="button"
            onClick={() => toggleFavorite(tool.id)}
            aria-pressed={favorite}
            aria-label={favorite ? t('tools.removeFavorite') : t('tools.addFavorite')}
            className={cn(
              'flex h-10 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-medium transition-all duration-150',
              favorite
                ? 'border-warning/35 bg-warning/10 text-warning'
                : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
            )}
          >
            <Star className={cn('h-4 w-4', favorite && 'fill-current')} />
            <span className="hidden sm:inline">{favorite ? t('tools.removeFavorite') : t('tools.addFavorite')}</span>
          </button>
        </div>
      </header>

      <ErrorBoundary
        resetKey={tool.id}
        fallbackTitle={t('error.title')}
        fallbackText={t('error.text')}
        reloadLabel={t('error.reload')}
      >
        <Suspense fallback={<ToolSkeleton />}>
          <ToolComponent preset={tool.preset} initial={initial} />
        </Suspense>
      </ErrorBoundary>

      {related.length > 0 ? (
        <section className="border-t border-line pt-6">
          <h2 className="mb-3 text-[13px] font-semibold text-muted">{t('tools.related')}</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((item) => (
              <ToolChip key={item.id} tool={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
