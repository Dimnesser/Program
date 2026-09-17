import { useCallback, useEffect, useState } from 'react';
import { Download, RotateCcw, Type } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Checkbox, Segmented, Slider } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { PrivacyBadge } from '@/components/PrivacyBadge';
import { downloadText } from '@/lib/utils';
import { ImageDrop } from './ImageDrop';
import { renderToCanvas, type LoadedImage } from './imageUtils';

const CHARSETS = {
  detailed: '@%#*+=-:. ',
  blocks: '█▓▒░ ',
  minimal: '#+. ',
};

type CharsetId = keyof typeof CHARSETS;

export default function ImageToAscii() {
  const { t } = useI18n();
  const { success } = useToast();

  const [image, setImage] = useState<LoadedImage | null>(null);
  const [width, setWidth] = useState(100);
  const [charset, setCharset] = useState<CharsetId>('detailed');
  const [invert, setInvert] = useState(false);
  const [ascii, setAscii] = useState('');

  const convert = useCallback(() => {
    if (!image) return;

    // Characters are roughly twice as tall as they are wide.
    const columns = width;
    const rows = Math.max(1, Math.round((image.height / image.width) * columns * 0.5));
    const canvas = renderToCanvas(image.element, { width: columns, height: rows });
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const ramp = invert ? [...CHARSETS[charset]].reverse().join('') : CHARSETS[charset];

    let output = '';
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3] / 255;
        const luminance =
          (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]) / 255;
        const value = 1 - (luminance * alpha + (1 - alpha)); // Transparent reads as white.
        output += ramp[Math.min(ramp.length - 1, Math.floor(value * ramp.length))];
      }
      output += '\n';
    }
    setAscii(output);
  }, [image, width, charset, invert]);

  useEffect(() => {
    convert();
  }, [convert]);

  if (!image) {
    return (
      <div className="space-y-5">
        <ImageDrop onLoad={([loaded]) => setImage(loaded)} />
        <PrivacyBadge />
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <Card className="flex flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[13px] font-medium text-muted">
            <Type className="h-3.5 w-3.5" />
            {t('common.result')}
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <Button
              size="xs"
              variant="ghost"
              icon={<Download className="h-3.5 w-3.5" />}
              disabled={!ascii}
              onClick={() => {
                downloadText(ascii, `nova-ascii-${Date.now()}.txt`);
                success(t('toast.downloaded'));
              }}
            >
              TXT
            </Button>
            <CopyButton value={ascii} size="xs" variant="ghost" compact />
          </div>
        </div>
        <div className="flex-1 overflow-auto rounded-xl border border-line bg-surface/50 p-3">
          <pre className="whitespace-pre font-mono text-[6px] leading-[1.05] text-ink sm:text-[7px] lg:text-[8px]">
            {ascii}
          </pre>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-line bg-surface/50">
          <img src={image.dataUrl} alt={image.name} className="max-h-full max-w-full object-contain" />
        </div>

        <Slider label={t('img.asciiWidth')} value={width} min={40} max={220} step={2} onChange={setWidth} />

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">{t('img.asciiCharset')}</span>
          <Segmented
            value={charset}
            onChange={setCharset}
            ariaLabel={t('img.asciiCharset')}
            options={[
              { value: 'detailed', label: '@%#*' },
              { value: 'blocks', label: '█▓▒░' },
              { value: 'minimal', label: '#+.' },
            ]}
          />
        </div>

        <Checkbox checked={invert} onChange={setInvert} label={t('img.asciiInvert')} />

        <p className="text-[11px] leading-relaxed text-faint">{t('img.asciiHint')}</p>

        <Button block variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setImage(null)}>
          {t('common.reset')}
        </Button>

        <PrivacyBadge />
      </Card>
    </div>
  );
}
