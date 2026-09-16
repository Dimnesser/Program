import { useEffect, useState } from 'react';
import { Crop, Download, RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Checkbox, Input, Segmented } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { downloadBlob, formatBytes, clamp } from '@/lib/utils';
import { ImageDrop } from './ImageDrop';
import {
  canvasToBlob,
  extensionFor,
  OUTPUT_FORMATS,
  renderToCanvas,
  RESIZE_PRESETS,
  type LoadedImage,
  type OutputFormat,
} from './imageUtils';
import type { ToolProps } from '@/types';

export default function ImageResizer({ initial }: ToolProps) {
  const { t } = useI18n();
  const { success, error } = useToast();

  const [image, setImage] = useState<LoadedImage | null>(null);
  const [width, setWidth] = useState(initial?.width ?? '1920');
  const [height, setHeight] = useState(initial?.height ?? '1080');
  const [lockRatio, setLockRatio] = useState(true);
  const [format, setFormat] = useState<OutputFormat>('image/png');
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!image) return;
    setWidth(String(image.width));
    setHeight(String(image.height));
    setFormat(image.type === 'image/jpeg' ? 'image/jpeg' : 'image/png');
  }, [image]);

  useEffect(() => () => {
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  const ratio = image ? image.width / image.height : 1;

  const changeWidth = (value: string) => {
    setWidth(value);
    const numeric = Number(value);
    if (lockRatio && Number.isFinite(numeric) && numeric > 0) {
      setHeight(String(Math.round(numeric / ratio)));
    }
  };

  const changeHeight = (value: string) => {
    setHeight(value);
    const numeric = Number(value);
    if (lockRatio && Number.isFinite(numeric) && numeric > 0) {
      setWidth(String(Math.round(numeric * ratio)));
    }
  };

  const resize = async () => {
    if (!image) return;
    const targetWidth = clamp(Number(width) || 0, 1, 12000);
    const targetHeight = clamp(Number(height) || 0, 1, 12000);
    setBusy(true);
    try {
      const canvas = renderToCanvas(image.element, {
        width: targetWidth,
        height: targetHeight,
        background: format === 'image/jpeg' ? '#FFFFFF' : undefined,
      });
      const blob = await canvasToBlob(canvas, format, 0.92);
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

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-medium text-muted">{image.name}</span>
          <Badge>{formatBytes(image.size)}</Badge>
        </div>
        <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-line bg-surface/50 p-4">
          <img
            src={result?.url ?? image.dataUrl}
            alt={t('common.preview')}
            className="max-h-[420px] max-w-full object-contain"
          />
        </div>
        <p className="mt-3 font-mono text-[11px] text-faint">
          {image.width} × {image.height} → {width} × {height}
          {result ? ` · ${formatBytes(result.blob.size)}` : ''}
        </p>
      </Card>

      <Card className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('common.width')}
            value={width}
            onChange={(event) => changeWidth(event.target.value)}
            inputMode="numeric"
          />
          <Input
            label={t('common.height')}
            value={height}
            onChange={(event) => changeHeight(event.target.value)}
            inputMode="numeric"
          />
        </div>

        <Checkbox checked={lockRatio} onChange={setLockRatio} label={t('img.keepRatio')} />

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('img.presets')}</span>
          <div className="flex flex-wrap gap-2">
            {RESIZE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (preset.width === 0) {
                    setWidth(String(image.width));
                    setHeight(String(image.height));
                    return;
                  }
                  setWidth(String(preset.width));
                  setHeight(String(lockRatio ? Math.round(preset.width / ratio) : preset.height));
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
          <Button variant="primary" block loading={busy} icon={<Crop className="h-4 w-4" />} onClick={() => void resize()}>
            {t('img.resize')}
          </Button>
          <Button
            block
            disabled={!result}
            icon={<Download className="h-4 w-4" />}
            onClick={() => {
              if (!result) return;
              downloadBlob(result.blob, `${image.name.replace(/\.[^.]+$/, '')}-${width}x${height}.${extensionFor(format)}`);
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
