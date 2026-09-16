import { useCallback, useEffect, useState } from 'react';
import { Download, RotateCcw, Scissors } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Slider } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { downloadBlob, formatBytes } from '@/lib/utils';
import { ImageDrop } from './ImageDrop';
import { canvasToBlob, renderToCanvas, type LoadedImage } from './imageUtils';

const CHECKERBOARD =
  'repeating-conic-gradient(rgb(var(--nova-border)) 0% 25%, transparent 0% 50%) 50% / 16px 16px';

/**
 * Flood-fills from the image border and clears every pixel within `tolerance`
 * of the sampled background colour. It is a real, local cutout for flat
 * backgrounds — no upload and no model required.
 */
function removeBackground(
  source: HTMLCanvasElement,
  tolerance: number,
  feather: number,
): HTMLCanvasElement {
  const context = source.getContext('2d', { willReadFrequently: true });
  if (!context) return source;

  const { width, height } = source;
  const image = context.getImageData(0, 0, width, height);
  const { data } = image;

  const corners = [0, (width - 1) * 4, (height - 1) * width * 4, ((height - 1) * width + width - 1) * 4];
  const sample = corners.reduce(
    (accumulator, offset) => ({
      r: accumulator.r + data[offset] / corners.length,
      g: accumulator.g + data[offset + 1] / corners.length,
      b: accumulator.b + data[offset + 2] / corners.length,
    }),
    { r: 0, g: 0, b: 0 },
  );

  const threshold = (tolerance / 100) * 441.67; // Max euclidean distance in RGB space.
  const visited = new Uint8Array(width * height);
  const stack: number[] = [];

  for (let x = 0; x < width; x += 1) {
    stack.push(x, x + (height - 1) * width);
  }
  for (let y = 0; y < height; y += 1) {
    stack.push(y * width, y * width + width - 1);
  }

  while (stack.length > 0) {
    const pixel = stack.pop()!;
    if (pixel < 0 || pixel >= width * height || visited[pixel]) continue;
    visited[pixel] = 1;

    const offset = pixel * 4;
    const distance = Math.hypot(data[offset] - sample.r, data[offset + 1] - sample.g, data[offset + 2] - sample.b);
    if (distance > threshold) continue;

    // Feather the boundary so edges do not look cut with scissors.
    const alpha = feather > 0 ? Math.max(0, Math.min(1, (distance - threshold * (1 - feather / 100)) / (threshold * (feather / 100) || 1))) : 0;
    data[offset + 3] = Math.round(data[offset + 3] * alpha);

    const x = pixel % width;
    if (x > 0) stack.push(pixel - 1);
    if (x < width - 1) stack.push(pixel + 1);
    stack.push(pixel - width, pixel + width);
  }

  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  output.getContext('2d')?.putImageData(image, 0, 0);
  return output;
}

export default function BackgroundRemover() {
  const { t } = useI18n();
  const { success, error } = useToast();

  const [image, setImage] = useState<LoadedImage | null>(null);
  const [tolerance, setTolerance] = useState(12);
  const [feather, setFeather] = useState(25);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  const run = useCallback(async () => {
    if (!image) return;
    setBusy(true);
    try {
      const scale = Math.min(1, 2000 / Math.max(image.width, image.height));
      const canvas = renderToCanvas(image.element, {
        width: image.width * scale,
        height: image.height * scale,
      });
      const cut = removeBackground(canvas, tolerance, feather);
      const blob = await canvasToBlob(cut, 'image/png', 1);
      if (!blob) {
        error(t('error.title'));
        return;
      }
      setResult((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { blob, url: URL.createObjectURL(blob) };
      });
      success(t('toast.generated'));
    } finally {
      setBusy(false);
    }
  }, [image, tolerance, feather, error, success, t]);

  if (!image) {
    return (
      <div className="space-y-5">
        <ImageDrop onLoad={([loaded]) => setImage(loaded)} />
        <PrivacyBadge />
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <figure className="space-y-2">
            <figcaption className="text-[12px] font-medium text-muted">{t('img.original')}</figcaption>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-line bg-surface/50">
              <img src={image.dataUrl} alt={t('img.original')} className="max-h-full max-w-full object-contain" />
            </div>
          </figure>
          <figure className="space-y-2">
            <figcaption className="flex items-center justify-between text-[12px] font-medium text-muted">
              {t('common.result')}
              {result ? <span className="font-mono text-faint">{formatBytes(result.blob.size)}</span> : null}
            </figcaption>
            <div
              className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-line"
              style={{ background: CHECKERBOARD }}
            >
              {result ? (
                <img src={result.url} alt={t('common.result')} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="px-4 text-center text-[12px] text-faint">{t('img.bgRemove')}</span>
              )}
            </div>
          </figure>
        </div>
      </Card>

      <Card className="space-y-4">
        <Slider label={t('img.bgTolerance')} value={tolerance} min={2} max={60} onChange={setTolerance} suffix="%" />
        <Slider label={t('img.bgFeather')} value={feather} min={0} max={80} onChange={setFeather} suffix="%" />

        <p className="text-[11px] leading-relaxed text-faint">{t('img.bgHint')}</p>

        <div className="grid gap-2 border-t border-line pt-4">
          <Button variant="primary" block loading={busy} icon={<Scissors className="h-4 w-4" />} onClick={() => void run()}>
            {t('img.bgRemove')}
          </Button>
          <Button
            block
            disabled={!result}
            icon={<Download className="h-4 w-4" />}
            onClick={() => {
              if (!result) return;
              downloadBlob(result.blob, `${image.name.replace(/\.[^.]+$/, '')}-cutout.png`);
              success(t('toast.downloaded'));
            }}
          >
            PNG
          </Button>
          <Button
            block
            variant="ghost"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={() => {
              setResult((current) => {
                if (current) URL.revokeObjectURL(current.url);
                return null;
              });
              setImage(null);
            }}
          >
            {t('common.reset')}
          </Button>
        </div>

        <PrivacyBadge />
      </Card>
    </div>
  );
}
