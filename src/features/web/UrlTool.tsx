import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, Link2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Checkbox, Segmented, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import type { ToolProps } from '@/types';

type Mode = 'encode' | 'decode';

export default function UrlTool({ preset, initial }: ToolProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>(preset === 'decode' ? 'decode' : 'encode');
  const [component, setComponent] = useState(true);
  const [input, setInput] = useState(initial?.url ?? '');

  useEffect(() => {
    setMode(preset === 'decode' ? 'decode' : 'encode');
  }, [preset]);

  const { output, invalid } = useMemo(() => {
    if (!input.trim()) return { output: '', invalid: false };
    try {
      if (mode === 'encode') {
        return { output: component ? encodeURIComponent(input) : encodeURI(input), invalid: false };
      }
      return { output: component ? decodeURIComponent(input) : decodeURI(input), invalid: false };
    } catch {
      return { output: '', invalid: true };
    }
  }, [input, mode, component]);

  /* Break a well-formed URL into its parts — the part people actually want to read. */
  const parts = useMemo(() => {
    const candidate = mode === 'decode' ? output || input : input;
    try {
      const url = new URL(candidate.trim());
      return {
        protocol: url.protocol.replace(':', ''),
        host: url.host,
        path: url.pathname,
        query: [...url.searchParams.entries()],
        hash: url.hash.replace('#', ''),
      };
    } catch {
      return null;
    }
  }, [input, output, mode]);

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Segmented
          value={mode}
          onChange={setMode}
          ariaLabel={t('common.type')}
          className="w-auto"
          options={[
            { value: 'encode', label: t('url.encode') },
            { value: 'decode', label: t('url.decode') },
          ]}
        />
        <Checkbox checked={component} onChange={setComponent} label={t('url.component')} className="w-auto" />
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
            placeholder={t('url.placeholder')}
            mono
            className="min-h-[200px]"
            invalid={invalid}
            aria-label={t('common.input')}
          />
          {invalid ? <p className="mt-2 text-[13px] text-danger">{t('error.invalidInput')}</p> : null}
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
            className="min-h-[200px] bg-surface/50"
            aria-label={t('common.output')}
          />
        </Card>
      </div>

      {parts ? (
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
            <Link2 className="h-4 w-4 text-accent" />
            {t('url.parts')}
          </h2>
          <dl className="divide-y divide-line">
            {[
              { label: t('url.protocol'), value: parts.protocol },
              { label: t('url.host'), value: parts.host },
              { label: t('url.path'), value: parts.path },
              { label: t('url.hash'), value: parts.hash },
            ]
              .filter((row) => row.value)
              .map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="shrink-0 text-[11px] uppercase tracking-[0.06em] text-faint">{row.label}</dt>
                  <dd className="truncate font-mono text-[13px] text-ink">{row.value}</dd>
                </div>
              ))}
          </dl>

          {parts.query.length > 0 ? (
            <div className="mt-3">
              <p className="mb-2 text-[11px] uppercase tracking-[0.06em] text-faint">{t('url.query')}</p>
              <ul className="space-y-1.5">
                {parts.query.map(([key, value]) => (
                  <li
                    key={`${key}-${value}`}
                    className="flex items-baseline justify-between gap-3 rounded-lg border border-line bg-surface/50 px-3 py-2"
                  >
                    <span className="shrink-0 font-mono text-[12px] text-accent">{key}</span>
                    <span className="truncate font-mono text-[12px] text-ink">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      ) : null}

      <PrivacyBadge />
    </div>
  );
}
