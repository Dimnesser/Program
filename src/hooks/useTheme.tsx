import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readStorage, StorageKeys, writeStorage } from '@/lib/storage';
import type { ThemeMode } from '@/types';

interface ThemeValue {
  mode: ThemeMode;
  /** The theme actually applied once `system` is resolved. */
  resolved: 'dark' | 'light';
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

const systemPrefersLight = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches;

const resolve = (mode: ThemeMode): 'dark' | 'light' =>
  mode === 'system' ? (systemPrefersLight() ? 'light' : 'dark') : mode;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStorage<ThemeMode>(StorageKeys.theme, 'light'));
  const [resolved, setResolved] = useState<'dark' | 'light'>(() => resolve(mode));

  useEffect(() => {
    const next = resolve(mode);
    setResolved(next);
    document.documentElement.dataset.theme = next;
    document
      .querySelector('meta[name="theme-color"]:not([media])')
      ?.setAttribute('content', next === 'dark' ? '#0d0c0b' : '#fbfaf8');
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      const next = systemPrefersLight() ? 'light' : 'dark';
      setResolved(next);
      document.documentElement.dataset.theme = next;
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    writeStorage(StorageKeys.theme, next);
  }, []);

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      resolved,
      setMode,
      toggle: () => setMode(resolve(mode) === 'dark' ? 'light' : 'dark'),
    }),
    [mode, resolved, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
