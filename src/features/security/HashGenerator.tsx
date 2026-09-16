import { useEffect, useState } from 'react';
import { Hash } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Segmented, Textarea } from '@/components/ui/Field';
import { FileDrop } from '@/components/ui/FileDrop';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { Badge } from '@/components/ui/Badge';
import { formatBytes } from '@/lib/utils';

type Algorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

export default function HashGenerator() {
  const { t } = useI18n();
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256');
  const [text, setText] = useState('');
  const [file, setFile] = useState<{ name: string; size: number; buffer: ArrayBuffer } | null>(null);
  const [digest, setDigest] = useState('');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const source = file ? file.buffer : new TextEncoder().encode(text).buffer;
      if (!file && !text) {
        setDigest('');
        return;
      }
      try {
        const result = await crypto.subtle.digest(algorithm, source);
        if (!cancelled) setDigest(toHex(result));
      } catch {
        if (!cancelled) setDigest('');
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [algorithm, text, file]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="space-y-4">
        <Segmented
          value={algorithm}
          onChange={setAlgorithm}
          ariaLabel={t('hash.algorithm')}
          options={[
            { value: 'SHA-1', label: 'SHA-1' },
            { value: 'SHA-256', label: 'SHA-256' },
            { value: 'SHA-384', label: 'SHA-384' },
            { value: 'SHA-512', label: 'SHA-512' },
          ]}
        />

        <Textarea
          label={t('hash.inputText')}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setFile(null);
          }}
          placeholder={t('text.placeholder')}
          className="min-h-[160px]"
        />

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('hash.file')}</span>
          <FileDrop
            accept="*/*"
            compact
            onFiles={async ([selected]) => {
              const buffer = await selected.arrayBuffer();
              setFile({ name: selected.name, size: selected.size, buffer });
              setText('');
            }}
          />
          {file ? (
            <p className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-line bg-surface/60 px-3 py-2 text-[12px]">
              <span className="truncate text-ink">{file.name}</span>
              <Badge>{formatBytes(file.size)}</Badge>
            </p>
          ) : null}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <ResultBlock
          label={algorithm}
          value={digest}
          placeholder={t('hash.inputText')}
          className="min-h-[140px]"
        />
        <p className="flex items-start gap-2 text-[12px] leading-relaxed text-muted">
          <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          {t('hash.hint')}
        </p>
        <PrivacyBadge />
      </Card>
    </div>
  );
}
