import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Layers, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { StorageKeys } from '@/lib/storage';
import { Card } from '@/components/ui/Card';
import { Input, Segmented, Textarea } from '@/components/ui/Field';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { cn, uid } from '@/lib/utils';
import type { Flashcard } from '@/types';

const SAMPLE: Flashcard[] = [
  { id: 'c1', front: 'Ctrl + K', back: 'Command palette у NOVA', deck: 'NOVA', known: false },
  { id: 'c2', front: 'localStorage', back: 'Сховище браузера, де NOVA тримає ваші дані', deck: 'NOVA', known: false },
  { id: 'c3', front: 'PWA', back: 'Progressive Web App — сайт, який можна встановити', deck: 'NOVA', known: false },
];

export default function Flashcards() {
  const { t } = useI18n();
  const [cards, setCards] = useLocalStorage<Flashcard[]>(StorageKeys.flashcards, SAMPLE);
  const [mode, setMode] = useState<'study' | 'manage'>('study');
  const [deck, setDeck] = useState('all');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [draft, setDraft] = useState({ front: '', back: '', deck: '' });

  const decks = useMemo(() => [...new Set(cards.map((card) => card.deck))].filter(Boolean), [cards]);
  const visible = useMemo(
    () => (deck === 'all' ? cards : cards.filter((card) => card.deck === deck)),
    [cards, deck],
  );

  const current = visible[Math.min(index, Math.max(0, visible.length - 1))];
  const knownCount = visible.filter((card) => card.known).length;

  const go = (delta: number) => {
    if (visible.length === 0) return;
    setFlipped(false);
    setIndex((value) => (value + delta + visible.length) % visible.length);
  };

  const addCard = () => {
    if (!draft.front.trim() || !draft.back.trim()) return;
    setCards([
      ...cards,
      {
        id: uid('f'),
        front: draft.front.trim(),
        back: draft.back.trim(),
        deck: draft.deck.trim() || t('cards.deck'),
        known: false,
      },
    ]);
    setDraft({ front: '', back: '', deck: draft.deck });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={mode}
          onChange={setMode}
          ariaLabel={t('cards.study')}
          className="w-auto"
          options={[
            { value: 'study', label: t('cards.study') },
            { value: 'manage', label: t('cards.manage') },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setDeck('all');
              setIndex(0);
            }}
            className={cn('nova-chip', deck === 'all' && 'border-accent/40 bg-accent/10 text-accent')}
          >
            {t('cards.allDecks')} {cards.length}
          </button>
          {decks.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setDeck(name);
                setIndex(0);
              }}
              className={cn('nova-chip', deck === name && 'border-accent/40 bg-accent/10 text-accent')}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {mode === 'study' ? (
        visible.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-4 w-4" />}
            title={t('cards.empty')}
            description={t('cards.emptyHint')}
            action={
              <Button size="sm" variant="primary" onClick={() => setMode('manage')}>
                {t('cards.add')}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Card className="flex flex-col items-center gap-5 py-8">
              <button
                type="button"
                onClick={() => setFlipped(!flipped)}
                aria-label={t('cards.flip')}
                className={cn(
                  'flex min-h-[220px] w-full max-w-lg flex-col items-center justify-center rounded-2xl border px-6 py-8 text-center transition-all duration-300 ease-nova',
                  flipped ? 'border-accent/35 bg-accent/[0.06]' : 'border-line bg-surface/60 hover:border-line-strong',
                )}
              >
                <span className="text-[11px] uppercase tracking-[0.08em] text-faint">
                  {flipped ? t('cards.back') : t('cards.front')}
                </span>
                <span className="mt-4 text-xl font-medium leading-relaxed text-ink sm:text-2xl">
                  {flipped ? current.back : current.front}
                </span>
                <span className="mt-5 text-[11px] text-faint">{t('cards.flip')}</span>
              </button>

              <div className="flex items-center gap-2">
                <IconButton label={t('cards.prev')} variant="secondary" onClick={() => go(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </IconButton>
                <Button
                  variant={current.known ? 'success' : 'primary'}
                  onClick={() => {
                    setCards(cards.map((card) => (card.id === current.id ? { ...card, known: !card.known } : card)));
                    go(1);
                  }}
                >
                  {current.known ? t('cards.again') : t('cards.known')}
                </Button>
                <IconButton label={t('cards.next')} variant="secondary" onClick={() => go(1)}>
                  <ChevronRight className="h-4 w-4" />
                </IconButton>
              </div>

              <p className="font-mono text-[12px] text-faint">
                {Math.min(index + 1, visible.length)} / {visible.length}
              </p>
            </Card>

            <Card className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="text-muted">{t('cards.progress')}</span>
                  <span className="font-mono text-ink">
                    {knownCount} / {visible.length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-success transition-[width] duration-500"
                    style={{ width: `${visible.length ? (knownCount / visible.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {knownCount === visible.length && visible.length > 0 ? (
                <p className="rounded-xl border border-success/25 bg-success/[0.07] px-3.5 py-2.5 text-[13px] text-success">
                  {t('cards.finished')}
                </p>
              ) : null}

              <Button
                block
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={() => setCards(cards.map((card) => ({ ...card, known: false })))}
              >
                {t('cards.reset')}
              </Button>
            </Card>
          </div>
        )
      ) : (
        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="space-y-3">
            <Input
              label={t('cards.deck')}
              value={draft.deck}
              onChange={(event) => setDraft({ ...draft, deck: event.target.value })}
              placeholder={t('cards.newDeck')}
            />
            <Textarea
              label={t('cards.front')}
              value={draft.front}
              onChange={(event) => setDraft({ ...draft, front: event.target.value })}
              className="min-h-[90px]"
            />
            <Textarea
              label={t('cards.back')}
              value={draft.back}
              onChange={(event) => setDraft({ ...draft, back: event.target.value })}
              className="min-h-[90px]"
            />
            <Button
              variant="primary"
              block
              icon={<Plus className="h-4 w-4" />}
              onClick={addCard}
              disabled={!draft.front.trim() || !draft.back.trim()}
            >
              {t('cards.add')}
            </Button>
          </Card>

          <Card className="max-h-[520px] overflow-y-auto p-3">
            {cards.length === 0 ? (
              <EmptyState compact icon={<Layers className="h-4 w-4" />} title={t('cards.empty')} className="border-0" />
            ) : (
              <ul className="space-y-2">
                {cards.map((card) => (
                  <li
                    key={card.id}
                    className="flex items-start gap-3 rounded-xl border border-line bg-surface/50 px-3.5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{card.front}</p>
                      <p className="mt-0.5 truncate text-[12px] text-muted">{card.back}</p>
                      <span className="mt-1 inline-block rounded-full border border-line px-2 py-0.5 text-[10px] text-faint">
                        {card.deck}
                      </span>
                    </div>
                    <IconButton
                      label={t('common.delete')}
                      size="sm"
                      variant="danger"
                      onClick={() => setCards(cards.filter((item) => item.id !== card.id))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
