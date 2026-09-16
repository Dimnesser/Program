export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

const clamp255 = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

export function parseColor(input: string): Rgb | null {
  const value = input.trim().toLowerCase();

  const hex = value.match(/^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3 || digits.length === 4) {
      digits = [...digits].map((char) => char + char).join('');
    }
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
    };
  }

  const rgb = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  if (rgb) return { r: clamp255(+rgb[1]), g: clamp255(+rgb[2]), b: clamp255(+rgb[3]) };

  const hsl = value.match(/^hsla?\(\s*(-?\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)%?[\s,]+(\d+(?:\.\d+)?)%?/);
  if (hsl) return hslToRgb({ h: +hsl[1], s: +hsl[2], l: +hsl[3] });

  return null;
}

export const rgbToHex = ({ r, g, b }: Rgb): string =>
  `#${[r, g, b].map((value) => clamp255(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case red:
        h = ((green - blue) / delta) % 6;
        break;
      case green:
        h = (blue - red) / delta + 2;
        break;
      default:
        h = (red - green) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const saturation = s / 100;
  const lightness = l / 100;
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const hue = ((h % 360) + 360) % 360;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - c / 2;

  let rgb: [number, number, number];
  if (hue < 60) rgb = [c, x, 0];
  else if (hue < 120) rgb = [x, c, 0];
  else if (hue < 180) rgb = [0, c, x];
  else if (hue < 240) rgb = [0, x, c];
  else if (hue < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];

  return { r: clamp255((rgb[0] + m) * 255), g: clamp255((rgb[1] + m) * 255), b: clamp255((rgb[2] + m) * 255) };
}

export function rgbToHsv({ r, g, b }: Rgb) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === red) h = (((green - blue) / delta) % 6) * 60;
    else if (max === green) h = ((blue - red) / delta + 2) * 60;
    else h = ((red - green) / delta + 4) * 60;
    if (h < 0) h += 360;
  }

  return { h: Math.round(h), s: Math.round((max === 0 ? 0 : delta / max) * 100), v: Math.round(max * 100) };
}

export function rgbToCmyk({ r, g, b }: Rgb) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const k = 1 - Math.max(red, green, blue);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - red - k) / (1 - k)) * 100),
    m: Math.round(((1 - green - k) / (1 - k)) * 100),
    y: Math.round(((1 - blue - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

const channelLuminance = (channel: number) => {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = ({ r, g, b }: Rgb) =>
  0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);

export function contrastRatio(a: Rgb, b: Rgb): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export const wcagLevel = (ratio: number) => (ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA Large' : 'Fail');

/** Ten tints and shades built off the source hue, like a design-system ramp. */
export function buildShades(rgb: Rgb): string[] {
  const { h, s } = rgbToHsl(rgb);
  return [95, 88, 78, 66, 56, 48, 40, 32, 24, 16].map((l) => rgbToHex(hslToRgb({ h, s, l })));
}

export function harmonies(rgb: Rgb) {
  const { h, s, l } = rgbToHsl(rgb);
  const at = (offset: number) => rgbToHex(hslToRgb({ h: (h + offset + 360) % 360, s, l }));
  return {
    complementary: [rgbToHex(rgb), at(180)],
    analogous: [at(-30), rgbToHex(rgb), at(30)],
    triadic: [rgbToHex(rgb), at(120), at(240)],
  };
}

export const formatRgb = ({ r, g, b }: Rgb) => `rgb(${r}, ${g}, ${b})`;
export const formatHsl = ({ h, s, l }: Hsl) => `hsl(${h}, ${s}%, ${l}%)`;
