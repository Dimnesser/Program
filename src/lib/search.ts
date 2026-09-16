import { tools } from '@/data/tools';
import type { Language, Tool } from '@/types';
import { fuzzyScore, normalize } from './utils';

export interface ScoredTool {
  tool: Tool;
  score: number;
}

/**
 * Ranks the registry against a free-text query. Names weigh most, then
 * keywords, then descriptions, so "json" surfaces the formatter before a tool
 * that merely mentions JSON.
 */
export function searchTools(query: string, language: Language, limit = 40): ScoredTool[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const words = normalize(trimmed).split(/\s+/).filter(Boolean);

  const scored = tools
    .map((tool) => {
      const name = tool.name[language];
      const otherName = tool.name[language === 'uk' ? 'en' : 'uk'];
      const description = tool.description[language];

      let score = Math.max(fuzzyScore(trimmed, name) * 1.2, fuzzyScore(trimmed, otherName));

      for (const keyword of tool.keywords) {
        const keywordScore = fuzzyScore(trimmed, keyword);
        if (keywordScore > score) score = keywordScore * 0.95;
      }

      // Multi-word queries: reward every word that lands somewhere on the tool.
      if (words.length > 1) {
        const haystack = normalize([name, otherName, description, tool.keywords.join(' ')].join(' '));
        const hits = words.filter((word) => word.length > 2 && haystack.includes(word)).length;
        score += hits * 90;
      }

      const descriptionScore = fuzzyScore(trimmed, description);
      if (descriptionScore > 400) score = Math.max(score, descriptionScore * 0.5);

      if (tool.isPopular) score += 12;
      if (tool.isFeatured) score += 6;

      return { tool, score };
    })
    .filter((entry) => entry.score > 40)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

/** Tools in the same category, used for the "related tools" rail. */
export function relatedTools(tool: Tool, limit = 6): Tool[] {
  const sameCategory = tools.filter((item) => item.category === tool.category && item.id !== tool.id);
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);

  const byKeyword = tools.filter(
    (item) =>
      item.id !== tool.id &&
      !sameCategory.includes(item) &&
      item.keywords.some((keyword) => tool.keywords.includes(keyword)),
  );
  return [...sameCategory, ...byKeyword].slice(0, limit);
}
