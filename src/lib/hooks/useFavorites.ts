'use client';

import { useCallback } from 'react';
import { toCoverRelativePath } from '@/lib/image-utils';
import { useLocalStorage } from './useLocalStorage';

export interface FavoriteItem {
  mangaId: string;
  mangaName: string;
  mangaCover: string;
  addedAt: number;
}

const STORAGE_KEY = 'manga-reader-favorites';

/**
 * 收藏管理 hook。
 * 讀取時將舊版 number mangaId 正規化為 string，確保新舊 localStorage 資料相容。
 */
export function useFavorites() {
  const [favorites, setFavorites, isLoaded] = useLocalStorage<FavoriteItem[]>(STORAGE_KEY, [], {
    transform: (items) =>
      items.map((item) => ({
        ...item,
        // 舊資料 mangaId 可能為 number，強制轉 string 保持一致
        mangaId: String(item.mangaId),
        mangaCover: toCoverRelativePath(item.mangaCover),
      })),
  });

  const isFavorite = useCallback(
    (mangaId: string) => favorites.some((f) => f.mangaId === mangaId),
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
    (mangaId: string) => {
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
