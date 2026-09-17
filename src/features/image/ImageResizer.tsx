import { useCallback, useState } from 'react';
import { Crop, Download, Package, RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Input, Segmented } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { downloadBlob, formatBytes, clamp } from '@/lib/utils';
import { ImageDrop } from './ImageDrop';
import { BatchList } from './BatchList';
import { MAX_BATCH, useImageBatch } from './useImageBatch';
import {
  canvasToBlob,
  extensionFor,
  fitDimensions,
  OUTPUT_FORMATS,
  renderToCanvas,
  RESIZE_PRESETS,
  type LoadedImage,
  type OutputFormat,
} from './imageUtils';
import type { ToolProps } from '@/types';

type Mode = 'fit' | 'exact';

export default function ImageResizer({ initial }: ToolProps) {
  const { t } = useI18n();
  const { success } = useToast();

  const [mode, setMode] = useState<Mode>('fit');
  const [width, setWidth] = useState(initial?.width ?? '1920');
  const [height, setHeight] = useState(initial?.height ?? '1080');
  const [format, setFormat] = useState<OutputFormat>('image/png');

  const process = useCallback(
    async (image: LoadedImage) => {
      const targetWidth = clamp(Number(width) || image.width, 1, 12000);
      const targetHeight = clamp(Number(height) || image.height, 1, 12000);

      // "Fit" keeps each image's own aspect ratio inside the box; "exact" forces the size.
      const size =
        mode === 'fit'
          ? fitDimensions(image.width, image.height, targetWidth, targetHeight)
          : { width: targetWidth, height: targetHeight };

      const canvas = renderToCanvas(image.element, {
        width: size.width,
        height: size.height,
        background: format === 'image/jpeg' ? '#FFFFFF' : undefined,
      });
      const blob = await canvasToBlob(canvas, format, 0.92);
      if (!blob) return null;

      return {
        blob,
        width: canvas.width,
        height: canvas.height,
        name: `${image.name.replace(/\.[^.]+$/, '')}-${canvas.width}x${canvas.height}.${extensionFor(format)}`,
      };
    },
    [mode, width, height, format],
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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
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
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('resize.mode')}</span>
          <Segmented
            value={mode}
            onChange={setMode}
            ariaLabel={t('resize.mode')}
            options={[
              { value: 'fit', label: t('resize.fit') },
              { value: 'exact', label: t('resize.exact') },
            ]}
          />
          <p className="mt-1.5 px-1 text-[11px] leading-relaxed text-faint">
            {mode === 'fit' ? t('resize.fitHint') : t('resize.exactHint')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={mode === 'fit' ? t('resize.maxWidth') : t('common.width')}
            value={width}
            onChange={(event) => setWidth(event.target.value)}
            inputMode="numeric"
          />
          <Input
            label={mode === 'fit' ? t('resize.maxHeight') : t('common.height')}
            value={height}
            onChange={(event) => setHeight(event.target.value)}
            inputMode="numeric"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('img.presets')}</span>
          <div className="flex flex-wrap gap-2">
            {RESIZE_PRESETS.filter((preset) => preset.width > 0).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setWidth(String(preset.width));
                  setHeight(String(preset.height));
                }}
                className="nova-chip"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('img.outputFormat')}</span>
          <Segmented
            value={format}
            onChange={(value) => setFormat(value as OutputFormat)}
            ariaLabel={t('img.outputFormat')}
            options={OUTPUT_FORMATS.map((item) => ({ value: item.value, label: item.label }))}
          />
        </div>

        <div className="grid gap-2 border-t border-line pt-4">
          <Button variant="primary" block loading={batch.busy} icon={<Crop className="h-4 w-4" />} onClick={() => void batch.run()}>
            {batch.items.length > 1 ? t('batch.processAll', { count: batch.items.length }) : t('img.resize')}
          </Button>

          {batch.items.length > 1 ? (
            <Button
              block
              disabled={ready === 0}
              icon={<Package className="h-4 w-4" />}
              onClick={async () => {
                const archive = await batch.downloadZip(`nova-resized-${Date.now()}.zip`);
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
