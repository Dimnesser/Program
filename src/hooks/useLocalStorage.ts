import { useCallback, useEffect, useRef, useState } from 'react';
import { readStorage, subscribeStorage, writeStorage } from '@/lib/storage';

/**
 * State backed by localStorage that stays in sync with every other hook bound
 * to the same key, in this tab and across tabs.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const initialRef = useRef(initial);
  const [value, setValue] = useState<T>(() => readStorage(key, initialRef.current));

  useEffect(() => {
    const unsubscribe = subscribeStorage(key, (next) => {
      setValue((next === undefined ? initialRef.current : next) as T);
    });

    const onStorage = (event: StorageEvent) => {
      if (event.key === `nova:${key}`) setValue(readStorage(key, initialRef.current));
    };
    window.addEventListener('storage', onStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, [key]);

  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved = typeof next === 'function' ? (next as (c: T) => T)(current) : next;
        writeStorage(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, update] as const;
}
