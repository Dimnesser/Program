import { useState } from 'react';
import { ExternalLink, Link2, Scissors, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/useToast';
import { useCopy } from '@/hooks/useCopy';
import { StorageKeys } from '@/lib/storage';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { uid } from '@/lib/utils';
import type { ShortLink as ShortLinkEntry, ToolProps } from '@/types';

const CODE_ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789';

const makeCode = (length = 6) => {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
};

const normalizeUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
};

export default function ShortLink({ initial }: ToolProps) {
  const { t, locale } = useI18n();
  const { success, error } = useToast();
  const { copy, isCopied } = useCopy();
  const [links, setLinks] = useLocalStorage<ShortLinkEntry[]>(StorageKeys.shortLinks, []);
  const [url, setUrl] = useState(initial?.url ?? '');
  const [alias, setAlias] = useState('');

  const create = () => {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      error(t('short.invalidUrl'));
      return;
    }

    const code = alias.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || makeCode();
    if (links.some((link) => link.code === code)) {
      error(t('short.aliasTaken'));
      return;
    }

    setLinks([{ id: uid('s'), code, url: normalized, createdAt: Date.now(), hits: 0 }, ...links]);
    setUrl('');
    setAlias('');
    success(t('toast.generated'));
  };

  const shortUrl = (code: string) => `${window.location.origin}/s/${code}`;

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="space-y-4">
        <Input
          label={t('short.longUrl')}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/very/long/path"
          inputMode="url"
          spellCheck={false}
        />
        <Input
          label={t('short.alias')}
          value={alias}
          onChange={(event) => setAlias(event.target.value)}
          placeholder="my-link"
          spellCheck={false}
        />
        <Button variant="primary" block icon={<Scissors className="h-4 w-4" />} onClick={create}>
          {t('short.create')}
        </Button>
        <p className="text-[11px] leading-relaxed text-faint">{t('short.hint')}</p>
        <PrivacyBadge />
      </Card>

      <Card>
        <h2 className="mb-3 text-[13px] font-semibold text-ink">{t('short.links')}</h2>
        {links.length === 0 ? (
          <EmptyState compact icon={<Link2 className="h-4 w-4" />} title={t('short.empty')} className="border-0" />
        ) : (
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.id} className="rounded-xl border border-line bg-surface/50 px-3.5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => copy(shortUrl(link.code), link.id)}
                    className="min-w-0 truncate text-left font-mono text-[13px] font-medium text-accent transition-opacity hover:opacity-80"
                  >
                    {isCopied(link.id) ? t('common.copied') : `/s/${link.code}`}
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={`/s/${link.code}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={t('common.open')}
                      className="rounded-lg p-1.5 text-faint transition-colors hover:text-ink"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <IconButton
                      label={t('common.delete')}
                      size="sm"
                      variant="danger"
                      onClick={() => setLinks(links.filter((item) => item.id !== link.id))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                </div>
                <p className="mt-1 truncate text-[12px] text-muted">{link.url}</p>
                <p className="mt-1 text-[11px] text-faint">
                  {new Date(link.createdAt).toLocaleDateString(locale)} · {link.hits} {t('short.hits')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
