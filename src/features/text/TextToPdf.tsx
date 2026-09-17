import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Checkbox, Input, Select, Slider, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import type { ToolProps } from '@/types';

const PAGE_SIZES = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
  { value: 'a5', label: 'A5' },
];

export default function TextToPdf({ initial }: ToolProps) {
  const { t } = useI18n();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [text, setText] = useState(initial?.text ?? '');
  const [fontSize, setFontSize] = useState(12);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [pageSize, setPageSize] = useState('a4');
  const [landscape, setLandscape] = useState(false);
  const [pageNumbers, setPageNumbers] = useState(true);
  const [busy, setBusy] = useState(false);

  const estimatedPages = useMemo(() => {
    if (!text.trim()) return 0;
    const charactersPerPage = Math.round((3400 * 12) / fontSize / lineHeight);
    return Math.max(1, Math.ceil(text.length / charactersPerPage));
  }, [text, fontSize, lineHeight]);

  const create = async () => {
    if (!text.trim()) {
      error(t('toast.invalid'));
      return;
    }
    setBusy(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        unit: 'pt',
        format: pageSize,
        orientation: landscape ? 'landscape' : 'portrait',
      });

      const margin = 56;
      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();
      const usableWidth = width - margin * 2;
      const step = fontSize * lineHeight;
      let y = margin;

      if (title.trim()) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize + 8);
        for (const line of doc.splitTextToSize(title, usableWidth) as string[]) {
          doc.text(line, margin, y);
          y += (fontSize + 8) * 1.3;
        }
        y += step * 0.6;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);

      for (const paragraph of text.split(/\r\n|\r|\n/)) {
        const lines = paragraph.trim() ? (doc.splitTextToSize(paragraph, usableWidth) as string[]) : [''];
        for (const line of lines) {
          if (y > height - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += step;
        }
      }

      if (pageNumbers) {
        const total = doc.getNumberOfPages();
        doc.setFontSize(9);
        for (let page = 1; page <= total; page += 1) {
          doc.setPage(page);
          doc.text(`${page} / ${total}`, width / 2, height - margin / 2, { align: 'center' });
        }
      }

      doc.save(`${title.trim() ? title.trim().slice(0, 40) : 'nova-document'}.pdf`);
      success(t('toast.downloaded'));
    } catch {
      error(t('error.title'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <Card className="flex flex-col gap-4">
        <Input label={t('pdf.title')} value={title} onChange={(event) => setTitle(event.target.value)} />
        <Textarea
          label={t('pdf.text')}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t('pdf.placeholder')}
          className="min-h-[340px]"
        />
      </Card>

      <Card className="space-y-4">
        <Select
          label={t('img.pageSize')}
          value={pageSize}
          onChange={(event) => setPageSize(event.target.value)}
          options={PAGE_SIZES}
        />
        <Slider label={t('pdf.fontSize')} value={fontSize} min={8} max={24} onChange={setFontSize} suffix="pt" />
        <Slider
          label={t('pdf.lineHeight')}
          value={lineHeight}
          min={1}
          max={2.5}
          step={0.1}
          onChange={setLineHeight}
        />
        <div className="space-y-0.5 border-t border-line pt-3">
          <Checkbox checked={landscape} onChange={setLandscape} label={t('img.landscape')} />
          <Checkbox checked={pageNumbers} onChange={setPageNumbers} label={t('pdf.pageNumbers')} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-line bg-surface/60 px-3.5 py-2.5 text-[13px]">
          <span className="text-muted">{t('pdf.pages')}</span>
          <span className="font-mono font-medium text-ink">≈ {estimatedPages}</span>
        </div>

        <Button
          variant="primary"
          block
          loading={busy}
          disabled={!text.trim()}
          icon={<FileText className="h-4 w-4" />}
          onClick={() => void create()}
        >
          {t('pdf.create')}
        </Button>

        <PrivacyBadge />
      </Card>
    </div>
  );
}
