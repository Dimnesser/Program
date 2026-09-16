import { loadImage, readFileAsDataUrl } from '@/lib/utils';

export const MAX_IMAGE_BYTES = 30 * 1024 * 1024;

export interface LoadedImage {
  file: File;
  dataUrl: string;
  element: HTMLImageElement;
  width: number;
  height: number;
  size: number;
  type: string;
  name: string;
}

export type LoadError = 'not-image' | 'too-large' | 'decode-failed';

export async function loadImageFile(file: File): Promise<LoadedImage | LoadError> {
  if (!file.type.startsWith('image/')) return 'not-image';
  if (file.size > MAX_IMAGE_BYTES) return 'too-large';

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const element = await loadImage(dataUrl);
    return {
      file,
      dataUrl,
      element,
      width: element.naturalWidth,
      height: element.naturalHeight,
      size: file.size,
      type: file.type,
      name: file.name,
    };
  } catch {
    return 'decode-failed';
  }
}

export interface RenderOptions {
  width: number;
  height: number;
  /** Fill colour used when flattening transparency into JPEG. */
  background?: string;
  smoothing?: boolean;
}

export function renderToCanvas(image: HTMLImageElement, options: RenderOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(options.width));
  canvas.height = Math.max(1, Math.round(options.height));

  const context = canvas.getContext('2d');
  if (!context) return canvas;

  context.imageSmoothingEnabled = options.smoothing ?? true;
  context.imageSmoothingQuality = 'high';

  if (options.background) {
    context.fillStyle = options.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

export const OUTPUT_FORMATS = [
  { value: 'image/jpeg', label: 'JPEG', extension: 'jpg', lossy: true },
  { value: 'image/webp', label: 'WebP', extension: 'webp', lossy: true },
  { value: 'image/png', label: 'PNG', extension: 'png', lossy: false },
] as const;

export type OutputFormat = (typeof OUTPUT_FORMATS)[number]['value'];

export const extensionFor = (type: string) =>
  OUTPUT_FORMATS.find((format) => format.value === type)?.extension ?? 'png';

/** Keeps a resize proportional when the aspect ratio is locked. */
export function fitDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

export const RESIZE_PRESETS = [
  { id: 'original', label: 'Original', width: 0, height: 0 },
  { id: 'hd', label: '1920 × 1080', width: 1920, height: 1080 },
  { id: 'square', label: '1080 × 1080', width: 1080, height: 1080 },
  { id: 'story', label: '1080 × 1920', width: 1080, height: 1920 },
  { id: 'thumb', label: '512 × 512', width: 512, height: 512 },
  { id: 'avatar', label: '256 × 256', width: 256, height: 256 },
];

/**
 * Canvas always discards EXIF, so "keep metadata" is implemented by lifting the
 * APP1 (Exif) segment out of the source JPEG and splicing it back into the
 * re-encoded one. Only JPEG carries this segment; other formats return null.
 */
export function extractExifSegment(buffer: ArrayBuffer): Uint8Array | null {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null; // Not a JPEG.

  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    if (marker === 0xda) return null; // Start of scan — no EXIF found.

    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (marker === 0xe1) {
      const segment = bytes.slice(offset, offset + 2 + length);
      const tag = String.fromCharCode(...segment.slice(4, 8));
      if (tag === 'Exif') return segment;
    }
    offset += 2 + length;
  }
  return null;
}

export async function injectExifSegment(blob: Blob, segment: Uint8Array): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return blob;

  // Skip a JFIF APP0 block if the encoder emitted one, then insert EXIF.
  let insertAt = 2;
  if (bytes[2] === 0xff && bytes[3] === 0xe0) {
    insertAt = 4 + ((bytes[4] << 8) | bytes[5]);
  }

  const output = new Uint8Array(bytes.length + segment.length);
  output.set(bytes.slice(0, insertAt), 0);
  output.set(segment, insertAt);
  output.set(bytes.slice(insertAt), insertAt + segment.length);
  return new Blob([output], { type: 'image/jpeg' });
}
