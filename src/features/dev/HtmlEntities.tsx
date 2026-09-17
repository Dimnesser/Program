import { useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Checkbox, Segmented, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import type { ToolProps } from '@/types';

type Mode = 'encode' | 'decode';

const NAMED: Record<string, string> = {
  '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": 'apos',
  ' ': 'nbsp', '©': 'copy', '®': 'reg', '™': 'trade', '€': 'euro',
  '«': 'laquo', '»': 'raquo', '—': 'mdash', '–': 'ndash', '…': 'hellip', '·': 'middot',
};

function encodeEntities(input: string, everything: boolean): string {
  let result = '';
  for (const char of input) {
    const named = NAMED[char];
    if (named) {
      result += `&${named};`;
    } else if (everything && char.codePointAt(0)! > 127) {
      result += `&#${char.codePointAt(0)};`;
    } else {
      result += char;
    }
  }
  return result;
}

/** Decoding leans on the browser's own parser, so every named entity works. */
function decodeEntities(input: string): string {
  const area = document.createElement('textarea');
  area.innerHTML = input;
  return area.value;
}

export default function HtmlEntities({ preset, initial }: ToolProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>(preset === 'decode' ? 'decode' : 'encode');
  const [input, setInput] = useState(initial?.text ?? '');
  const [everything, setEverything] = useState(false);

  const output = useMemo(() => {
    if (!input) return '';
    return mode === 'encode' ? encodeEntities(input, everything) : decodeEntities(input);
  }, [input, mode, everything]);

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Segmented
          value={mode}
          onChange={setMode}
          ariaLabel={t('common.type')}
          className="w-auto"
          options={[
            { value: 'encode', label: t('b64.encode') },
            { value: 'decode', label: t('b64.decode') },
          ]}
        />
        {mode === 'encode' ? (
          <Checkbox checked={everything} onChange={setEverything} label={t('entities.all')} className="w-auto" />
        ) : null}
        <Button
          size="sm"
          className="ml-auto"
          icon={<ArrowUpDown className="h-3.5 w-3.5" />}
          disabled={!output}
          onClick={() => {
            setInput(output);
            setMode(mode === 'encode' ? 'decode' : 'encode');
          }}
        >
          {t('common.swap')}
        </Button>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-muted">{t('common.input')}</span>
            <CopyButton value={input} size="xs" variant="ghost" compact />
          </div>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={mode === 'encode' ? '<b>Привіт</b> & "лапки"' : '&lt;b&gt;Привіт&lt;/b&gt;'}
            mono
            className="min-h-[260px]"
            aria-label={t('common.input')}
          />
        </Card>

        <Card className="flex flex-col p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-muted">{t('common.output')}</span>
            <CopyButton value={output} size="xs" variant="ghost" compact />
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder={t('text.outputPlaceholder')}
            mono
            className="min-h-[260px] bg-surface/50"
            aria-label={t('common.output')}
          />
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-[13px] font-semibold text-ink">{t('entities.common')}</h2>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(NAMED).map(([char, name]) => (
            <button
              key={name}
              type="button"
              onClick={() => setInput((current) => current + (mode === 'encode' ? char : `&${name};`))}
              className="rounded-lg border border-line bg-surface/50 px-3 py-2 text-left transition-colors hover:border-line-strong"
            >
              <span className="block text-[15px] text-ink">{char === ' ' ? '␣' : char}</span>
              <span className="block truncate font-mono text-[11px] text-faint">&amp;{name};</span>
            </button>
          ))}
        </div>
      </Card>

      <PrivacyBadge />
    </div>
  );
}
