import { useCallback, useEffect, useRef, useState } from 'react';
import { Crop, Download, RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { downloadBlob, formatBytes, clamp } from '@/lib/utils';
import { ImageDrop } from './ImageDrop';
import { canvasToBlob, type LoadedImage } from './imageUtils';

/** Selection in normalized image coordinates (0–1), so it survives zooming. */
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'move' | 'new';

const RATIOS: { id: string; label: string; value: number | null }[] = [
  { id: 'free', label: '—', value: null },
  { id: '1:1', label: '1:1', value: 1 },
  { id: '4:3', label: '4:3', value: 4 / 3 },
  { id: '3:4', label: '3:4', value: 3 / 4 },
  { id: '16:9', label: '16:9', value: 16 / 9 },
  { id: '9:16', label: '9:16', value: 9 / 16 },
];

export default function ImageCropper() {
  const { t } = useI18n();
  const { success, error } = useToast();

  const [image, setImage] = useState<LoadedImage | null>(null);
  const [rect, setRect] = useState<Rect>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [ratio, setRatio] = useState('free');
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ handle: Handle; startX: number; startY: number; origin: Rect } | null>(null);

  useEffect(() => () => {
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  const ratioValue = RATIOS.find((item) => item.id === ratio)?.value ?? null;

  /** Keeps the selection inside the image and honours the locked aspect ratio. */
  const normalize = useCallback(
    (next: Rect): Rect => {
      const aspect = image ? image.width / image.height : 1;
      let { x, y, w, h } = next;

      w = Math.max(w, 0.02);
      h = Math.max(h, 0.02);

      if (ratioValue) {
        // Ratio is expressed in pixels, so convert through the image aspect.
        h = w * (aspect / ratioValue);
        if (y + h > 1) {
          h = 1 - y;
          w = h * (ratioValue / aspect);
        }
      }

      x = clamp(x, 0, 1 - w);
      y = clamp(y, 0, 1 - h);
      w = Math.min(w, 1 - x);
      h = Math.min(h, 1 - y);
      return { x, y, w, h };
    },
    [image, ratioValue],
  );

  useEffect(() => {
    setRect((current) => normalize(current));
  }, [normalize]);

  const pointerPosition = (event: React.PointerEvent | PointerEvent) => {
    const frame = frameRef.current;
    if (!frame) return { x: 0, y: 0 };
    const bounds = frame.getBoundingClientRect();
    return {
      x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
    };
  };

  const startDrag = (handle: Handle) => (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    const point = pointerPosition(event);
    drag.current = { handle, startX: point.x, startY: point.y, origin: rect };
    if (handle === 'new') setRect(normalize({ x: point.x, y: point.y, w: 0.02, h: 0.02 }));
  };

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!drag.current) return;
      const point = pointerPosition(event);
      const { handle, startX, startY, origin } = drag.current;
      const dx = point.x - startX;
      const dy = point.y - startY;

      if (handle === 'move') {
        setRect(normalize({ ...origin, x: origin.x + dx, y: origin.y + dy }));
      } else if (handle === 'new') {
        setRect(
          normalize({
            x: Math.min(startX, point.x),
            y: Math.min(startY, point.y),
            w: Math.abs(point.x - startX),
            h: Math.abs(point.y - startY),
          }),
        );
      } else {
        const right = origin.x + origin.w;
        const bottom = origin.y + origin.h;
        const next = { ...origin };
        if (handle.includes('w')) {
          next.x = Math.min(point.x, right - 0.02);
          next.w = right - next.x;
        } else {
          next.w = Math.max(point.x - origin.x, 0.02);
        }
        if (handle.includes('n')) {
          next.y = Math.min(point.y, bottom - 0.02);
          next.h = bottom - next.y;
        } else {
          next.h = Math.max(point.y - origin.y, 0.02);
        }
        setRect(normalize(next));
      }
    };

    const onUp = () => {
      drag.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [normalize]);

  const pixels = image
    ? {
        x: Math.round(rect.x * image.width),
        y: Math.round(rect.y * image.height),
        w: Math.max(1, Math.round(rect.w * image.width)),
        h: Math.max(1, Math.round(rect.h * image.height)),
      }
    : null;

  const crop = async () => {
    if (!image || !pixels) return;
    setBusy(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = pixels.w;
      canvas.height = pixels.h;
      const context = canvas.getContext('2d');
      if (!context) {
        error(t('error.title'));
        return;
      }
      context.imageSmoothingQuality = 'high';
      context.drawImage(image.element, pixels.x, pixels.y, pixels.w, pixels.h, 0, 0, pixels.w, pixels.h);

      const type = image.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
      const blob = await canvasToBlob(canvas, type, 0.92);
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
  };

  if (!image) {
    return (
      <div className="space-y-5">
        <ImageDrop onLoad={([loaded]) => setImage(loaded)} />
        <PrivacyBadge />
      </div>
    );
  }

  const handleClass =
    'absolute h-3.5 w-3.5 rounded-full border-2 border-accent bg-bg shadow-[0_2px_6px_rgb(0_0_0/0.35)]';

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <Card className="p-4">
        <div
          ref={frameRef}
          onPointerDown={startDrag('new')}
          className="relative mx-auto max-h-[520px] w-fit max-w-full touch-none select-none overflow-hidden rounded-xl border border-line bg-surface/50"
        >
          <img
            src={image.dataUrl}
            alt={image.name}
            draggable={false}
            className="block max-h-[520px] w-auto max-w-full"
          />

          {/* Dim everything outside the selection. */}
          <div
            className="pointer-events-none absolute inset-0 bg-black/55"
            style={{
              clipPath: `polygon(0% 0%, 0% 100%, ${rect.x * 100}% 100%, ${rect.x * 100}% ${rect.y * 100}%, ${
                (rect.x + rect.w) * 100
              }% ${rect.y * 100}%, ${(rect.x + rect.w) * 100}% ${(rect.y + rect.h) * 100}%, ${rect.x * 100}% ${
                (rect.y + rect.h) * 100
              }%, ${rect.x * 100}% 100%, 100% 100%, 100% 0%)`,
            }}
          />

          <div
            onPointerDown={startDrag('move')}
            className="absolute cursor-move border-2 border-accent/90"
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.w * 100}%`,
              height: `${rect.h * 100}%`,
            }}
          >
            {/* Rule-of-thirds guides */}
            <span className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/25" />
            <span className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/25" />
            <span className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/25" />
            <span className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/25" />

            <span onPointerDown={startDrag('nw')} className={`${handleClass} -left-2 -top-2 cursor-nwse-resize`} />
            <span onPointerDown={startDrag('ne')} className={`${handleClass} -right-2 -top-2 cursor-nesw-resize`} />
            <span onPointerDown={startDrag('sw')} className={`${handleClass} -bottom-2 -left-2 cursor-nesw-resize`} />
            <span onPointerDown={startDrag('se')} className={`${handleClass} -bottom-2 -right-2 cursor-nwse-resize`} />
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-faint">{t('crop.hint')}</p>
      </Card>

      <Card className="space-y-4">
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('crop.ratio')}</span>
          <div className="flex flex-wrap gap-1.5">
            {RATIOS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRatio(item.id)}
                className={`nova-chip ${ratio === item.id ? 'border-accent/40 bg-accent/10 text-accent hover:text-accent' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <Button size="sm" block onClick={() => setRect(normalize({ x: 0, y: 0, w: 1, h: 1 }))}>
          {t('crop.selectAll')}
        </Button>

        {pixels ? (
          <dl className="space-y-2 rounded-xl border border-line bg-surface/60 px-3.5 py-3 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t('img.dimensions')}</dt>
              <dd className="font-mono text-ink">
                {pixels.w} × {pixels.h}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t('crop.position')}</dt>
              <dd className="font-mono text-ink">
                {pixels.x}, {pixels.y}
              </dd>
            </div>
          </dl>
        ) : null}

        {result ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted">{t('common.result')}</span>
              <Badge tone="success">{formatBytes(result.blob.size)}</Badge>
            </div>
            <img src={result.url} alt={t('common.result')} className="w-full rounded-xl border border-line" />
          </div>
        ) : null}

        <div className="grid gap-2 border-t border-line pt-4">
          <Button variant="primary" block loading={busy} icon={<Crop className="h-4 w-4" />} onClick={() => void crop()}>
            {t('crop.apply')}
          </Button>
          <Button
            block
            disabled={!result}
            icon={<Download className="h-4 w-4" />}
            onClick={() => {
              if (!result) return;
              downloadBlob(result.blob, `${image.name.replace(/\.[^.]+$/, '')}-crop.${image.type === 'image/jpeg' ? 'jpg' : 'png'}`);
              success(t('toast.downloaded'));
            }}
          >
            {t('common.download')}
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
