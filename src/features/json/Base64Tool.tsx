import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, FileUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Checkbox, Segmented, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { FileDrop } from '@/components/ui/FileDrop';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { readFileAsDataUrl, formatBytes } from '@/lib/utils';
import type { ToolProps } from '@/types';

type Mode = 'encode' | 'decode';

/** UTF-8 safe Base64 helpers (btoa alone breaks on non-latin characters). */
const encode = (value: string, urlSafe: boolean) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  const base = btoa(binary);
  return urlSafe ? base.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : base;
};

const decode = (value: string): string | null => {
  try {
    let normalized = value.trim().replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    while (normalized.length % 4 !== 0) normalized += '=';
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
};

export default function Base64Tool({ preset, initial }: ToolProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>(preset === 'decode' ? 'decode' : 'encode');
  const [input, setInput] = useState(initial?.text ?? '');
  const [urlSafe, setUrlSafe] = useState(false);
  const [fileResult, setFileResult] = useState<{ name: string; size: number; base64: string } | null>(null);

  useEffect(() => {
    setMode(preset === 'decode' ? 'decode' : 'encode');
  }, [preset]);

  const { output, invalid } = useMemo(() => {
    if (!input.trim()) return { output: '', invalid: false };
    if (mode === 'encode') return { output: encode(input, urlSafe), invalid: false };
    const decoded = decode(input);
    return { output: decoded ?? '', invalid: decoded === null };
  }, [input, mode, urlSafe]);

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
          <Checkbox checked={urlSafe} onChange={setUrlSafe} label={t('b64.urlSafe')} className="w-auto" />
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
            placeholder={mode === 'encode' ? t('b64.placeholderEncode') : t('b64.placeholderDecode')}
            mono
            className="min-h-[260px]"
            invalid={invalid}
            aria-label={t('common.input')}
          />
          {invalid ? <p className="mt-2 text-[13px] text-danger">{t('b64.invalid')}</p> : null}
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

      {mode === 'encode' ? (
        <Card className="p-4">
          <span className="mb-2 flex items-center gap-2 text-[13px] font-medium text-muted">
            <FileUp className="h-3.5 w-3.5" />
            {t('b64.file')}
          </span>
          <FileDrop
            accept="*/*"
            compact
            onFiles={async ([file]) => {
              const dataUrl = await readFileAsDataUrl(file);
              setFileResult({ name: file.name, size: file.size, base64: dataUrl.split(',')[1] ?? '' });
            }}
          />
          {fileResult ? (
            <div className="mt-3 space-y-2">
              <p className="flex items-center justify-between gap-2 text-[12px] text-muted">
                <span className="truncate text-ink">{fileResult.name}</span>
                <span className="font-mono">{formatBytes(fileResult.size)}</span>
              </p>
              <ResultBlock
                label="Base64"
                value={fileResult.base64}
                className="max-h-48"
                placeholder={t('text.outputPlaceholder')}
              />
            </div>
          ) : null}
        </Card>
      ) : null}

      <PrivacyBadge />
    </div>
  );
}
