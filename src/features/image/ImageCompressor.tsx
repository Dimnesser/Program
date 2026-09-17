import { useCallback, useMemo, useState } from 'react';
import { Download, Package, RotateCcw, Shrink } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Checkbox, Segmented, Slider } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { downloadBlob, formatBytes, cn } from '@/lib/utils';
import { ImageDrop } from './ImageDrop';
import { BatchList } from './BatchList';
import { MAX_BATCH, useImageBatch } from './useImageBatch';
import {
  canvasToBlob,
  extensionFor,
  extractExifSegment,
  injectExifSegment,
  OUTPUT_FORMATS,
  renderToCanvas,
  type LoadedImage,
  type OutputFormat,
} from './imageUtils';

export default function ImageCompressor() {
  const { t } = useI18n();
  const { success } = useToast();

  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<OutputFormat>('image/jpeg');
  const [scale, setScale] = useState(100);
  const [keepMetadata, setKeepMetadata] = useState(false);

  const process = useCallback(
    async (image: LoadedImage) => {
      const canvas = renderToCanvas(image.element, {
        width: (image.width * scale) / 100,
        height: (image.height * scale) / 100,
        background: format === 'image/jpeg' ? '#FFFFFF' : undefined,
      });

      let blob = await canvasToBlob(canvas, format, quality / 100);
      if (!blob) return null;

      // Canvas drops EXIF; re-attach it when both ends are JPEG and it was asked for.
      if (keepMetadata && format === 'image/jpeg' && image.type === 'image/jpeg') {
        const segment = extractExifSegment(await image.file.arrayBuffer());
        if (segment) blob = await injectExifSegment(blob, segment);
      }

      return {
        blob,
        width: canvas.width,
        height: canvas.height,
        name: `${image.name.replace(/\.[^.]+$/, '')}-nova.${extensionFor(format)}`,
      };
    },
    [format, quality, scale, keepMetadata],
  );

  const batch = useImageBatch(process);
  const exifSupported = format === 'image/jpeg' && batch.items.some((item) => item.source.type === 'image/jpeg');

  const savedPercent = useMemo(() => {
    if (batch.totals.originalBytes === 0 || batch.totals.resultBytes === 0) return 0;
    const processed = batch.items.filter((item) => item.result);
    const originals = processed.reduce((sum, item) => sum + item.source.size, 0);
    return Math.round((1 - batch.totals.resultBytes / originals) * 100);
  }, [batch.items, batch.totals]);

  const downloadAll = async () => {
    const archive = await batch.downloadZip(`nova-compressed-${Date.now()}.zip`);
    if (!archive) return;
    downloadBlob(archive.blob, archive.name);
    success(t('toast.downloaded'));
  };

  if (batch.items.length === 0) {
    return (
      <div className="space-y-5">
        <ImageDrop multiple onLoad={batch.add} />
        <p className="text-center text-[12px] text-faint">{t('batch.max', { max: MAX_BATCH })}</p>
        <PrivacyBadge />
      </div>
    );
  }

  const ready = batch.items.filter((item) => item.result).length;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        {/* Totals */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: t('batch.files'), value: String(batch.items.length) },
            { label: t('img.original'), value: formatBytes(batch.totals.originalBytes) },
            { label: t('img.compressed'), value: ready > 0 ? formatBytes(batch.totals.resultBytes) : '—' },
            {
              label: t('img.saved'),
              value: ready > 0 ? `${savedPercent > 0 ? '−' : '+'}${Math.abs(savedPercent)}%` : '—',
              tone: savedPercent > 0,
            },
          ].map((tile) => (
            <div key={tile.label} className="rounded-xl border border-line bg-card/60 px-3 py-2.5">
              <div className="truncate text-[10px] uppercase tracking-[0.06em] text-faint">{tile.label}</div>
              <div
                className={cn(
                  'mt-0.5 truncate font-mono text-[15px] font-semibold text-ink',
                  tile.tone === true && 'text-success',
                  tile.tone === false && 'text-warning',
                )}
              >
                {tile.value}
              </div>
            </div>
          ))}
        </div>

        {batch.busy ? (
          <div className="h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={batch.progress}>
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: `${batch.progress}%` }}
            />
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

        <Slider
          label={t('common.quality')}
          value={quality}
          min={10}
          max={100}
          onChange={setQuality}
          suffix="%"
          className={cn(format === 'image/png' && 'opacity-40')}
        />
        {format === 'image/png' ? (
          <p className="-mt-2 text-[11px] text-faint">PNG — lossless, quality has no effect.</p>
        ) : null}

        <Slider label={t('img.scale')} value={scale} min={10} max={100} onChange={setScale} suffix="%" />

        <div className="border-t border-line pt-3">
          <Checkbox
            checked={keepMetadata && exifSupported}
            onChange={setKeepMetadata}
            label={t('img.keepMetadata')}
            className={cn(!exifSupported && 'pointer-events-none opacity-40')}
          />
          <p className="px-2 text-[11px] leading-relaxed text-faint">
            {exifSupported ? t('img.keepMetadataHint') : 'JPEG → JPEG only.'}
          </p>
        </div>

        <div className="grid gap-2 border-t border-line pt-4">
          <Button
            variant="primary"
            block
            loading={batch.busy}
            icon={<Shrink className="h-4 w-4" />}
            onClick={async () => {
              await batch.run();
              success(t('toast.compressed'));
            }}
          >
            {batch.items.length > 1 ? t('batch.processAll', { count: batch.items.length }) : t('img.compress')}
          </Button>

          {batch.items.length > 1 ? (
            <Button block disabled={ready === 0} icon={<Package className="h-4 w-4" />} onClick={() => void downloadAll()}>
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

        {ready > 0 ? (
          <Badge tone="success" className="w-full justify-center py-1.5">
            {t('batch.done', { done: ready, total: batch.items.length })}
          </Badge>
        ) : null}

        <PrivacyBadge />
      </Card>
    </div>
  );
}
