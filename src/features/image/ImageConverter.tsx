import { useEffect, useState } from 'react';
import { Download, FileImage, RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Segmented, Slider } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { downloadBlob, formatBytes } from '@/lib/utils';
import { ImageDrop } from './ImageDrop';
import { canvasToBlob, extensionFor, OUTPUT_FORMATS, renderToCanvas, type LoadedImage, type OutputFormat } from './imageUtils';

export default function ImageConverter() {
  const { t } = useI18n();
  const { success, error } = useToast();

  const [image, setImage] = useState<LoadedImage | null>(null);
  const [format, setFormat] = useState<OutputFormat>('image/webp');
  const [quality, setQuality] = useState(92);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  const convert = async () => {
    if (!image) return;
    setBusy(true);
    try {
      const canvas = renderToCanvas(image.element, {
        width: image.width,
        height: image.height,
        background: format === 'image/jpeg' ? '#FFFFFF' : undefined,
      });
      const blob = await canvasToBlob(canvas, format, quality / 100);
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
          <div className="flex shrink-0 gap-1.5">
            <Badge>{image.type.replace('image/', '').toUpperCase()}</Badge>
            <Badge>{formatBytes(image.size)}</Badge>
          </div>
        </div>
        <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-line bg-surface/50 p-4">
          <img
            src={result?.url ?? image.dataUrl}
            alt={t('common.preview')}
            className="max-h-[420px] max-w-full object-contain"
          />
        </div>
        {result ? (
          <p className="mt-3 font-mono text-[11px] text-faint">
            {extensionFor(format).toUpperCase()} · {formatBytes(result.blob.size)} (
            {result.blob.size < image.size ? '−' : '+'}
            {Math.abs(Math.round((1 - result.blob.size / image.size) * 100))}%)
          </p>
        ) : null}
      </Card>

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

        {format !== 'image/png' ? (
          <Slider label={t('common.quality')} value={quality} min={10} max={100} onChange={setQuality} suffix="%" />
        ) : null}

        <div className="grid gap-2 border-t border-line pt-4">
          <Button
            variant="primary"
            block
            loading={busy}
            icon={<FileImage className="h-4 w-4" />}
            onClick={() => void convert()}
          >
            {t('common.apply')}
          </Button>
          <Button
            block
            disabled={!result}
            icon={<Download className="h-4 w-4" />}
            onClick={() => {
              if (!result) return;
              downloadBlob(result.blob, `${image.name.replace(/\.[^.]+$/, '')}.${extensionFor(format)}`);
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
