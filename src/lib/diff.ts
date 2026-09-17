/**
 * Line diff built on a longest-common-subsequence table.
 *
 * The table is O(n·m), which is fine for the documents people actually paste
 * into a browser tool; beyond `MAX_LINES` the inputs are compared in truncated
 * form rather than freezing the tab.
 */

export type DiffType = 'same' | 'add' | 'del';

export interface DiffRow {
  type: DiffType;
  text: string;
  /** 1-based line numbers, null where the row does not exist on that side. */
  leftNo: number | null;
  rightNo: number | null;
}

export interface DiffResult {
  rows: DiffRow[];
  added: number;
  removed: number;
  unchanged: number;
  truncated: boolean;
}

export const MAX_DIFF_LINES = 2000;

export interface DiffOptions {
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
}

const normalizeLine = (line: string, options: DiffOptions) => {
  let value = line;
  if (options.ignoreWhitespace) value = value.trim().replace(/\s+/g, ' ');
  if (options.ignoreCase) value = value.toLowerCase();
  return value;
};

export function diffLines(left: string, right: string, options: DiffOptions = {}): DiffResult {
  const rawLeft = left.split(/\r\n|\r|\n/);
  const rawRight = right.split(/\r\n|\r|\n/);

  const truncated = rawLeft.length > MAX_DIFF_LINES || rawRight.length > MAX_DIFF_LINES;
  const a = rawLeft.slice(0, MAX_DIFF_LINES);
  const b = rawRight.slice(0, MAX_DIFF_LINES);

  const keyA = a.map((line) => normalizeLine(line, options));
  const keyB = b.map((line) => normalizeLine(line, options));

  // lcs[i][j] = length of the longest common subsequence of a[i:] and b[j:].
  const lcs: Uint32Array[] = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lcs[i][j] = keyA[i] === keyB[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const rows: DiffRow[] = [];
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (keyA[i] === keyB[j]) {
      rows.push({ type: 'same', text: a[i], leftNo: i + 1, rightNo: j + 1 });
      unchanged += 1;
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      rows.push({ type: 'del', text: a[i], leftNo: i + 1, rightNo: null });
      removed += 1;
      i += 1;
    } else {
      rows.push({ type: 'add', text: b[j], leftNo: null, rightNo: j + 1 });
      added += 1;
      j += 1;
    }
  }
  while (i < a.length) {
    rows.push({ type: 'del', text: a[i], leftNo: i + 1, rightNo: null });
    removed += 1;
    i += 1;
  }
  while (j < b.length) {
    rows.push({ type: 'add', text: b[j], leftNo: null, rightNo: j + 1 });
    added += 1;
    j += 1;
  }

  return { rows, added, removed, unchanged, truncated };
}
