import { escapeHtml } from '@/lib/utils';

export interface JsonError {
  message: string;
  line: number;
  column: number;
  position: number;
}

export type ParseResult = { ok: true; value: unknown } | { ok: false; error: JsonError };

export function parseJson(source: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(source) };
  } catch (raw) {
    const message = raw instanceof Error ? raw.message : 'Invalid JSON';
    const match = message.match(/position (\d+)/);
    const position = match ? Number(match[1]) : -1;

    let line = 1;
    let column = 1;
    if (position >= 0) {
      const before = source.slice(0, position);
      line = before.split('\n').length;
      column = position - before.lastIndexOf('\n');
    }
    return { ok: false, error: { message, line, column, position } };
  }
}

/** Recursively sorts object keys so diffs stay stable. */
export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, sortKeysDeep(item)]),
    );
  }
  return value;
}

export interface JsonStats {
  keys: number;
  depth: number;
  nodes: number;
}

export function inspectJson(value: unknown, depth = 1): JsonStats {
  if (Array.isArray(value)) {
    return value.reduce<JsonStats>(
      (accumulator, item) => {
        const child = inspectJson(item, depth + 1);
        return {
          keys: accumulator.keys + child.keys,
          depth: Math.max(accumulator.depth, child.depth),
          nodes: accumulator.nodes + child.nodes,
        };
      },
      { keys: 0, depth, nodes: 1 },
    );
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.reduce<JsonStats>(
      (accumulator, [, item]) => {
        const child = inspectJson(item, depth + 1);
        return {
          keys: accumulator.keys + child.keys,
          depth: Math.max(accumulator.depth, child.depth),
          nodes: accumulator.nodes + child.nodes,
        };
      },
      { keys: entries.length, depth, nodes: 1 },
    );
  }

  return { keys: 0, depth, nodes: 1 };
}

const TOKEN =
  /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?)|(\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\btrue\b|\bfalse\b)|(\bnull\b)/g;

/**
 * Produces highlighted HTML for a JSON document. Every chunk — matched or not —
 * is HTML-escaped before it is wrapped, so rendering the result is safe.
 */
export function highlightJson(source: string): string {
  let result = '';
  let lastIndex = 0;

  for (const match of source.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    result += escapeHtml(source.slice(lastIndex, index));

    const [token, stringToken, isKey, numberToken, booleanToken, nullToken] = match;
    const escaped = escapeHtml(token);

    if (stringToken) {
      result += isKey
        ? `<span class="text-accent">${escaped}</span>`
        : `<span class="text-success">${escaped}</span>`;
    } else if (numberToken) {
      result += `<span class="text-warning">${escaped}</span>`;
    } else if (booleanToken) {
      result += `<span class="text-danger">${escaped}</span>`;
    } else if (nullToken) {
      result += `<span class="text-faint">${escaped}</span>`;
    } else {
      result += escaped;
    }

    lastIndex = index + token.length;
  }

  result += escapeHtml(source.slice(lastIndex));
  return result;
}

export const JSON_SAMPLE = `{
  "app": "NOVA",
  "tagline": "Everything you need. One place.",
  "tools": 55,
  "offline": true,
  "categories": ["quick-tools", "images", "developer"]
}`;
