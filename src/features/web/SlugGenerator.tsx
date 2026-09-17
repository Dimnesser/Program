import { useMemo, useState } from 'react';
import { Link2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Checkbox, Input, Segmented, Slider, Textarea } from '@/components/ui/Field';
import { CopyButton } from '@/components/ui/CopyButton';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { slugify, transliterate } from '@/lib/translit';
import type { ToolProps } from '@/types';

export default function SlugGenerator({ initial }: ToolProps) {
  const { t } = useI18n();
  const [input, setInput] = useState(initial?.text ?? 'Привіт, світ! Це NOVA 2026');
  const [separator, setSeparator] = useState('-');
  const [lowercase, setLowercase] = useState(true);
  const [limit, setLimit] = useState(60);
  const [prefix, setPrefix] = useState('');

  const lines = useMemo(() => input.split('\n').filter((line) => line.trim()), [input]);

  const slugs = useMemo(
    () =>
      lines.map((line) => ({
        source: line,
        slug: prefix + slugify(line, { separator, lowercase, maxLength: limit }),
      })),
    [lines, separator, lowercase, limit, prefix],
  );

  const all = slugs.map((item) => item.slug).join('\n');

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <div className="space-y-5">
        <Card className="flex flex-col p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-muted">{t('slug.input')}</span>
            <span className="text-[11px] text-faint">{lines.length}</span>
          </div>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('slug.placeholder')}
            className="min-h-[160px]"
            aria-label={t('slug.input')}
          />
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-muted">{t('slug.result')}</span>
            <CopyButton value={all} size="xs" variant="ghost" />
          </div>
          {slugs.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted">{t('slug.placeholder')}</p>
          ) : (
            <ul className="space-y-2">
              {slugs.map((item, index) => (
                <li key={index} className="rounded-xl border border-line bg-surface/50 px-3.5 py-2.5">
                  <p className="truncate text-[11px] text-faint">{item.source}</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-accent">
                      {item.slug || '—'}
                    </code>
                    <CopyButton value={item.slug} size="xs" variant="ghost" compact />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="space-y-4">
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('slug.separator')}</span>
            <Segmented
              value={separator}
              onChange={setSeparator}
              ariaLabel={t('slug.separator')}
              options={[
                { value: '-', label: 'slug-case' },
                { value: '_', label: 'slug_case' },
                { value: '', label: 'slugcase' },
              ]}
            />
          </div>
          <Input label={t('slug.prefix')} value={prefix} onChange={(event) => setPrefix(event.target.value)} placeholder="blog/" />
          <Slider label={t('slug.maxLength')} value={limit} min={10} max={120} onChange={setLimit} />
          <Checkbox checked={lowercase} onChange={setLowercase} label={t('text.lowercase')} />
        </Card>

        <Card>
          <h2 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink">
            <Link2 className="h-4 w-4 text-accent" />
            {t('slug.translit')}
          </h2>
          <p className="text-[12px] leading-relaxed text-muted">{t('slug.translitHint')}</p>
          <p className="mt-3 break-words rounded-lg border border-line bg-surface/60 px-3 py-2 font-mono text-[12px] text-ink">
            {transliterate(lines[0] ?? '')}
          </p>
        </Card>

        <PrivacyBadge />
      </div>
    </div>
  );
}
