import { useState } from 'react';
import { BookOpen, ListChecks, Save, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { StorageKeys } from '@/lib/storage';
import { Card } from '@/components/ui/Card';
import { Segmented, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { EmptyState } from '@/components/ui/States';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { uid } from '@/lib/utils';
import { localAnalyzer, type StudyAnalysis } from './analyzer';
import type { Flashcard, ToolProps } from '@/types';

type Length = 'short' | 'medium' | 'detailed';

export default function StudyAssistant({ initial }: ToolProps) {
  const { t, language } = useI18n();
  const { success, error } = useToast();
  const [, setCards] = useLocalStorage<Flashcard[]>(StorageKeys.flashcards, []);

  const [text, setText] = useState(initial?.text ?? '');
  const [length, setLength] = useState<Length>('medium');
  const [analysis, setAnalysis] = useState<StudyAnalysis | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (text.trim().split(/\s+/).length < 20) {
      error(t('ai.needMore'));
      return;
    }
    setBusy(true);
    try {
      setAnalysis(await localAnalyzer.analyze(text, { language, length }));
      success(t('toast.generated'));
    } finally {
      setBusy(false);
    }
  };

  const saveDeck = () => {
    if (!analysis || analysis.terms.length === 0) return;
    const deck = `${t('ai.title')} ${new Date().toLocaleDateString()}`;
    setCards((current) => [
      ...current,
      ...analysis.terms.map<Flashcard>((entry) => ({
        id: uid('f'),
        front: entry.term,
        back: entry.definition,
        deck,
        known: false,
      })),
    ]);
    success(t('toast.saved'));
  };

  const summaryText = analysis?.summary.join(' ') ?? '';

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_1fr]">
      <Card className="flex flex-col gap-4">
        <Textarea
          label={t('ai.input')}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t('ai.placeholder')}
          className="min-h-[340px]"
        />

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('ai.length')}</span>
          <Segmented
            value={length}
            onChange={setLength}
            ariaLabel={t('ai.length')}
            options={[
              { value: 'short', label: t('ai.short') },
              { value: 'medium', label: t('ai.medium') },
              { value: 'detailed', label: t('ai.detailed') },
            ]}
          />
        </div>

        <Button
          variant="primary"
          block
          loading={busy}
          icon={<Sparkles className="h-4 w-4" />}
          onClick={() => void run()}
          disabled={!text.trim()}
        >
          {t('ai.analyze')}
        </Button>

        <p className="text-[11px] leading-relaxed text-faint">{t('ai.localNotice')}</p>
        <PrivacyBadge />
      </Card>

      <div className="space-y-4">
        {!analysis ? (
          <Card className="flex min-h-[420px] items-center">
            <EmptyState
              icon={<BookOpen className="h-4 w-4" />}
              title={t('ai.title')}
              description={t('ai.localNotice')}
              className="w-full border-0"
            />
          </Card>
        ) : (
          <>
            <Card>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-[13px] font-semibold text-ink">{t('ai.summary')}</h2>
                <CopyButton value={summaryText} size="xs" variant="ghost" compact />
              </div>
              <p className="text-[14px] leading-relaxed text-muted">{summaryText || t('ai.needMore')}</p>
            </Card>

            <Card>
              <h2 className="mb-2 text-[13px] font-semibold text-ink">{t('ai.keyPoints')}</h2>
              <ul className="space-y-2">
                {analysis.keyPoints.map((point, index) => (
                  <li key={index} className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {point}
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h2 className="mb-2 text-[13px] font-semibold text-ink">{t('ai.questions')}</h2>
              <ol className="space-y-2">
                {analysis.questions.map((question, index) => (
                  <li key={index} className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
                    <span className="shrink-0 font-mono text-faint">{index + 1}.</span>
                    {question}
                  </li>
                ))}
              </ol>
            </Card>

            {analysis.terms.length > 0 ? (
              <Card>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-[13px] font-semibold text-ink">{t('ai.terms')}</h2>
                  <Button size="xs" icon={<Save className="h-3.5 w-3.5" />} onClick={saveDeck}>
                    {t('ai.saveCards')}
                  </Button>
                </div>
                <ul className="space-y-2">
                  {analysis.terms.map((entry) => (
                    <li key={entry.term} className="rounded-xl border border-line bg-surface/50 px-3.5 py-2.5">
                      <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                        <ListChecks className="h-3.5 w-3.5 shrink-0 text-accent" />
                        {entry.term}
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-muted">{entry.definition}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
