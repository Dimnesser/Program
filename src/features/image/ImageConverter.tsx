import { useCallback, useState } from 'react';
import { Download, FileImage, Package, RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Segmented, Slider } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { downloadBlob, formatBytes } from '@/lib/utils';
import { ImageDrop } from './ImageDrop';
import { BatchList } from './BatchList';
import { MAX_BATCH, useImageBatch } from './useImageBatch';
import {
  canvasToBlob,
  extensionFor,
  OUTPUT_FORMATS,
  renderToCanvas,
  type LoadedImage,
  type OutputFormat,
} from './imageUtils';

export default function ImageConverter() {
  const { t } = useI18n();
  const { success } = useToast();
  const [format, setFormat] = useState<OutputFormat>('image/webp');
  const [quality, setQuality] = useState(92);

  const process = useCallback(
    async (image: LoadedImage) => {
      const canvas = renderToCanvas(image.element, {
        width: image.width,
        height: image.height,
        background: format === 'image/jpeg' ? '#FFFFFF' : undefined,
      });
      const blob = await canvasToBlob(canvas, format, quality / 100);
      if (!blob) return null;
      return {
        blob,
        width: canvas.width,
        height: canvas.height,
        name: `${image.name.replace(/\.[^.]+$/, '')}.${extensionFor(format)}`,
      };
    },
    [format, quality],
  );

  const batch = useImageBatch(process);
  const ready = batch.items.filter((item) => item.result).length;

  if (batch.items.length === 0) {
    return (
      <div className="space-y-5">
        <ImageDrop multiple onLoad={batch.add} />
        <p className="text-center text-[12px] text-faint">{t('batch.max', { max: MAX_BATCH })}</p>
        <PrivacyBadge />
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{batch.items.length} {t('batch.files')}</Badge>
          <Badge>{formatBytes(batch.totals.originalBytes)}</Badge>
          {ready > 0 ? <Badge tone="success">→ {formatBytes(batch.totals.resultBytes)}</Badge> : null}
        </div>

        {batch.busy ? (
          <div className="h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={batch.progress}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${batch.progress}%` }} />
          </div>
        ) : null}

        <Card className="p-3">
          <BatchList items={batch.items} onRemove={batch.remove} />
        </Card>

        <ImageDrop multiple compact onLoad={batch.add} />
      </div>

      <Card className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('img.outputFormat')}</span>
          <Segmented
            value={format}
            onChange={(value) => setFormat(value as OutputFormat)}
            ariaLabel={t('img.outputFormat')}
            options={OUTPUT_FORMATS.map((item) => ({ value: item.value, label: item.label }))}
          />
        </div>

        {format !== 'image/png' ? (
          <Slider label={t('common.quality')} value={quality} min={10} max={100} onChange={setQuality} suffix="%" />
        ) : null}

        <div className="grid gap-2 border-t border-line pt-4">
          <Button
            variant="primary"
            block
            loading={batch.busy}
            icon={<FileImage className="h-4 w-4" />}
            onClick={() => void batch.run()}
          >
            {batch.items.length > 1 ? t('batch.processAll', { count: batch.items.length }) : t('common.apply')}
          </Button>

          {batch.items.length > 1 ? (
            <Button
              block
              disabled={ready === 0}
              icon={<Package className="h-4 w-4" />}
              onClick={async () => {
                const archive = await batch.downloadZip(`nova-converted-${Date.now()}.zip`);
                if (!archive) return;
                downloadBlob(archive.blob, archive.name);
                success(t('toast.downloaded'));
              }}
            >
              {t('batch.downloadZip')}
            </Button>
          ) : (
            <Button
              block
              disabled={ready === 0}
              icon={<Download className="h-4 w-4" />}
              onClick={() => {
                const item = batch.items.find((entry) => entry.result);
                if (!item?.result) return;
                downloadBlob(item.result.blob, item.result.name);
                success(t('toast.downloaded'));
              }}
            >
              {t('common.download')}
            </Button>
          )}

          <Button block variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={batch.clear}>
            {t('common.reset')}
          </Button>
        </div>

        <PrivacyBadge />
      </Card>
    </div>
  );
}
