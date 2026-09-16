import type { TranslationKey } from '@/lib/i18n';

export interface StrengthReport {
  score: 0 | 1 | 2 | 3 | 4;
  entropy: number;
  /** Seconds an offline attacker at 1e10 guesses/s would need on average. */
  crackSeconds: number;
  tips: TranslationKey[];
}

const COMMON = [
  'password', 'qwerty', '123456', '12345678', '111111', 'iloveyou', 'admin', 'welcome', 'monkey', 'dragon',
  'letmein', 'football', 'abc123', 'master', 'sunshine', 'princess', 'qwerty123', 'пароль', 'йцукен',
];

const SEQUENCES = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'йцукенгшщзхї'];

function poolSize(password: string): number {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/\d/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 33;
  // Anything outside ASCII (e.g. Cyrillic) widens the pool considerably.
  if (/[^\x20-\x7E]/.test(password)) pool += 100;
  return Math.max(pool, 1);
}

function hasSequence(password: string): boolean {
  const lower = password.toLowerCase();
  return SEQUENCES.some((sequence) => {
    for (let i = 0; i + 4 <= sequence.length; i += 1) {
      const chunk = sequence.slice(i, i + 4);
      if (lower.includes(chunk) || lower.includes([...chunk].reverse().join(''))) return true;
    }
    return false;
  });
}

/** Password analysis that never leaves the browser and never persists input. */
export function analyzePassword(password: string): StrengthReport {
  const tips: TranslationKey[] = [];
  if (!password) return { score: 0, entropy: 0, crackSeconds: 0, tips: ['pass.tip.length'] };

  const lower = password.toLowerCase();
  const pool = poolSize(password);
  let entropy = password.length * Math.log2(pool);

  const isCommon = COMMON.some((entry) => lower.includes(entry));
  const repeated = /(.)\1{2,}/.test(password);
  const sequence = hasSequence(password);

  if (isCommon) entropy *= 0.35;
  if (repeated) entropy *= 0.8;
  if (sequence) entropy *= 0.75;

  if (password.length < 16) tips.push('pass.tip.length');
  if (!/[A-Z]/.test(password)) tips.push('pass.tip.upper');
  if (!/[a-z]/.test(password)) tips.push('pass.tip.lower');
  if (!/\d/.test(password)) tips.push('pass.tip.digit');
  if (!/[^a-zA-Z0-9]/.test(password)) tips.push('pass.tip.symbol');
  if (repeated) tips.push('pass.tip.repeat');
  if (sequence) tips.push('pass.tip.sequence');
  if (isCommon) tips.push('pass.tip.common');
  if (tips.length === 0) tips.push('pass.tip.good');

  const score: StrengthReport['score'] =
    entropy < 28 ? 0 : entropy < 48 ? 1 : entropy < 72 ? 2 : entropy < 100 ? 3 : 4;

  // 1e10 guesses/second, average case is half the keyspace.
  const crackSeconds = 2 ** entropy / 2 / 1e10;

  return { score, entropy, crackSeconds, tips };
}

export function formatCrackTime(seconds: number, locale: string, instantLabel: string): string {
  if (!Number.isFinite(seconds) || seconds < 1) return instantLabel;
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [2629800, 'day'],
    [31557600, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];

  let value = seconds;
  let unit: Intl.RelativeTimeFormatUnit = 'second';
  const divisors: Record<string, number> = { second: 1, minute: 60, hour: 3600, day: 86400, month: 2629800, year: 31557600 };

  for (const [limit, candidate] of units) {
    if (seconds < limit) {
      unit = candidate;
      value = seconds / divisors[candidate];
      break;
    }
    unit = 'year';
    value = seconds / divisors.year;
  }

  if (value >= 1e6) {
    const formatter = new Intl.NumberFormat(locale, { notation: 'scientific', maximumFractionDigits: 1 });
    return `${formatter.format(value)} ${new Intl.RelativeTimeFormat(locale).formatToParts(2, unit)[2]?.value ?? unit}`;
  }

  const parts = new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).formatToParts(Math.round(value), unit);
  return parts
    .slice(1)
    .map((part) => part.value)
    .join('')
    .trim();
}

const SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/~',
};

const SIMILAR = /[il1Lo0O]/g;

export interface GenerateOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
}

/**
 * Generates a password from `crypto.getRandomValues` with rejection sampling,
 * so every character is uniformly distributed (a plain modulo would bias it).
 */
export function generatePassword(options: GenerateOptions): string {
  let alphabet = '';
  const required: string[] = [];

  const add = (enabled: boolean, set: string) => {
    if (!enabled) return;
    const cleaned = options.excludeSimilar ? set.replace(SIMILAR, '') : set;
    if (!cleaned) return;
    alphabet += cleaned;
    required.push(cleaned);
  };

  add(options.uppercase, SETS.uppercase);
  add(options.lowercase, SETS.lowercase);
  add(options.numbers, SETS.numbers);
  add(options.symbols, SETS.symbols);

  if (!alphabet) return '';

  const pick = (set: string) => {
    const limit = Math.floor(256 / set.length) * set.length;
    const buffer = new Uint8Array(1);
    let value = 256;
    while (value >= limit) {
      crypto.getRandomValues(buffer);
      value = buffer[0];
    }
    return set[value % set.length];
  };

  const characters: string[] = [];
  // Guarantee at least one character from every selected set.
  for (const set of required.slice(0, options.length)) characters.push(pick(set));
  while (characters.length < options.length) characters.push(pick(alphabet));

  // Fisher-Yates with crypto randomness so the guaranteed characters are not positional.
  for (let i = characters.length - 1; i > 0; i -= 1) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    const j = buffer[0] % (i + 1);
    [characters[i], characters[j]] = [characters[j], characters[i]];
  }

  return characters.join('');
}
