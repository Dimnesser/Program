import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { StorageKeys } from '@/lib/storage';

export interface Preferences {
  /** Turns off interface motion regardless of the OS setting. */
  reduceMotion: boolean;
  /** Denser tool grids: more cards on screen, descriptions hidden. */
  compact: boolean;
}

const DEFAULTS: Preferences = { reduceMotion: false, compact: false };

interface PreferencesValue extends Preferences {
  set: (patch: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useLocalStorage<Preferences>(StorageKeys.settings, DEFAULTS);

  // Expose the choices as data attributes so plain CSS can react to them.
  useEffect(() => {
    document.documentElement.dataset.motion = preferences.reduceMotion ? 'reduced' : 'full';
    document.documentElement.dataset.density = preferences.compact ? 'compact' : 'comfortable';
  }, [preferences.reduceMotion, preferences.compact]);

  const value = useMemo<PreferencesValue>(
    () => ({
      ...DEFAULTS,
      ...preferences,
      set: (patch) => setPreferences((current) => ({ ...DEFAULTS, ...current, ...patch })),
    }),
    [preferences, setPreferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return context;
}
