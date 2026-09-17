import { useMemo, useState } from 'react';
import { Pin, PinOff, Plus, Search, Star, StickyNote, Trash2, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/useToast';
import { StorageKeys } from '@/lib/storage';
import { Card } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/States';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { cn, uid } from '@/lib/utils';
import type { Note } from '@/types';

export default function Notes() {
  const { t, locale } = useI18n();
  const { success } = useToast();
  const [notes, setNotes] = useLocalStorage<Note[]>(StorageKeys.notes, []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const search = query.trim().toLowerCase();
    return notes
      .filter(
        (note) =>
          !search ||
          note.title.toLowerCase().includes(search) ||
          note.body.toLowerCase().includes(search),
      )
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  }, [notes, query]);

  const groups = useMemo(() => {
    const pinned = sorted.filter((note) => note.pinned);
    const others = sorted.filter((note) => !note.pinned);
    return [
      { key: 'notes.pinned' as const, items: pinned },
      { key: 'notes.others' as const, items: others },
    ].filter((group) => group.items.length > 0);
  }, [sorted]);

  const active = notes.find((note) => note.id === activeId) ?? null;

  const create = () => {
    const note: Note = {
      id: uid('n'),
      title: '',
      body: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      favorite: false,
    };
    setNotes([note, ...notes]);
    setActiveId(note.id);
  };

  const update = (id: string, patch: Partial<Note>) => {
    setNotes((current) =>
      current.map((note) => (note.id === id ? { ...note, ...patch, updatedAt: Date.now() } : note)),
    );
  };

  const remove = (id: string) => {
    setNotes((current) => current.filter((note) => note.id !== id));
    if (activeId === id) setActiveId(null);
    success(t('toast.deleted'));
  };

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('notes.search')}
            aria-label={t('notes.search')}
            className="nova-field pl-10 pr-10"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('common.clear')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-faint hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={create}>
          {t('notes.new')}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <Card className="max-h-[560px] overflow-y-auto p-2">
          {sorted.length === 0 ? (
            <EmptyState
              compact
              icon={<StickyNote className="h-4 w-4" />}
              title={query ? t('notes.noResults') : t('notes.empty')}
              description={query ? undefined : t('notes.emptyHint')}
              className="border-0"
            />
          ) : (
            <ul className="space-y-1">
              {groups.map((group) => (
                <li key={group.key}>
                  {groups.length > 1 ? (
                    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
                      {t(group.key)}
                    </p>
                  ) : null}
                  <ul className="space-y-1">
                    {group.items.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(note.id)}
                    className={cn(
                      'w-full rounded-xl border px-3 py-2.5 text-left transition-colors duration-150',
                      note.id === activeId
                        ? 'border-accent/35 bg-accent/[0.07]'
                        : 'border-transparent hover:border-line hover:bg-surface/60',
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {note.pinned ? <Pin className="h-3 w-3 shrink-0 text-accent" /> : null}
                      {note.favorite ? <Star className="h-3 w-3 shrink-0 fill-current text-warning" /> : null}
                      <span className="truncate text-[13px] font-medium text-ink">
                        {note.title || t('notes.untitled')}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted">
                      {note.body || t('notes.bodyPlaceholder')}
                    </span>
                    <span className="mt-1 block text-[11px] text-faint">{formatDate(note.updatedAt)}</span>
                  </button>
                </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex min-h-[420px] flex-col p-4">
          {active ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <input
                  value={active.title}
                  onChange={(event) => update(active.id, { title: event.target.value })}
                  placeholder={t('notes.titlePlaceholder')}
                  aria-label={t('notes.titlePlaceholder')}
                  className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-ink outline-none placeholder:text-faint"
                />
                <IconButton
                  label={active.pinned ? t('notes.unpin') : t('notes.pin')}
                  size="sm"
                  active={active.pinned}
                  onClick={() => update(active.id, { pinned: !active.pinned })}
                >
                  {active.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </IconButton>
                <IconButton
                  label={t('tools.addFavorite')}
                  size="sm"
                  active={active.favorite}
                  onClick={() => update(active.id, { favorite: !active.favorite })}
                >
                  <Star className={cn('h-4 w-4', active.favorite && 'fill-current text-warning')} />
                </IconButton>
                <IconButton
                  label={t('common.delete')}
                  size="sm"
                  variant="danger"
                  onClick={() => setPendingDelete(active.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>

              <textarea
                value={active.body}
                onChange={(event) => update(active.id, { body: event.target.value })}
                placeholder={t('notes.bodyPlaceholder')}
                aria-label={t('notes.bodyPlaceholder')}
                className="flex-1 resize-none bg-transparent text-[14px] leading-relaxed text-ink outline-none placeholder:text-faint"
              />

              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[11px] text-faint">
                <span>
                  {t('notes.updated')}: {formatDate(active.updatedAt)}
                </span>
                <span>
                  {active.body.length} {t('common.characters')}
                </span>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<StickyNote className="h-4 w-4" />}
              title={t('notes.empty')}
              description={t('notes.emptyHint')}
              className="my-auto border-0"
              action={
                <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={create}>
                  {t('notes.new')}
                </Button>
              }
            />
          )}
        </Card>
      </div>

      <PrivacyBadge />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove(pendingDelete)}
        title={t('notes.deleteConfirm')}
        description={t('notes.deleteConfirmText')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
