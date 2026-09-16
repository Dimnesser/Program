import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { StorageKeys } from '@/lib/storage';

const EMPTY: string[] = [];

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<string[]>(StorageKeys.favorites, EMPTY);

  const isFavorite = useCallback((toolId: string) => favorites.includes(toolId), [favorites]);

  const toggleFavorite = useCallback(
    (toolId: string) => {
      let added = false;
      setFavorites((current) => {
        added = !current.includes(toolId);
        return added ? [...current, toolId] : current.filter((id) => id !== toolId);
      });
      return added;
    },
    [setFavorites],
  );

  return { favorites, isFavorite, toggleFavorite, setFavorites };
}
