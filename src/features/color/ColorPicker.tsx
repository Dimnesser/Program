import { useRef, useState } from 'react';
import { Image as ImageIcon, Pipette } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCopy } from '@/hooks/useCopy';
import { Card } from '@/components/ui/Card';
import { ColorField, Slider } from '@/components/ui/Field';
import { FileDrop } from '@/components/ui/FileDrop';
import { Badge } from '@/components/ui/Badge';
import { readFileAsDataUrl, cn } from '@/lib/utils';
import {
  buildShades,
  contrastRatio,
  formatHsl,
  formatRgb,
  harmonies,
  hslToRgb,
  parseColor,
  rgbToHex,
  rgbToHsl,
  wcagLevel,
} from './color';
import type { ToolProps } from '@/types';

const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };

export default function ColorPicker({ initial }: ToolProps) {
  const { t } = useI18n();
  const { copy, isCopied } = useCopy();
  const [hex, setHex] = useState(initial?.color?.toUpperCase() ?? '#7A8CFF');
  const [image, setImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rgb = parseColor(hex) ?? { r: 122, g: 140, b: 255 };
  const hsl = rgbToHsl(rgb);
  const shades = buildShades(rgb);
  const harmony = harmonies(rgb);

  const onWhite = contrastRatio(rgb, WHITE);
  const onBlack = contrastRatio(rgb, BLACK);

  const sampleImage = (event: React.MouseEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    canvas.width = target.naturalWidth;
    canvas.height = target.naturalHeight;
    context.drawImage(target, 0, 0);

    const bounds = target.getBoundingClientRect();
    const x = Math.round(((event.clientX - bounds.left) / bounds.width) * target.naturalWidth);
    const y = Math.round(((event.clientY - bounds.top) / bounds.height) * target.naturalHeight);
    const [r, g, b] = context.getImageData(x, y, 1, 1).data;
    setHex(rgbToHex({ r, g, b }));
  };

  const values = [
    { label: t('color.hex'), value: rgbToHex(rgb) },
    { label: t('color.rgb'), value: formatRgb(rgb) },
    { label: t('color.hsl'), value: formatHsl(hsl) },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <Card className="space-y-4">
          <div
            className="flex h-40 items-end justify-between rounded-2xl border border-line p-4 transition-colors duration-200"
            style={{ backgroundColor: rgbToHex(rgb) }}
          >
            <span
              className="rounded-lg bg-black/25 px-2.5 py-1 font-mono text-[13px] font-medium text-white backdrop-blur-sm"
            >
              {rgbToHex(rgb)}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ColorField label={t('color.picker')} value={rgbToHex(rgb)} onChange={setHex} />
            <div className="space-y-2">
              <Slider
                label="H"
                value={hsl.h}
                min={0}
                max={360}
                onChange={(h) => setHex(rgbToHex(hslToRgb({ ...hsl, h })))}
              />
              <Slider
                label="S"
                value={hsl.s}
                min={0}
                max={100}
                onChange={(s) => setHex(rgbToHex(hslToRgb({ ...hsl, s })))}
                suffix="%"
              />
              <Slider
                label="L"
                value={hsl.l}
                min={0}
                max={100}
                onChange={(l) => setHex(rgbToHex(hslToRgb({ ...hsl, l })))}
                suffix="%"
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {values.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => copy(item.value, item.label)}
                className="rounded-xl border border-line bg-surface/60 px-3 py-2.5 text-left transition-colors hover:border-line-strong"
              >
                <span className="block text-[11px] uppercase tracking-[0.06em] text-faint">{item.label}</span>
                <span className="mt-0.5 block truncate font-mono text-[13px] text-ink">
                  {isCopied(item.label) ? t('common.copied') : item.value}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
            <ImageIcon className="h-4 w-4 text-accent" />
            {t('color.fromImage')}
          </h2>
          {image ? (
            <div className="space-y-3">
              <img
                src={image}
                alt={t('color.fromImage')}
                onClick={sampleImage}
                className="max-h-[320px] w-full cursor-crosshair rounded-xl border border-line object-contain"
              />
              <p className="text-[12px] text-muted">{t('color.clickImage')}</p>
              <button
                type="button"
                onClick={() => setImage(null)}
                className="text-[13px] font-medium text-accent transition-colors hover:brightness-110"
              >
                {t('common.reset')}
              </button>
            </div>
          ) : (
            <FileDrop
              compact
              icon={<Pipette className="h-4 w-4" />}
              title={t('color.fromImage')}
              onFiles={async ([file]) => setImage(await readFileAsDataUrl(file))}
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <h2 className="mb-3 text-[13px] font-semibold text-ink">{t('color.shades')}</h2>
          <div className="grid grid-cols-5 gap-1.5">
            {shades.map((shade) => (
              <button
                key={shade}
                type="button"
                onClick={() => copy(shade, shade)}
                title={shade}
                className="group relative h-12 rounded-lg border border-line transition-transform hover:scale-105"
                style={{ backgroundColor: shade }}
              >
                <span className="sr-only">{shade}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-[13px] font-semibold text-ink">{t('color.harmony')}</h2>
          <div className="space-y-3">
            {(
              [
                ['color.complementary', harmony.complementary],
                ['color.analogous', harmony.analogous],
                ['color.triadic', harmony.triadic],
              ] as const
            ).map(([labelKey, colors]) => (
              <div key={labelKey}>
                <p className="mb-1.5 text-[11px] uppercase tracking-[0.06em] text-faint">{t(labelKey)}</p>
                <div className="flex gap-1.5">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setHex(color)}
                      title={color}
                      className="h-10 flex-1 rounded-lg border border-line transition-transform hover:scale-105"
                      style={{ backgroundColor: color }}
                    >
                      <span className="sr-only">{color}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-[13px] font-semibold text-ink">WCAG</h2>
          <div className="space-y-2">
            {[
              { label: t('color.contrastWhite'), ratio: onWhite, background: '#FFFFFF' },
              { label: t('color.contrastBlack'), ratio: onBlack, background: '#000000' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5"
                style={{ backgroundColor: item.background }}
              >
                <span className="truncate text-[13px] font-medium" style={{ color: rgbToHex(rgb) }}>
                  {item.label}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-[12px]" style={{ color: rgbToHex(rgb) }}>
                    {item.ratio.toFixed(2)}
                  </span>
                  <Badge
                    tone={item.ratio >= 4.5 ? 'success' : item.ratio >= 3 ? 'warning' : 'danger'}
                    className={cn('shrink-0')}
                  >
                    {wcagLevel(item.ratio)}
                  </Badge>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
