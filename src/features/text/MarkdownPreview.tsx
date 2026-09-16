import { useMemo, useState } from 'react';
import { Download, Eye, FileCode2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Textarea, Segmented } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { downloadText } from '@/lib/utils';
import { renderMarkdown, MARKDOWN_SAMPLE } from './markdown';
import type { ToolProps } from '@/types';

const PROSE =
  'prose-nova max-w-none text-[14px] leading-relaxed text-ink ' +
  '[&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-semibold first:[&_h1]:mt-0 ' +
  '[&_h2]:mb-2.5 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold ' +
  '[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold ' +
  '[&_p]:my-2.5 [&_p]:text-muted ' +
  '[&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:pl-5 ' +
  '[&_li]:my-1 [&_li]:text-muted [&_li.task]:list-none [&_li.task]:-ml-5 ' +
  '[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 ' +
  '[&_code]:rounded-md [&_code]:border [&_code]:border-line [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12.5px] ' +
  '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-line [&_pre]:bg-surface [&_pre]:p-3.5 ' +
  '[&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0 ' +
  '[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-accent/50 [&_blockquote]:pl-4 [&_blockquote]:italic ' +
  '[&_hr]:my-5 [&_hr]:border-line [&_img]:my-3 [&_img]:rounded-xl [&_strong]:text-ink';

export default function MarkdownPreview({ initial }: ToolProps) {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const [source, setSource] = useState(initial?.text ?? MARKDOWN_SAMPLE);
  const [tab, setTab] = useState<'editor' | 'preview'>('editor');

  const html = useMemo(() => renderMarkdown(source), [source]);

  const editor = (
    <Card className="flex flex-col p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[13px] font-medium text-muted">
          <FileCode2 className="h-3.5 w-3.5" />
          {t('md.editor')}
        </span>
        <CopyButton value={source} size="xs" variant="ghost" compact />
      </div>
      <Textarea
        value={source}
        onChange={(event) => setSource(event.target.value)}
        placeholder={t('md.placeholder')}
        mono
        className="min-h-[420px]"
        aria-label={t('md.editor')}
      />
    </Card>
  );

  const preview = (
    <Card className="flex flex-col p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[13px] font-medium text-muted">
          <Eye className="h-3.5 w-3.5" />
          {t('md.preview')}
        </span>
        <Button
          size="xs"
          variant="ghost"
          icon={<Download className="h-3.5 w-3.5" />}
          onClick={() =>
            downloadText(
              `<!doctype html><html><head><meta charset="utf-8"><title>NOVA</title></head><body>${html}</body></html>`,
              `nova-markdown-${Date.now()}.html`,
              'text/html',
            )
          }
        >
          {t('md.downloadHtml')}
        </Button>
      </div>
      <div className="min-h-[420px] flex-1 overflow-auto rounded-xl border border-line bg-surface/50 p-5">
        {/* Source is escaped in renderMarkdown before any tags are produced. */}
        <div className={PROSE} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </Card>
  );

  if (isMobile) {
    return (
      <div className="space-y-4">
        <Segmented
          value={tab}
          onChange={setTab}
          ariaLabel={t('common.preview')}
          options={[
            { value: 'editor', label: t('md.editor') },
            { value: 'preview', label: t('md.preview') },
          ]}
        />
        {tab === 'editor' ? editor : preview}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {editor}
      {preview}
    </div>
  );
}
