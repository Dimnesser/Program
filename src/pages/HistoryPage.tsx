import { useMemo, useState } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useRecent } from '@/hooks/useRecent';
import { useToast } from '@/hooks/useToast';
import { toolMap } from '@/data/tools';
import { ToolRow } from '@/components/ToolCard';
import { EmptyState } from '@/components/ui/States';
import { Button, LinkButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/PageHeader';
import { todayKey } from '@/lib/utils';
import type { RecentEntry, Tool } from '@/types';

type Group = { key: 'common.today' | 'common.yesterday' | 'common.earlier'; entries: RecentEntry[] };

export default function HistoryPage() {
  const { t, locale } = useI18n();
  const { recent, clear } = useRecent();
  const { success } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  useDocumentTitle(t('history.title'), t('history.subtitle'));

  const groups = useMemo<Group[]>(() => {
    const today = todayKey();
    const yesterday = todayKey(new Date(Date.now() - 86400000));
    const buckets: Group[] = [
      { key: 'common.today', entries: [] },
      { key: 'common.yesterday', entries: [] },
      { key: 'common.earlier', entries: [] },
    ];
    for (const entry of recent) {
      const day = todayKey(new Date(entry.at));
      if (day === today) buckets[0].entries.push(entry);
      else if (day === yesterday) buckets[1].entries.push(entry);
      else buckets[2].entries.push(entry);
    }
    return buckets.filter((bucket) => bucket.entries.length > 0);
  }, [recent]);

  const formatTime = (timestamp: number) => {
    const diff = timestamp - Date.now();
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const minutes = Math.round(diff / 60000);
    if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
    const hours = Math.round(diff / 3600000);
    if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
    return new Date(timestamp).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="NOVA"
        title={t('history.title')}
        subtitle={t('history.subtitle')}
        action={
          recent.length > 0 ? (
            <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setConfirmOpen(true)}>
              {t('history.clear')}
            </Button>
          ) : (
            <PrivacyBadge />
          )
        }
      />

      {groups.length > 0 ? (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="nova-caps mb-2 border-b border-line pb-2">{t(group.key)}</h2>
              <div>
                {group.entries.map((entry) => {
                  const tool: Tool | undefined = toolMap.get(entry.toolId);
                  if (!tool) return null;
                  const times = `${entry.count} ${t(entry.count === 1 ? 'history.times_one' : 'history.times_other')}`;
                  return <ToolRow key={entry.toolId} tool={tool} meta={`${formatTime(entry.at)} · ${times}`} />;
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Clock className="h-4 w-4" />}
          title={t('history.empty')}
          description={t('history.emptyHint')}
          action={
            <LinkButton to="/tools" variant="primary" size="sm">
              {t('nav.tools')}
            </LinkButton>
          }
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          clear();
          success(t('history.cleared'));
        }}
        title={t('history.clear')}
        description={t('history.subtitle')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
