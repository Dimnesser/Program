import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { readStorage, StorageKeys, writeStorage } from '@/lib/storage';
import { isoWeekKey } from '@/lib/utils';
import type { RecentEntry, UsageStats } from '@/types';

const MAX_RECENT = 40;
const EMPTY: RecentEntry[] = [];
const EMPTY_USAGE: UsageStats = { weekly: {}, total: 0 };

/**
 * History intentionally stores only the tool identifier and a timestamp —
 * never anything the user typed into a tool.
 */
export function useRecent() {
  const [recent, setRecent] = useLocalStorage<RecentEntry[]>(StorageKeys.recent, EMPTY);
  const [usage, setUsage] = useLocalStorage<UsageStats>(StorageKeys.usage, EMPTY_USAGE);

  const record = useCallback(
    (toolId: string) => {
      setRecent((current) => {
        const existing = current.find((entry) => entry.toolId === toolId);
        const next: RecentEntry = {
          toolId,
          at: Date.now(),
          count: (existing?.count ?? 0) + 1,
        };
        return [next, ...current.filter((entry) => entry.toolId !== toolId)].slice(0, MAX_RECENT);
      });

      setUsage((current) => {
        const week = isoWeekKey();
        return {
          total: current.total + 1,
          weekly: { ...current.weekly, [week]: (current.weekly[week] ?? 0) + 1 },
        };
      });
    },
    [setRecent, setUsage],
  );

  const clear = useCallback(() => setRecent([]), [setRecent]);

  return { recent, usage, record, clear };
}

/** Imperative recorder for places without a React context (route effects). */
export function recordToolUse(toolId: string) {
  const recent = readStorage<RecentEntry[]>(StorageKeys.recent, []);
  const existing = recent.find((entry) => entry.toolId === toolId);
  const next = [
    { toolId, at: Date.now(), count: (existing?.count ?? 0) + 1 },
    ...recent.filter((entry) => entry.toolId !== toolId),
  ].slice(0, MAX_RECENT);
  writeStorage(StorageKeys.recent, next);

  const usage = readStorage<UsageStats>(StorageKeys.usage, { weekly: {}, total: 0 });
  const week = isoWeekKey();
  writeStorage(StorageKeys.usage, {
    total: usage.total + 1,
    weekly: { ...usage.weekly, [week]: (usage.weekly[week] ?? 0) + 1 },
  });
}
