import { useState } from 'react';
import { FileText, Plus, Trash2, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Segmented, Select, Slider } from '@/components/ui/Field';
import { Button, IconButton } from '@/components/ui/Button';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { EmptyState } from '@/components/ui/States';
import { formatBytes } from '@/lib/utils';
import { ImageDrop } from './ImageDrop';
import type { LoadedImage } from './imageUtils';

type Orientation = 'auto' | 'portrait' | 'landscape';

const PAGE_SIZES = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
  { value: 'a5', label: 'A5' },
];

export default function ImageToPdf() {
  const { t } = useI18n();
  const { success, error } = useToast();

  const [images, setImages] = useState<LoadedImage[]>([]);
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [margin, setMargin] = useState(24);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (images.length === 0) return;
    setBusy(true);
    try {
      const { jsPDF } = await import('jspdf');
      let doc: import('jspdf').jsPDF | null = null;

      for (const image of images) {
        const isLandscape =
          orientation === 'auto' ? image.width > image.height : orientation === 'landscape';
        const pageOrientation = isLandscape ? 'landscape' : 'portrait';

        if (!doc) {
          doc = new jsPDF({ unit: 'pt', format: pageSize, orientation: pageOrientation });
        } else {
          doc.addPage(pageSize, pageOrientation);
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;
        const scale = Math.min(usableWidth / image.width, usableHeight / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;

        doc.addImage(
          image.dataUrl,
          image.type === 'image/png' ? 'PNG' : 'JPEG',
          (pageWidth - drawWidth) / 2,
          (pageHeight - drawHeight) / 2,
          drawWidth,
          drawHeight,
          undefined,
          'FAST',
        );
      }

      doc?.save(`nova-images-${Date.now()}.pdf`);
      success(t('toast.downloaded'));
    } catch {
      error(t('error.title'));
    } finally {
      setBusy(false);
    }
  };

  const totalSize = images.reduce((sum, image) => sum + image.size, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
      <Card className="space-y-4 p-4">
        {images.length === 0 ? (
          <ImageDrop multiple onLoad={(loaded) => setImages(loaded)} />
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-muted">
                {images.length} {t('img.imagesCount')} · {formatBytes(totalSize)}
              </span>
              <Button size="xs" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setImages([])}>
                {t('common.clear')}
              </Button>
            </div>

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image, index) => (
                <li key={`${image.name}-${index}`} className="group relative">
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-line bg-surface/50">
                    <img src={image.dataUrl} alt={image.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <span className="mt-1.5 block truncate text-[11px] text-faint">{image.name}</span>
                  <IconButton
                    label={t('common.delete')}
                    size="sm"
                    variant="danger"
                    className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => setImages(images.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </IconButton>
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-black/50 px-1.5 py-0.5 font-mono text-[11px] text-white">
                    {index + 1}
                  </span>
                </li>
              ))}
            </ul>

            <ImageDrop
              multiple
              compact
              onLoad={(loaded) => setImages((current) => [...current, ...loaded].slice(0, 30))}
            />
          </>
        )}
      </Card>

      <Card className="space-y-4">
        <Select
          label={t('img.pageSize')}
          value={pageSize}
          onChange={(event) => setPageSize(event.target.value)}
          options={PAGE_SIZES}
        />

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('img.orientation')}</span>
          <Segmented
            value={orientation}
            onChange={setOrientation}
            ariaLabel={t('img.orientation')}
            options={[
              { value: 'auto', label: t('img.autoOrientation') },
              { value: 'portrait', label: t('img.portrait') },
              { value: 'landscape', label: t('img.landscape') },
            ]}
          />
        </div>

        <Slider label={t('img.margin')} value={margin} min={0} max={96} onChange={setMargin} suffix="pt" />

        <Button
          variant="primary"
          block
          loading={busy}
          disabled={images.length === 0}
          icon={<FileText className="h-4 w-4" />}
          onClick={() => void create()}
          className="!mt-6"
        >
          {t('img.createPdf')}
        </Button>

        {images.length === 0 ? (
          <EmptyState compact icon={<Plus className="h-4 w-4" />} title={t('img.addImages')} />
        ) : null}

        <PrivacyBadge />
      </Card>
    </div>
  );
}
