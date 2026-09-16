/**
 * Local intent resolution for NOVA's smart search.
 *
 * This is deliberately a rules engine rather than a model call: it runs
 * instantly, works offline, and never sends what the user typed anywhere.
 * `resolveIntent` is the single entry point — swapping in a real AI endpoint
 * later means implementing the same signature and merging its matches with
 * these, not rewriting the callers.
 */
import { evaluate, formatResult, normalizeExpression } from './calc';
import { searchTools } from './search';
import { formatNumber, normalize } from './utils';
import { convertUnits, unitAliasIndex, unitCategoryMap } from '@/features/converters/units';
import { convertCurrency, currencyAliases, referenceRates } from '@/features/converters/currencies';
import type { IntentMatch, Language } from '@/types';

const NUMBER = String.raw`(\d+(?:[.,]\d+)?)`;
const TO_WORDS = String.raw`(?:in|to|into|у|в|на|до|→|=)`;

const strip = (value: string) => value.replace(/,/g, '.');

/* -------------------------------------------------------------- percentage */
function resolvePercentage(query: string, language: Language): IntentMatch | null {
  const text = normalize(query);

  // "15% від 800", "15% of 800", "скільки буде 23% від 1450"
  const ofMatch = text.match(new RegExp(`${NUMBER}\\s*(?:%|відсотк\\w*|процент\\w*|percent)\\s*(?:від|from|of|з)\\s*${NUMBER}`));
  if (ofMatch) {
    const percent = Number(strip(ofMatch[1]));
    const base = Number(strip(ofMatch[2]));
    const value = (base * percent) / 100;
    return {
      toolId: 'percentage-calculator',
      confidence: 0.98,
      initial: { mode: 'of', a: String(percent), b: String(base) },
      answer: `${formatNumber(percent)}% × ${formatNumber(base)} = ${formatNumber(value)}`,
      reason: {
        uk: `${formatNumber(percent)}% від ${formatNumber(base)} — це ${formatNumber(value)}`,
        en: `${formatNumber(percent)}% of ${formatNumber(base)} is ${formatNumber(value)}`,
      },
    };
  }

  // "20 це скільки відсотків від 80" / "20 is what percent of 80"
  const shareMatch = text.match(
    new RegExp(`${NUMBER}\\s*(?:це|is)?\\s*(?:скільки|яки\\w*|what|how much)\\s*(?:%|відсотк\\w*|процент\\w*|percent)\\w*\\s*(?:від|of|з)\\s*${NUMBER}`),
  );
  if (shareMatch) {
    const part = Number(strip(shareMatch[1]));
    const whole = Number(strip(shareMatch[2]));
    const value = whole === 0 ? Number.NaN : (part / whole) * 100;
    return {
      toolId: 'percentage-calculator',
      confidence: 0.96,
      initial: { mode: 'share', a: String(part), b: String(whole) },
      answer: `${formatNumber(part)} / ${formatNumber(whole)} = ${formatNumber(value)}%`,
      reason: {
        uk: `${formatNumber(part)} — це ${formatNumber(value)}% від ${formatNumber(whole)}`,
        en: `${formatNumber(part)} is ${formatNumber(value)}% of ${formatNumber(whole)}`,
      },
    };
  }

  void language;
  return null;
}

/* ------------------------------------------------------------------- units */
function resolveUnits(query: string): IntentMatch | null {
  const text = normalize(query).replace(/([\d.,]+)([a-zа-яіїєґ°"']+)/gi, '$1 $2');

  const pattern = new RegExp(`${NUMBER}\\s*([a-zа-яіїєґ°²³/"']+(?:\\s?[a-zа-яіїєґ]+)?)\\s*${TO_WORDS}\\s*([a-zа-яіїєґ°²³/"']+(?:\\s?[a-zа-яіїєґ]+)?)`, 'i');
  const match = text.match(pattern);
  if (!match) return null;

  const amount = Number(strip(match[1]));
  const lookup = (raw: string) => {
    const key = raw.trim().toLowerCase();
    return unitAliasIndex.get(key) ?? unitAliasIndex.get(key.split(' ')[0]) ?? null;
  };

  const from = lookup(match[2]);
  const to = lookup(match[3]);
  if (!from || !to || from.category !== to.category || from.unit.id === to.unit.id) return null;

  const value = convertUnits(from.category, from.unit.id, to.unit.id, amount);
  if (!Number.isFinite(value)) return null;

  const category = unitCategoryMap.get(from.category);
  const toolId = `${from.category}-converter`;

  return {
    toolId,
    confidence: 0.97,
    initial: {
      category: from.category,
      from: from.unit.id,
      to: to.unit.id,
      value: String(amount),
    },
    answer: `${formatNumber(amount)} ${from.unit.symbol} = ${formatNumber(value)} ${to.unit.symbol}`,
    reason: {
      uk: `${category?.name.uk}: ${formatNumber(amount)} ${from.unit.symbol} → ${formatNumber(value)} ${to.unit.symbol}`,
      en: `${category?.name.en}: ${formatNumber(amount)} ${from.unit.symbol} → ${formatNumber(value)} ${to.unit.symbol}`,
    },
  };
}

/* -------------------------------------------------------------- currencies */
function resolveCurrency(query: string): IntentMatch | null {
  const text = normalize(query).replace(/([\d.,]+)\s*([a-zа-яіїєґ$€₴£]+)/gi, '$1 $2');
  const pattern = new RegExp(`${NUMBER}\\s*([a-zа-яіїєґ$€₴£]+)\\s*${TO_WORDS}\\s*([a-zа-яіїєґ$€₴£]+)`, 'i');
  const match = text.match(pattern);
  if (!match) return null;

  const from = currencyAliases[match[2].toLowerCase()];
  const to = currencyAliases[match[3].toLowerCase()];
  if (!from || !to || from === to) return null;

  const amount = Number(strip(match[1]));
  const value = convertCurrency(referenceRates, from, to, amount);
  if (!Number.isFinite(value)) return null;

  return {
    toolId: 'currency-converter',
    confidence: 0.94,
    initial: { from, to, amount: String(amount) },
    answer: `${formatNumber(amount)} ${from} ≈ ${formatNumber(value, 2)} ${to}`,
    reason: {
      uk: `За довідковим курсом: ${formatNumber(amount)} ${from} ≈ ${formatNumber(value, 2)} ${to}`,
      en: `At the reference rate: ${formatNumber(amount)} ${from} ≈ ${formatNumber(value, 2)} ${to}`,
    },
  };
}

/* -------------------------------------------------------------------- math */
const MATH_PREFIXES =
  /^(?:порахуй|порахувати|обчисли|обчислити|скільки буде|скільки|порахуйте|calculate|compute|what is|whats|how much is|solve)\s*/i;

function resolveMath(query: string): IntentMatch | null {
  const cleaned = query.trim().replace(MATH_PREFIXES, '').replace(/[?=]+$/, '').trim();
  if (!cleaned) return null;

  const normalized = normalizeExpression(cleaned);
  if (!/^[\d+\-*/%^().]+$/.test(normalized)) return null;
  if (!/[+\-*/%^]/.test(normalized) && !/\d/.test(normalized)) return null;
  // A bare number is not a calculation worth answering.
  if (/^\d+(\.\d+)?$/.test(normalized)) return null;

  const result = evaluate(normalized);
  if (!result.ok) return null;

  return {
    toolId: 'calculator',
    confidence: 0.99,
    initial: { expression: cleaned },
    answer: `${cleaned} = ${formatResult(result.value)}`,
    reason: {
      uk: `Результат: ${formatResult(result.value)}`,
      en: `Result: ${formatResult(result.value)}`,
    },
  };
}

/* ---------------------------------------------------------------- keywords */
interface Rule {
  toolId: string;
  patterns: RegExp[];
  confidence: number;
  reason: { uk: string; en: string };
  extract?: (query: string) => Record<string, string> | undefined;
}

const URL_PATTERN = /(https?:\/\/[^\s]+|(?:www\.)[^\s]+|[a-z0-9-]+\.(?:com|net|org|io|ua|dev|app|me|co)(?:\/[^\s]*)?)/i;

const rules: Rule[] = [
  {
    toolId: 'qr-generator',
    patterns: [/\bqr\b/i, /кюар/i, /qr[- ]?код/i, /qr[- ]?code/i],
    confidence: 0.93,
    reason: { uk: 'Створити QR-код', en: 'Create a QR code' },
    extract: (query) => {
      const url = query.match(URL_PATTERN)?.[0];
      return url ? { type: 'url', url: url.startsWith('http') ? url : `https://${url}` } : undefined;
    },
  },
  {
    toolId: 'image-compressor',
    patterns: [
      /стисн\w*\s*(фото|зображ\w*|картинк\w*|імідж)/i,
      /compress\w*\s*(image|photo|picture)/i,
      /(фото|зображення|картинка|image|photo|picture)[^.]{0,40}(важить|заваж\w*|велик\w*|too (?:big|large)|weighs|\d+\s*(мб|mb|кб|kb))/i,
      /зменшити\s*(вагу|розмір)\s*(фото|зображ\w*)/i,
      /reduce\s*(file\s*)?size/i,
      /optimi[sz]e\s*(image|photo)/i,
    ],
    confidence: 0.9,
    reason: { uk: 'Зменшити вагу зображення локально', en: 'Shrink the image locally' },
  },
  {
    toolId: 'password-generator',
    patterns: [/пароль/i, /password/i, /придумай\s*пароль/i],
    confidence: 0.88,
    reason: { uk: 'Згенерувати надійний пароль', en: 'Generate a strong password' },
    extract: (query) => {
      const length = query.match(/(\d{1,3})\s*(?:символ\w*|знак\w*|char\w*|digits?)?/i);
      const value = length ? Number(length[1]) : NaN;
      return Number.isFinite(value) && value >= 4 && value <= 128 ? { length: String(value) } : undefined;
    },
  },
  {
    toolId: 'image-resizer',
    patterns: [/змінити\s*розмір/i, /resize/i, /обріз\w*\s*до\s*\d+/i, /\b\d{2,4}\s?[x×]\s?\d{2,4}\b/i],
    confidence: 0.85,
    reason: { uk: 'Змінити розміри зображення', en: 'Resize the image' },
    extract: (query) => {
      const size = query.match(/(\d{2,5})\s?[x×]\s?(\d{2,5})/i);
      return size ? { width: size[1], height: size[2] } : undefined;
    },
  },
  {
    toolId: 'json-formatter',
    patterns: [/json/i, /джейсон/i],
    confidence: 0.86,
    reason: { uk: 'Форматувати та перевірити JSON', en: 'Format and validate JSON' },
  },
  {
    toolId: 'notes',
    patterns: [/нотат\w*/i, /запиши/i, /\bnotes?\b/i, /memo/i],
    confidence: 0.82,
    reason: { uk: 'Записати нотатку', en: 'Write a note' },
  },
  {
    toolId: 'pomodoro',
    patterns: [/помодор/i, /pomodoro/i, /сфокус\w*/i, /focus session/i],
    confidence: 0.85,
    reason: { uk: 'Запустити сесію фокусу', en: 'Start a focus session' },
  },
  {
    toolId: 'timer',
    patterns: [/таймер/i, /\btimer\b/i, /постав\w*\s*на\s*\d+\s*(хв|мін|minute)/i, /countdown/i],
    confidence: 0.84,
    reason: { uk: 'Запустити таймер', en: 'Start a timer' },
    extract: (query) => {
      const minutes = query.match(/(\d{1,3})\s*(?:хв|хвилин\w*|min|minutes?)/i);
      return minutes ? { minutes: minutes[1] } : undefined;
    },
  },
  {
    toolId: 'image-to-pdf',
    patterns: [/(фото|зображ\w*|картинк\w*|image|photo)\w*\s*(?:в|у|to|into)\s*pdf/i, /pdf\s*(?:з|from)\s*фото/i],
    confidence: 0.9,
    reason: { uk: 'Зібрати зображення у PDF', en: 'Combine images into a PDF' },
  },
  {
    toolId: 'background-remover',
    patterns: [/прибрати\s*фон/i, /видалити\s*фон/i, /remove\s*background/i, /без\s*фону/i, /transparent\s*background/i],
    confidence: 0.9,
    reason: { uk: 'Прибрати однорідний фон', en: 'Remove a flat background' },
  },
  {
    toolId: 'hash-generator',
    patterns: [/\bhash\b/i, /хеш/i, /sha-?\d+/i, /контрольн\w*\s*сум\w*/i, /checksum/i],
    confidence: 0.86,
    reason: { uk: 'Обчислити хеш', en: 'Compute a hash' },
  },
  {
    toolId: 'base64-encoder',
    patterns: [/base\s?64/i, /база\s?64/i],
    confidence: 0.86,
    reason: { uk: 'Кодувати або декодувати Base64', en: 'Encode or decode Base64' },
  },
  {
    toolId: 'color-picker',
    patterns: [/колір/i, /\bcolou?r\b/i, /#[0-9a-f]{3,8}\b/i, /палітр\w*/i, /palette/i],
    confidence: 0.8,
    reason: { uk: 'Підібрати колір', en: 'Pick a color' },
    extract: (query) => {
      const hex = query.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i);
      return hex ? { color: hex[0] } : undefined;
    },
  },
  {
    toolId: 'word-counter',
    patterns: [/скільки\s*слів/i, /порахувати\s*слов\w*/i, /word\s*count/i, /кількість\s*символів/i, /character\s*count/i],
    confidence: 0.88,
    reason: { uk: 'Порахувати слова й символи', en: 'Count words and characters' },
  },
  {
    toolId: 'uuid-generator',
    patterns: [/\buuid\b/i, /\bguid\b/i, /ідентифікатор/i],
    confidence: 0.88,
    reason: { uk: 'Згенерувати UUID', en: 'Generate a UUID' },
  },
  {
    toolId: 'regex-tester',
    patterns: [/regex/i, /регуляр\w*\s*вираз/i, /regexp/i],
    confidence: 0.88,
    reason: { uk: 'Перевірити регулярний вираз', en: 'Test a regular expression' },
  },
  {
    toolId: 'timestamp-converter',
    patterns: [/timestamp/i, /unix\s*time/i, /епох\w*/i, /\b1[6-9]\d{8}\b/],
    confidence: 0.84,
    reason: { uk: 'Перетворити Unix-час', en: 'Convert Unix time' },
    extract: (query) => {
      const stamp = query.match(/\b(1[0-9]{9,12})\b/);
      return stamp ? { timestamp: stamp[1] } : undefined;
    },
  },
  {
    toolId: 'short-link',
    patterns: [/коротк\w*\s*посилан\w*/i, /скорот\w*\s*(посилан\w*|url|link)/i, /short\s*(link|url)/i, /shorten/i],
    confidence: 0.86,
    reason: { uk: 'Створити коротке посилання', en: 'Create a short link' },
    extract: (query) => {
      const url = query.match(URL_PATTERN)?.[0];
      return url ? { url: url.startsWith('http') ? url : `https://${url}` } : undefined;
    },
  },
  {
    toolId: 'markdown-preview',
    patterns: [/markdown/i, /\bmd\b/i, /розмітк\w*/i],
    confidence: 0.82,
    reason: { uk: 'Переглянути Markdown', en: 'Preview Markdown' },
  },
  {
    toolId: 'grade-calculator',
    patterns: [/середн\w*\s*бал/i, /оцінк\w*/i, /\bgpa\b/i, /grade/i],
    confidence: 0.8,
    reason: { uk: 'Порахувати середній бал', en: 'Work out your grade' },
  },
  {
    toolId: 'study-assistant',
    patterns: [/конспект/i, /підсумуй/i, /summar(?:y|ize|ise)/i, /вивчити\s*текст/i, /зроби\s*картки/i],
    confidence: 0.84,
    reason: { uk: 'Опрацювати текст для навчання', en: 'Work through study material' },
  },
  {
    toolId: 'meta-preview',
    patterns: [/open\s?graph/i, /\bog:/i, /мета[- ]?тег\w*/i, /\bseo\b/i, /meta\s*tags?/i],
    confidence: 0.84,
    reason: { uk: 'Перевірити мета-теги сторінки', en: 'Check a page’s meta tags' },
  },
];

function resolveRules(query: string): IntentMatch[] {
  const matches: IntentMatch[] = [];
  for (const rule of rules) {
    if (!rule.patterns.some((pattern) => pattern.test(query))) continue;
    matches.push({
      toolId: rule.toolId,
      confidence: rule.confidence,
      initial: rule.extract?.(query),
      reason: rule.reason,
    });
  }
  return matches;
}

/**
 * Resolves a natural-language query into ranked tool suggestions.
 * Exact answers (math, conversions) come first, then rule matches, then a
 * fuzzy pass over the registry.
 */
export function resolveIntent(query: string, language: Language): IntentMatch[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const matches: IntentMatch[] = [];
  const exact = [resolvePercentage(trimmed, language), resolveUnits(trimmed), resolveCurrency(trimmed), resolveMath(trimmed)];
  for (const match of exact) if (match) matches.push(match);

  matches.push(...resolveRules(trimmed));

  const seen = new Set(matches.map((match) => match.toolId));
  for (const { tool, score } of searchTools(trimmed, language, 8)) {
    if (seen.has(tool.id)) continue;
    seen.add(tool.id);
    matches.push({
      toolId: tool.id,
      confidence: Math.min(0.75, score / 1400),
      reason: { uk: tool.description.uk, en: tool.description.en },
    });
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

/** The single answer NOVA acts on for "Do it for me". */
export function resolveBestIntent(query: string, language: Language): IntentMatch | null {
  return resolveIntent(query, language)[0] ?? null;
}
