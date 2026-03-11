'use client';

import { useCallback } from 'react';
import { toCoverRelativePath } from '@/lib/image-utils';
import { useLocalStorage } from './useLocalStorage';

export interface FavoriteItem {
  mangaId: number;
  mangaName: string;
  mangaCover: string;
  addedAt: number;
}

const STORAGE_KEY = 'manga-reader-favorites';

export function useFavorites() {
  const [favorites, setFavorites, isLoaded] = useLocalStorage<FavoriteItem[]>(STORAGE_KEY, [], {
    transform: (items) =>
      items.map((item) => ({ ...item, mangaCover: toCoverRelativePath(item.mangaCover) })),
  });

  const isFavorite = useCallback(
    (mangaId: number) => favorites.some((f) => f.mangaId === mangaId),
    [favorites]
  );

  const addFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.mangaId === item.mangaId)) return prev;
      return [
        { ...item, mangaCover: toCoverRelativePath(item.mangaCover), addedAt: Date.now() },
        ...prev,
      ];
    });
  }, [setFavorites]);

  const removeFavorite = useCallback(
    (mangaId: number) => {
      setFavorites((prev) => prev.filter((f) => f.mangaId !== mangaId));
    },
    [setFavorites]
  );

  const toggleFavorite = useCallback(
    (item: Omit<FavoriteItem, 'addedAt'>) => {
      if (isFavorite(item.mangaId)) {
        removeFavorite(item.mangaId);
      } else {
        addFavorite(item);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  return {
    favorites,
    isLoaded,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };
}
