/**
 * Namespaced localStorage access.
 *
 * Every read is defensive: a corrupted or hand-edited value can never throw
 * into React render, it simply falls back to the caller's default. Writes are
 * broadcast so that several hooks bound to the same key stay in sync within
 * the tab (the native `storage` event only fires across tabs).
 */

export const STORAGE_PREFIX = 'nova:';

export const StorageKeys = {
  theme: 'theme',
  language: 'language',
  favorites: 'favorites',
  recent: 'recent',
  notes: 'notes',
  pomodoro: 'pomodoro',
  calculator: 'calculator-history',
  flashcards: 'flashcards',
  shortLinks: 'short-links',
  usage: 'usage',
  onboarded: 'onboarded',
  sidebar: 'sidebar-collapsed',
  settings: 'settings',
  counter: 'counter',
  searches: 'recent-searches',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

type Listener = (value: unknown) => void;
const listeners = new Map<string, Set<Listener>>();

function fullKey(key: string) {
  return `${STORAGE_PREFIX}${key}`;
}

export function isStorageAvailable(): boolean {
  try {
    const probe = `${STORAGE_PREFIX}__probe__`;
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(fullKey(key));
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(fullKey(key), JSON.stringify(value));
    listeners.get(key)?.forEach((listener) => listener(value));
    return true;
  } catch {
    // Quota exceeded or storage disabled — the app keeps working in memory.
    listeners.get(key)?.forEach((listener) => listener(value));
    return false;
  }
}

export function removeStorage(key: string) {
  try {
    localStorage.removeItem(fullKey(key));
  } catch {
    /* ignore */
  }
  listeners.get(key)?.forEach((listener) => listener(undefined));
}

export function subscribeStorage(key: string, listener: Listener): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(listener);
  return () => {
    listeners.get(key)?.delete(listener);
  };
}

export interface NovaExport {
  app: 'nova';
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

export function exportAll(): NovaExport {
  const data: Record<string, unknown> = {};
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      const short = key.slice(STORAGE_PREFIX.length);
      data[short] = readStorage(short, null);
    }
  } catch {
    /* ignore */
  }
  return { app: 'nova', version: 1, exportedAt: new Date().toISOString(), data };
}

export type ImportResult = { ok: true; keys: number } | { ok: false; error: 'shape' | 'parse' };

export function importAll(payload: unknown): ImportResult {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    (payload as NovaExport).app !== 'nova' ||
    typeof (payload as NovaExport).data !== 'object' ||
    (payload as NovaExport).data === null
  ) {
    return { ok: false, error: 'shape' };
  }
  const entries = Object.entries((payload as NovaExport).data);
  for (const [key, value] of entries) {
    if (value === null || value === undefined) continue;
    writeStorage(key, value);
  }
  return { ok: true, keys: entries.length };
}

export function clearAll() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
  listeners.forEach((set) => set.forEach((listener) => listener(undefined)));
}

export function estimateUsage(): number {
  let bytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      bytes += key.length + (localStorage.getItem(key)?.length ?? 0);
    }
  } catch {
    return 0;
  }
  return bytes * 2; // UTF-16 code units
}
