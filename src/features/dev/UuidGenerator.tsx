import { useCallback, useEffect, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCopy } from '@/hooks/useCopy';
import { Card } from '@/components/ui/Card';
import { Checkbox, Segmented, Slider } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

type Version = 'v4' | 'v7' | 'nano';

const hex = (bytes: Uint8Array) => [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');

function uuidV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = hex(bytes);
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

/** Time-ordered UUIDv7: 48-bit millisecond timestamp + random tail. */
function uuidV7(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const timestamp = BigInt(Date.now());
  for (let i = 0; i < 6; i += 1) {
    bytes[i] = Number((timestamp >> BigInt(8 * (5 - i))) & 0xffn);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = hex(bytes);
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

const NANO_ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

function nanoId(size = 21): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return [...bytes].map((byte) => NANO_ALPHABET[byte % NANO_ALPHABET.length]).join('');
}

export default function UuidGenerator() {
  const { t } = useI18n();
  const { copy, isCopied } = useCopy();
  const [version, setVersion] = useState<Version>('v4');
  const [count, setCount] = useState(8);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [ids, setIds] = useState<string[]>([]);

  const generate = useCallback(() => {
    const next = Array.from({ length: count }, () => {
      const value = version === 'v4' ? uuidV4() : version === 'v7' ? uuidV7() : nanoId();
      const withHyphens = hyphens || version === 'nano' ? value : value.replace(/-/g, '');
      return uppercase ? withHyphens.toUpperCase() : withHyphens;
    });
    setIds(next);
  }, [count, version, uppercase, hyphens]);

  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <Card className="space-y-4">
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('uuid.version')}</span>
          <Segmented
            value={version}
            onChange={setVersion}
            ariaLabel={t('uuid.version')}
            options={[
              { value: 'v4', label: 'UUID v4' },
              { value: 'v7', label: 'UUID v7' },
              { value: 'nano', label: 'Nano ID' },
            ]}
          />
        </div>

        <Slider label={t('uuid.count')} value={count} min={1} max={50} onChange={setCount} />

        {version !== 'nano' ? (
          <div className="space-y-0.5 border-t border-line pt-3">
            <Checkbox checked={hyphens} onChange={setHyphens} label={t('uuid.hyphens')} />
            <Checkbox checked={uppercase} onChange={setUppercase} label={t('uuid.uppercase')} />
          </div>
        ) : null}

        <div className="grid gap-2">
          <Button variant="primary" block icon={<RefreshCw className="h-4 w-4" />} onClick={generate}>
            {t('common.generate')}
          </Button>
          <Button block icon={<Copy className="h-4 w-4" />} onClick={() => copy(ids.join('\n'), 'all')}>
            {isCopied('all') ? t('common.copied') : t('uuid.copyAll')}
          </Button>
        </div>
      </Card>

      <Card>
        <ul className="space-y-1.5">
          {ids.map((id, index) => (
            <li key={`${id}-${index}`}>
              <button
                type="button"
                onClick={() => copy(id, id)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface/60 px-3.5 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-surface"
              >
                <span className="truncate font-mono text-[13px] text-ink">{id}</span>
                <span className="shrink-0 text-[11px] text-faint">
                  {isCopied(id) ? t('common.copied') : t('common.copy')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
