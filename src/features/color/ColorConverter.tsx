import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useCopy } from '@/hooks/useCopy';
import { Card } from '@/components/ui/Card';
import { ColorField, Input } from '@/components/ui/Field';
import { formatHsl, formatRgb, parseColor, rgbToCmyk, rgbToHex, rgbToHsl, rgbToHsv } from './color';
import type { ToolProps } from '@/types';

export default function ColorConverter({ initial }: ToolProps) {
  const { t } = useI18n();
  const { copy, isCopied } = useCopy();
  const [input, setInput] = useState(initial?.color ?? '#7A8CFF');

  const rgb = parseColor(input);
  const valid = rgb !== null;
  const safe = rgb ?? { r: 122, g: 140, b: 255 };
  const hsl = rgbToHsl(safe);
  const hsv = rgbToHsv(safe);
  const cmyk = rgbToCmyk(safe);

  const rows = [
    { label: t('color.hex'), value: rgbToHex(safe) },
    { label: t('color.rgb'), value: formatRgb(safe) },
    { label: t('color.hsl'), value: formatHsl(hsl) },
    { label: t('color.hsv'), value: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)` },
    { label: t('color.cmyk'), value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
    { label: 'CSS var', value: `--color: ${safe.r} ${safe.g} ${safe.b};` },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="space-y-4">
        <div
          className="h-36 rounded-2xl border border-line transition-colors duration-200"
          style={{ backgroundColor: valid ? rgbToHex(safe) : 'transparent' }}
        />
        <Input
          label={t('common.value')}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="#7A8CFF, rgb(122 140 255), hsl(231 100% 74%)"
          className="font-mono"
          invalid={!valid && input.trim() !== ''}
          spellCheck={false}
        />
        <ColorField label={t('color.picker')} value={rgbToHex(safe)} onChange={setInput} />
        {!valid && input.trim() ? <p className="text-[13px] text-danger">{t('error.invalidInput')}</p> : null}
      </Card>

      <Card>
        <ul className="divide-y divide-line">
          {rows.map((row) => (
            <li key={row.label}>
              <button
                type="button"
                onClick={() => copy(row.value, row.label)}
                className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:text-accent"
              >
                <span className="shrink-0 text-[11px] uppercase tracking-[0.06em] text-faint">{row.label}</span>
                <span className="truncate font-mono text-[13px] text-ink">
                  {isCopied(row.label) ? t('common.copied') : row.value}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
