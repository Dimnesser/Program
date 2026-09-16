import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Eraser, Trash2, Type } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { analyzeText, textOps, type TextOpId } from './textOps';
import { downloadText, formatDuration } from '@/lib/utils';
import type { ToolProps } from '@/types';
import type { TranslationKey } from '@/lib/i18n';

interface Action {
  id: TextOpId;
  labelKey: TranslationKey;
  group: 'case' | 'clean' | 'lines';
}

const ACTIONS: Action[] = [
  { id: 'uppercase', labelKey: 'text.uppercase', group: 'case' },
  { id: 'lowercase', labelKey: 'text.lowercase', group: 'case' },
  { id: 'titleCase', labelKey: 'text.titleCase', group: 'case' },
  { id: 'sentenceCase', labelKey: 'text.sentenceCase', group: 'case' },
  { id: 'camelCase', labelKey: 'text.camelCase', group: 'case' },
  { id: 'snakeCase', labelKey: 'text.snakeCase', group: 'case' },
  { id: 'kebabCase', labelKey: 'text.kebabCase', group: 'case' },

  { id: 'removeExtraSpaces', labelKey: 'text.removeSpaces', group: 'clean' },
  { id: 'removeEmptyLines', labelKey: 'text.removeEmptyLines', group: 'clean' },
  { id: 'trimLines', labelKey: 'text.trimLines', group: 'clean' },
  { id: 'removeLineBreaks', labelKey: 'text.removeLineBreaks', group: 'clean' },
  { id: 'removePunctuation', labelKey: 'text.removePunctuation', group: 'clean' },

  { id: 'sortLines', labelKey: 'text.sortLines', group: 'lines' },
  { id: 'sortLinesDesc', labelKey: 'text.sortLinesDesc', group: 'lines' },
  { id: 'dedupeLines', labelKey: 'text.dedupe', group: 'lines' },
  { id: 'numberLines', labelKey: 'text.numberLines', group: 'lines' },
  { id: 'reverse', labelKey: 'text.reverse', group: 'lines' },
];

export default function TextToolkit({ preset, initial }: ToolProps) {
  const { t, locale } = useI18n();
  const [input, setInput] = useState(initial?.text ?? '');
  const [output, setOutput] = useState('');

  useEffect(() => {
    if (initial?.text) setInput(initial.text);
  }, [initial?.text]);

  const stats = useMemo(() => analyzeText(input), [input]);
  const outputStats = useMemo(() => (output ? analyzeText(output) : null), [output]);

  const visibleActions = useMemo(() => {
    if (preset === 'case') return ACTIONS.filter((action) => action.group === 'case');
    if (preset === 'clean') return ACTIONS.filter((action) => action.group !== 'case');
    return ACTIONS;
  }, [preset]);

  const statItems = [
    { label: t('text.words'), value: stats.words },
    { label: t('text.characters'), value: stats.characters },
    { label: t('text.charactersNoSpaces'), value: stats.charactersNoSpaces },
    { label: t('text.lines'), value: stats.lines },
    { label: t('text.paragraphs'), value: stats.paragraphs },
    { label: t('text.sentences'), value: stats.sentences },
    { label: t('text.readingTime'), value: formatDuration(stats.readingSeconds) },
    { label: t('text.speakingTime'), value: formatDuration(stats.speakingSeconds) },
  ];

  const apply = (id: TextOpId) => setOutput(textOps[id](input));

  const groupLabels: Record<Action['group'], string> = {
    case: t('text.titleCase'),
    clean: t('text.tools'),
    lines: t('text.lines'),
  };

  return (
    <div className="space-y-5">
      {/* Live statistics */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {statItems.map((item) => (
          <div key={item.label} className="rounded-xl border border-line bg-card/60 px-3 py-2.5">
            <div className="truncate text-[10px] uppercase tracking-[0.06em] text-faint" title={item.label}>
              {item.label}
            </div>
            <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-ink">
              {typeof item.value === 'number' ? item.value.toLocaleString(locale) : item.value}
            </div>
          </div>
        ))}
      </div>

      {preset !== 'counter' ? (
        <Card className="p-4">
          <div className="space-y-4">
            {(['case', 'clean', 'lines'] as const)
              .filter((group) => visibleActions.some((action) => action.group === group))
              .map((group) => (
                <div key={group}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
                    {groupLabels[group]}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {visibleActions
                      .filter((action) => action.group === group)
                      .map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => apply(action.id)}
                          disabled={!input}
                          className="nova-chip disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {t(action.labelKey)}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[13px] font-medium text-muted">
              <Type className="h-3.5 w-3.5" />
              {t('common.input')}
            </span>
            <Button
              size="xs"
              variant="ghost"
              icon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => {
                setInput('');
                setOutput('');
              }}
              disabled={!input}
            >
              {t('common.clear')}
            </Button>
          </div>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('text.placeholder')}
            className="min-h-[300px]"
            aria-label={t('common.input')}
          />
        </Card>

        <Card className="flex flex-col p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[13px] font-medium text-muted">
              <Eraser className="h-3.5 w-3.5" />
              {t('common.output')}
              {outputStats ? <span className="text-faint">· {outputStats.words}</span> : null}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                size="xs"
                variant="ghost"
                icon={<ArrowLeft className="h-3.5 w-3.5" />}
                disabled={!output}
                onClick={() => setInput(output)}
              >
                {t('text.useResult')}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                icon={<Download className="h-3.5 w-3.5" />}
                disabled={!output}
                onClick={() => downloadText(output, `nova-text-${Date.now()}.txt`)}
              >
                TXT
              </Button>
              <CopyButton value={output} size="xs" variant="ghost" compact />
            </div>
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder={t('text.outputPlaceholder')}
            className="min-h-[300px] bg-surface/50"
            aria-label={t('common.output')}
          />
        </Card>
      </div>

      <PrivacyBadge />
    </div>
  );
}
