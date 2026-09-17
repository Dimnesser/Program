/**
 * Ukrainian/Russian to Latin transliteration, following the Ukrainian national
 * standard (KMU 55:2010) closely enough for URL slugs: it is the table people
 * expect to see in a Ukrainian product.
 */
const TABLE: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z',
  и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e', ё: 'e', ъ: '',
};

/** Word-initial forms differ in the standard: Єва -> Yeva, not Ieva. */
const INITIAL: Record<string, string> = { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya' };

export function transliterate(input: string): string {
  let result = '';
  let atWordStart = true;

  for (const char of input) {
    const lower = char.toLowerCase();
    const isLetter = /\p{L}/u.test(char);

    let mapped: string | undefined;
    if (atWordStart && INITIAL[lower] !== undefined) mapped = INITIAL[lower];
    else if (TABLE[lower] !== undefined) mapped = TABLE[lower];

    if (mapped !== undefined) {
      result += char === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
    } else {
      result += char;
    }

    atWordStart = !isLetter;
  }

  // "зг" is the one digraph the standard spells out explicitly.
  return result.replace(/zh(?=h)/gi, 'z');
}

export interface SlugOptions {
  separator?: string;
  lowercase?: boolean;
  maxLength?: number;
}

export function slugify(input: string, options: SlugOptions = {}): string {
  const separator = options.separator ?? '-';
  let value = transliterate(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, separator);

  if (options.lowercase !== false) value = value.toLowerCase();

  const escaped = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  value = value.replace(new RegExp(`^${escaped}+|${escaped}+$`, 'g'), '');
  value = value.replace(new RegExp(`${escaped}{2,}`, 'g'), separator);

  if (options.maxLength && value.length > options.maxLength) {
    value = value.slice(0, options.maxLength).replace(new RegExp(`${escaped}+$`), '');
  }
  return value;
}
