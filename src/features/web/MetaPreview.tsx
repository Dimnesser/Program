import { useMemo, useState } from 'react';
import { Code2, Globe, Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { ResultBlock } from '@/components/ui/ResultBlock';
import { Badge } from '@/components/ui/Badge';
import { escapeHtml, cn } from '@/lib/utils';

interface Meta {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName: string;
}

const LIMITS = { title: 60, description: 160 };

export default function MetaPreview() {
  const { t } = useI18n();
  const { success, error } = useToast();
  const [meta, setMeta] = useState<Meta>({
    title: 'NOVA — Everything you need. One place.',
    description: 'A universal digital utility hub with 40+ everyday tools that run entirely in your browser.',
    image: '',
    url: 'https://nova.tools',
    siteName: 'NOVA',
  });
  const [html, setHtml] = useState('');

  /** Parses pasted markup with DOMParser — no network request is made. */
  const parse = () => {
    if (!html.trim()) return;
    try {
      const document_ = new DOMParser().parseFromString(html, 'text/html');
      const pick = (selector: string) =>
        document_.querySelector(selector)?.getAttribute('content')?.trim() ?? '';

      const next: Meta = {
        title: pick('meta[property="og:title"]') || document_.querySelector('title')?.textContent?.trim() || '',
        description: pick('meta[property="og:description"]') || pick('meta[name="description"]'),
        image: pick('meta[property="og:image"]') || pick('meta[name="twitter:image"]'),
        url: pick('meta[property="og:url"]') || '',
        siteName: pick('meta[property="og:site_name"]') || '',
      };

      if (!next.title && !next.description) {
        error(t('toast.invalid'));
        return;
      }
      setMeta({ ...meta, ...next });
      success(t('toast.generated'));
    } catch {
      error(t('toast.invalid'));
    }
  };

  const tags = useMemo(
    () =>
      [
        `<title>${escapeHtml(meta.title)}</title>`,
        `<meta name="description" content="${escapeHtml(meta.description)}" />`,
        '',
        `<meta property="og:type" content="website" />`,
        meta.siteName ? `<meta property="og:site_name" content="${escapeHtml(meta.siteName)}" />` : '',
        `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
        `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
        meta.url ? `<meta property="og:url" content="${escapeHtml(meta.url)}" />` : '',
        meta.image ? `<meta property="og:image" content="${escapeHtml(meta.image)}" />` : '',
        '',
        `<meta name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}" />`,
        `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
        `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
        meta.image ? `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />` : '',
      ]
        .filter((line) => line !== undefined)
        .join('\n'),
    [meta],
  );

  const host = (() => {
    try {
      return new URL(meta.url).host;
    } catch {
      return meta.url || 'example.com';
    }
  })();

  const lengthBadge = (value: number, limit: number) => (
    <Badge tone={value === 0 ? 'neutral' : value > limit ? 'warning' : 'success'}>
      {value}/{limit} {value > limit ? t('meta.tooLong') : t('meta.good')}
    </Badge>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_1fr]">
      <div className="space-y-5">
        <Card className="space-y-3">
          <Input
            label={t('meta.title')}
            value={meta.title}
            onChange={(event) => setMeta({ ...meta, title: event.target.value })}
            hint={lengthBadge(meta.title.length, LIMITS.title)}
          />
          <Textarea
            label={t('meta.description')}
            value={meta.description}
            onChange={(event) => setMeta({ ...meta, description: event.target.value })}
            hint={lengthBadge(meta.description.length, LIMITS.description)}
            className="min-h-[90px]"
          />
          <Input
            label={t('meta.url')}
            value={meta.url}
            onChange={(event) => setMeta({ ...meta, url: event.target.value })}
            inputMode="url"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t('meta.image')}
              value={meta.image}
              onChange={(event) => setMeta({ ...meta, image: event.target.value })}
              inputMode="url"
            />
            <Input
              label={t('meta.siteName')}
              value={meta.siteName}
              onChange={(event) => setMeta({ ...meta, siteName: event.target.value })}
            />
          </div>
        </Card>

        <Card className="space-y-3">
          <span className="flex items-center gap-2 text-[13px] font-medium text-muted">
            <Code2 className="h-3.5 w-3.5" />
            {t('meta.paste')}
          </span>
          <Textarea
            value={html}
            onChange={(event) => setHtml(event.target.value)}
            placeholder={'<head>…</head>'}
            mono
            className="min-h-[120px]"
            aria-label={t('meta.paste')}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={parse} disabled={!html.trim()}>
              {t('meta.parse')}
            </Button>
            <span className="text-[11px] text-faint">{t('meta.pasteHint')}</span>
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        {/* Google result */}
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
            <Search className="h-4 w-4 text-accent" />
            {t('meta.google')}
          </h2>
          <div className="rounded-xl border border-line bg-surface/60 p-4">
            <p className="truncate text-[12px] text-muted">{host}</p>
            <p className="mt-1 line-clamp-1 text-[17px] text-accent">{meta.title || '—'}</p>
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">{meta.description || '—'}</p>
          </div>
        </Card>

        {/* OG card */}
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
            <Globe className="h-4 w-4 text-accent" />
            {t('meta.facebook')}
          </h2>
          <div className="overflow-hidden rounded-xl border border-line bg-surface/60">
            <div
              className={cn(
                'flex aspect-[1.91/1] items-center justify-center bg-elevated text-[12px] text-faint',
                meta.image && 'p-0',
              )}
            >
              {meta.image ? (
                <img src={meta.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{t('meta.image')}</span>
              )}
            </div>
            <div className="border-t border-line px-3.5 py-3">
              <p className="truncate text-[11px] uppercase tracking-[0.06em] text-faint">{host}</p>
              <p className="mt-1 line-clamp-2 text-[14px] font-semibold text-ink">{meta.title || '—'}</p>
              <p className="mt-0.5 line-clamp-2 text-[12px] text-muted">{meta.description || '—'}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-[13px] font-semibold text-ink">{t('meta.generated')}</h2>
          <ResultBlock value={tags} className="max-h-72" placeholder={t('text.outputPlaceholder')} />
        </Card>
      </div>
    </div>
  );
}
