export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
  paragraphs: number;
  sentences: number;
  readingSeconds: number;
  speakingSeconds: number;
}

const WORDS_PER_MINUTE = 225;
const SPOKEN_WORDS_PER_MINUTE = 130;

export function analyzeText(text: string): TextStats {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((block) => block.trim()).length : 0;
  const sentences = trimmed ? (trimmed.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) ?? []).length : 0;

  return {
    words,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    lines,
    paragraphs,
    sentences,
    readingSeconds: Math.round((words / WORDS_PER_MINUTE) * 60),
    speakingSeconds: Math.round((words / SPOKEN_WORDS_PER_MINUTE) * 60),
  };
}

const splitWords = (text: string) =>
  text
    .replace(/([a-zа-яїієґ0-9])([A-ZА-ЯЇІЄҐ])/g, '$1 $2')
    .split(/[\s_\-.]+/)
    .filter(Boolean);

export const textOps = {
  uppercase: (text: string) => text.toUpperCase(),
  lowercase: (text: string) => text.toLowerCase(),
  titleCase: (text: string) =>
    text.replace(/\p{L}[\p{L}\p{M}'’]*/gu, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase()),
  sentenceCase: (text: string) =>
    text
      .toLowerCase()
      .replace(/(^\s*\p{L})|([.!?…]\s+\p{L})/gu, (match) => match.toUpperCase()),
  camelCase: (text: string) =>
    splitWords(text)
      .map((word, index) =>
        index === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase(),
      )
      .join(''),
  snakeCase: (text: string) => splitWords(text).map((word) => word.toLowerCase()).join('_'),
  kebabCase: (text: string) => splitWords(text).map((word) => word.toLowerCase()).join('-'),

  removeExtraSpaces: (text: string) =>
    text
      .split(/\r\n|\r|\n/)
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n'),
  removeEmptyLines: (text: string) =>
    text
      .split(/\r\n|\r|\n/)
      .filter((line) => line.trim())
      .join('\n'),
  trimLines: (text: string) =>
    text
      .split(/\r\n|\r|\n/)
      .map((line) => line.trim())
      .join('\n'),
  removeLineBreaks: (text: string) => text.replace(/\s*\r?\n\s*/g, ' ').trim(),
  removePunctuation: (text: string) => text.replace(/[.,/#!$%^&*;:{}=\-_`~()"'«»„“”–—…]/g, ''),
  reverse: (text: string) => [...text].reverse().join(''),
  sortLines: (text: string) =>
    text
      .split(/\r\n|\r|\n/)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .join('\n'),
  sortLinesDesc: (text: string) =>
    text
      .split(/\r\n|\r|\n/)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }))
      .join('\n'),
  dedupeLines: (text: string) => {
    const seen = new Set<string>();
    return text
      .split(/\r\n|\r|\n/)
      .filter((line) => {
        const key = line.trim();
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .join('\n');
  },
  numberLines: (text: string) => {
    const lines = text.split(/\r\n|\r|\n/);
    const width = String(lines.length).length;
    return lines.map((line, index) => `${String(index + 1).padStart(width, ' ')}. ${line}`).join('\n');
  },
} as const;

export type TextOpId = keyof typeof textOps;
