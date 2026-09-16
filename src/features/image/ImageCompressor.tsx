import { useCallback, useEffect, useState } from 'react';
import { Download, RotateCcw, Shrink } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Checkbox, Segmented, Slider } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { downloadBlob, formatBytes, cn } from '@/lib/utils';
import { ImageDrop } from './ImageDrop';
import {
  canvasToBlob,
  extensionFor,
  extractExifSegment,
  fitDimensions,
  injectExifSegment,
  OUTPUT_FORMATS,
  renderToCanvas,
  type LoadedImage,
  type OutputFormat,
} from './imageUtils';

interface Result {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

export default function ImageCompressor() {
  const { t } = useI18n();
  const { success, error } = useToast();

  const [image, setImage] = useState<LoadedImage | null>(null);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<OutputFormat>('image/jpeg');
  const [scale, setScale] = useState(100);
  const [keepMetadata, setKeepMetadata] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  const compress = useCallback(async () => {
    if (!image) return;
    setBusy(true);
    try {
      const target = fitDimensions(
        image.width,
        image.height,
        Math.round((image.width * scale) / 100),
        Math.round((image.height * scale) / 100),
      );
      const canvas = renderToCanvas(image.element, {
        width: target.width,
        height: target.height,
        background: format === 'image/jpeg' ? '#FFFFFF' : undefined,
      });
      let blob = await canvasToBlob(canvas, format, quality / 100);
      if (!blob) {
        error(t('error.title'));
        return;
      }

      // Re-attach the source EXIF when both ends are JPEG and the user asked for it.
      if (keepMetadata && format === 'image/jpeg' && image.type === 'image/jpeg') {
        const segment = extractExifSegment(await image.file.arrayBuffer());
        if (segment) blob = await injectExifSegment(blob, segment);
      }
      setResult((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { blob, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height };
      });
      success(t('toast.compressed'));
    } finally {
      setBusy(false);
    }
  }, [image, quality, format, scale, keepMetadata, error, success, t]);

  const reset = () => {
    setResult((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    setImage(null);
    setQuality(75);
    setScale(100);
  };

  const savedPercent = image && result ? Math.round((1 - result.blob.size / image.size) * 100) : 0;
  const exifSupported = format === 'image/jpeg' && image?.type === 'image/jpeg';

  if (!image) {
    return (
      <div className="space-y-5">
        <ImageDrop onLoad={([loaded]) => setImage(loaded)} />
        <PrivacyBadge />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Card className="p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <figure className="space-y-2">
                <figcaption className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-muted">{t('img.original')}</span>
                  <Badge>{formatBytes(image.size)}</Badge>
                </figcaption>
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-line bg-surface/50">
                  <img src={image.dataUrl} alt={t('img.original')} className="max-h-full max-w-full object-contain" />
                </div>
                <p className="font-mono text-[11px] text-faint">
                  {image.width} × {image.height} · {image.type.replace('image/', '').toUpperCase()}
                </p>
              </figure>

              <figure className="space-y-2">
                <figcaption className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-muted">{t('img.compressed')}</span>
                  {result ? (
                    <Badge tone={savedPercent > 0 ? 'success' : 'warning'}>{formatBytes(result.blob.size)}</Badge>
                  ) : (
                    <Badge>—</Badge>
                  )}
                </figcaption>
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-line bg-surface/50">
                  {result ? (
                    <img src={result.url} alt={t('img.compressed')} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="px-4 text-center text-[12px] text-faint">{t('img.compress')}</span>
                  )}
                </div>
                <p className="font-mono text-[11px] text-faint">
                  {result ? `${result.width} × ${result.height} · ${extensionFor(format).toUpperCase()}` : '—'}
                </p>
              </figure>
            </div>
          </Card>

          {result ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: t('img.original'), value: formatBytes(image.size) },
                { label: t('img.compressed'), value: formatBytes(result.blob.size) },
                {
                  label: t('img.saved'),
                  value: `${savedPercent > 0 ? '−' : '+'}${Math.abs(savedPercent)}%`,
                  tone: savedPercent > 0,
                },
                { label: t('img.dimensions'), value: `${result.width}×${result.height}` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-line bg-card/60 px-3 py-2.5">
                  <div className="truncate text-[10px] uppercase tracking-[0.06em] text-faint">{item.label}</div>
                  <div
                    className={cn(
                      'mt-0.5 truncate font-mono text-[15px] font-semibold text-ink',
                      item.tone === true && 'text-success',
                      item.tone === false && 'text-warning',
                    )}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <Card className="space-y-4">
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
          <p className="-mt-2 font-mono text-[11px] text-faint">
            {Math.round((image.width * scale) / 100)} × {Math.round((image.height * scale) / 100)}
          </p>

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
              loading={busy}
              icon={<Shrink className="h-4 w-4" />}
              onClick={() => void compress()}
            >
              {t('img.compress')}
            </Button>
            <Button
              block
              disabled={!result}
              icon={<Download className="h-4 w-4" />}
              onClick={() => {
                if (!result) return;
                downloadBlob(result.blob, `${image.name.replace(/\.[^.]+$/, '')}-nova.${extensionFor(format)}`);
                success(t('toast.downloaded'));
              }}
            >
              {t('common.download')}
            </Button>
            <Button block variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={reset}>
              {t('common.reset')}
            </Button>
          </div>

          <PrivacyBadge />
        </Card>
      </div>
    </div>
  );
}
