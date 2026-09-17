import { Star } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useFavorites } from '@/hooks/useFavorites';
import { usePreferences } from '@/hooks/usePreferences';
import { toolMap } from '@/data/tools';
import { ToolCard } from '@/components/ToolCard';
import { EmptyState } from '@/components/ui/States';
import { LinkButton } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Tool } from '@/types';

export default function FavoritesPage() {
  const { t } = useI18n();
  const { favorites } = useFavorites();
  const { compact } = usePreferences();
  useDocumentTitle(t('fav.title'), t('fav.subtitle'));

  const items = favorites.map((id) => toolMap.get(id)).filter((tool): tool is Tool => Boolean(tool));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">{t('fav.title')}</h1>
        <p className="mt-1.5 text-[15px] text-muted">{t('fav.subtitle')}</p>
      </header>

      {items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {items.map((tool) => (
            <ToolCard key={tool.id} tool={tool} compact={compact} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Star className="h-4 w-4" />}
          title={t('fav.empty')}
          description={t('fav.emptyHint')}
          action={
            <LinkButton to="/tools" variant="primary" size="sm">
              {t('nav.tools')}
            </LinkButton>
          }
        />
      )}
    </div>
  );
}
