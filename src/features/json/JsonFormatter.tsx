import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Download, Minimize2, Quote, Sparkles, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Checkbox, Segmented, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Badge } from '@/components/ui/Badge';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { downloadText, formatBytes } from '@/lib/utils';
import { highlightJson, inspectJson, JSON_SAMPLE, parseJson, sortKeysDeep } from './jsonUtils';
import type { ToolProps } from '@/types';

export default function JsonFormatter({ preset, initial }: ToolProps) {
  const { t } = useI18n();
  const { success, error } = useToast();
  const validateOnly = preset === 'validate';

  const [input, setInput] = useState(initial?.text ?? JSON_SAMPLE);
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState('2');
  const [sortKeys, setSortKeys] = useState(false);

  const parsed = useMemo(() => (input.trim() ? parseJson(input) : null), [input]);

  /* Keep the formatted view live so the tool is useful without pressing a button. */
  useEffect(() => {
    if (!parsed?.ok) {
      setOutput('');
      return;
    }
    const value = sortKeys ? sortKeysDeep(parsed.value) : parsed.value;
    setOutput(JSON.stringify(value, null, indent === 'tab' ? '\t' : Number(indent)));
  }, [parsed, indent, sortKeys]);

  const stats = useMemo(() => (parsed?.ok ? inspectJson(parsed.value) : null), [parsed]);
  const highlighted = useMemo(() => (output ? highlightJson(output) : ''), [output]);

  /** Turns the document into a JSON string literal, and back again. */
  const escape = () => {
    if (!input.trim()) return;
    setOutput(JSON.stringify(input));
    success(t('json.escape'));
  };

  const unescape = () => {
    try {
      const value = JSON.parse(input.trim());
      if (typeof value !== 'string') {
        error(t('json.invalid'));
        return;
      }
      setInput(value);
      success(t('json.unescape'));
    } catch {
      error(t('json.invalid'));
    }
  };

  const minify = () => {
    if (!parsed?.ok) {
      error(t('json.invalid'));
      return;
    }
    setOutput(JSON.stringify(sortKeys ? sortKeysDeep(parsed.value) : parsed.value));
    success(t('json.minify'));
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-muted">{t('common.input')}</span>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                size="xs"
                variant="ghost"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => setInput('')}
                disabled={!input}
              >
                {t('common.clear')}
              </Button>
              <CopyButton value={input} size="xs" variant="ghost" compact />
            </div>
          </div>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('json.placeholder')}
            mono
            className="min-h-[380px]"
            invalid={Boolean(parsed && !parsed.ok)}
            aria-label={t('common.input')}
          />

          {parsed ? (
            parsed.ok ? (
              <p className="mt-2 flex items-center gap-2 rounded-xl border border-success/25 bg-success/[0.06] px-3 py-2.5 text-[13px] font-medium text-success">
                <Check className="h-4 w-4 shrink-0" />
                {t('json.valid')}
              </p>
            ) : (
              <div className="mt-2 rounded-xl border border-danger/25 bg-danger/[0.05] px-3 py-2.5">
                <p className="flex items-center gap-2 text-[13px] font-medium text-danger">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {t('json.invalid')}
                  {parsed.error.position >= 0 ? (
                    <span className="font-mono text-xs font-normal">
                      {t('json.line')} {parsed.error.line}, {t('json.column')} {parsed.error.column}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 break-words font-mono text-[11px] leading-relaxed text-muted">
                  {parsed.error.message}
                </p>
              </div>
            )
          ) : null}
        </Card>

        <Card className="flex flex-col p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-muted">{t('common.output')}</span>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                size="xs"
                variant="ghost"
                icon={<Download className="h-3.5 w-3.5" />}
                disabled={!output}
                onClick={() => downloadText(output, `nova-${Date.now()}.json`, 'application/json')}
              >
                JSON
              </Button>
              <CopyButton value={output} size="xs" variant="ghost" compact />
            </div>
          </div>

          <div className="min-h-[380px] flex-1 overflow-auto rounded-xl border border-line bg-surface/50 p-3.5">
            {highlighted ? (
              /* highlightJson escapes every chunk before wrapping it. */
              <pre
                className="whitespace-pre font-mono text-[13px] leading-relaxed text-ink"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            ) : (
              <span className="font-mono text-[13px] text-faint">{t('text.outputPlaceholder')}</span>
            )}
          </div>
        </Card>
      </div>

      <Card className="flex flex-wrap items-center gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {!validateOnly ? (
            <>
              <Segmented
                value={indent}
                onChange={setIndent}
                ariaLabel={t('json.indent')}
                size="sm"
                className="w-auto"
                options={[
                  { value: '2', label: '2' },
                  { value: '4', label: '4' },
                  { value: 'tab', label: 'Tab' },
                ]}
              />
              <Button
                size="sm"
                variant="primary"
                icon={<Sparkles className="h-3.5 w-3.5" />}
                onClick={() => {
                  if (!parsed?.ok) {
                    error(t('json.invalid'));
                    return;
                  }
                  success(t('json.format'));
                }}
              >
                {t('json.format')}
              </Button>
              <Button size="sm" icon={<Minimize2 className="h-3.5 w-3.5" />} onClick={minify}>
                {t('json.minify')}
              </Button>
              <Button size="sm" icon={<Quote className="h-3.5 w-3.5" />} onClick={escape}>
                {t('json.escape')}
              </Button>
              <Button size="sm" onClick={unescape}>
                {t('json.unescape')}
              </Button>
            </>
          ) : null}
          <Checkbox checked={sortKeys} onChange={setSortKeys} label={t('json.sortKeys')} className="w-auto" />
        </div>

        {stats ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Badge>
              {t('json.keys')}: {stats.keys}
            </Badge>
            <Badge>
              {t('json.depth')}: {stats.depth}
            </Badge>
            <Badge>
              {t('json.bytes')}: {formatBytes(new Blob([output || input]).size)}
            </Badge>
          </div>
        ) : null}
      </Card>

      <PrivacyBadge />
    </div>
  );
}
