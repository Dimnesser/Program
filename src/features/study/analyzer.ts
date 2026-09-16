/**
 * Local study analysis.
 *
 * The summary is extractive (TextRank-style frequency scoring), terms come from
 * capitalisation and repetition, and flashcards are built from definition
 * patterns. `StudyAnalyzer` is the seam a hosted model would implement later —
 * the UI only depends on the shape of `StudyAnalysis`.
 */
import type { Language } from '@/types';

export interface StudyAnalysis {
  summary: string[];
  keyPoints: string[];
  questions: string[];
  terms: { term: string; definition: string }[];
}

export interface StudyAnalyzer {
  analyze(text: string, options: { language: Language; length: 'short' | 'medium' | 'detailed' }): Promise<StudyAnalysis>;
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'are', 'was', 'were', 'have', 'has', 'had', 'not', 'but',
  'you', 'your', 'they', 'their', 'its', 'can', 'will', 'would', 'which', 'when', 'what', 'who', 'how', 'than',
  'і', 'та', 'що', 'це', 'як', 'для', 'або', 'але', 'він', 'вона', 'вони', 'бути', 'був', 'була', 'було', 'був',
  'у', 'в', 'на', 'до', 'з', 'із', 'по', 'за', 'від', 'при', 'про', 'якщо', 'тому', 'тобто', 'може', 'дуже',
]);

const splitSentences = (text: string): string[] =>
  (text.match(/[^.!?…\n]+[.!?…]*/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.split(/\s+/).length > 3);

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));

export const localAnalyzer: StudyAnalyzer = {
  async analyze(text, { language, length }) {
    const sentences = splitSentences(text);
    if (sentences.length === 0) {
      return { summary: [], keyPoints: [], questions: [], terms: [] };
    }

    const frequency = new Map<string, number>();
    for (const word of tokenize(text)) frequency.set(word, (frequency.get(word) ?? 0) + 1);

    const ranked = sentences
      .map((sentence, index) => {
        const words = tokenize(sentence);
        const score = words.reduce((sum, word) => sum + (frequency.get(word) ?? 0), 0) / (words.length || 1);
        // A small lead bias: opening sentences usually carry the thesis.
        return { sentence, index, score: score * (index < 3 ? 1.15 : 1) };
      })
      .sort((a, b) => b.score - a.score);

    const summaryCount = Math.max(
      1,
      Math.min(sentences.length, length === 'short' ? 2 : length === 'medium' ? 4 : 7),
    );
    const summary = ranked
      .slice(0, summaryCount)
      .sort((a, b) => a.index - b.index)
      .map((item) => item.sentence);

    const keyPoints = ranked
      .slice(0, Math.min(sentences.length, summaryCount + 3))
      .sort((a, b) => a.index - b.index)
      .map((item) => item.sentence.replace(/^\W+/, ''))
      .slice(0, 6);

    // Definition patterns: "X — це Y", "X is Y", "X means Y".
    const terms: { term: string; definition: string }[] = [];
    const definitionPattern =
      /([\p{Lu}][\p{L}\p{N} '’-]{2,40})\s*(?:—|–|-|:|\bце\b|\bis\b|\bare\b|\bmeans\b|\bозначає\b)\s+([^.!?…]{10,200})/gu;
    for (const match of text.matchAll(definitionPattern)) {
      const term = match[1].trim().replace(/\s+(це|is|are)$/i, '');
      if (terms.some((entry) => entry.term.toLowerCase() === term.toLowerCase())) continue;
      terms.push({ term, definition: match[2].trim() });
      if (terms.length >= 12) break;
    }

    // Fall back to the most repeated significant words when nothing was defined.
    if (terms.length < 3) {
      const top = [...frequency.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([word]) => word);
      for (const word of top) {
        const context = sentences.find((sentence) => sentence.toLowerCase().includes(word));
        if (context && !terms.some((entry) => entry.term.toLowerCase() === word)) {
          terms.push({ term: word, definition: context });
        }
        if (terms.length >= 8) break;
      }
    }

    const questionWord = language === 'uk' ? 'Що таке' : 'What is';
    const explainWord = language === 'uk' ? 'Поясніть' : 'Explain';

    const questions = [
      ...terms.slice(0, 5).map((entry) => `${questionWord} ${entry.term}?`),
      ...keyPoints.slice(0, 3).map((point) => {
        const clipped = point.length > 90 ? `${point.slice(0, 90).trim()}…` : point;
        return `${explainWord}: ${clipped}`;
      }),
    ].slice(0, 8);

    return { summary, keyPoints, questions, terms };
  },
};
