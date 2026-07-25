'use client';

import { useCallback } from 'react';
import { toCoverRelativePath } from '@/lib/image-utils';
import type { SourceId } from '@/lib/scraper/types';
import { useLocalStorage } from './useLocalStorage';

export interface FavoriteItem {
  mangaId: string;
  mangaName: string;
  mangaCover: string;
  addedAt: number;
  /** 資料來源；舊資料經 migration 補 'manhuagui' */
  source: SourceId;
}

const STORAGE_KEY = 'manga-reader-favorites';

/**
 * 收藏管理 hook。
 * 讀取時將舊版 number mangaId 正規化為 string，並 migration 補 source 欄位。
 */
export function useFavorites() {
  const [favorites, setFavorites, isLoaded] = useLocalStorage<FavoriteItem[]>(STORAGE_KEY, [], {
    transform: (items) =>
      items.map((item) => ({
        ...item,
        // 舊資料 mangaId 可能為 number，強制轉 string 保持一致
        mangaId: String(item.mangaId),
        mangaCover: toCoverRelativePath(item.mangaCover),
        // migration：舊資料無 source → 視為 manhuagui
        source: (item.source ?? 'manhuagui') as SourceId,
      })),
  });

  /** source + mangaId 雙鍵比對，跨來源不衝突 */
  const isFavorite = useCallback(
    (source: SourceId, mangaId: string) =>
      favorites.some((f) => f.source === source && f.mangaId === mangaId),
    [favorites]
  );

  const addFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.source === item.source && f.mangaId === item.mangaId)) return prev;
      return [
        { ...item, mangaCover: toCoverRelativePath(item.mangaCover), addedAt: Date.now() },
        ...prev,
      ];
    });
  }, [setFavorites]);

  const removeFavorite = useCallback(
    (source: SourceId, mangaId: string) => {
      setFavorites((prev) => prev.filter((f) => !(f.source === source && f.mangaId === mangaId)));
    },
    [setFavorites]
  );

  const toggleFavorite = useCallback(
    (item: Omit<FavoriteItem, 'addedAt'>) => {
      if (isFavorite(item.source, item.mangaId)) {
        removeFavorite(item.source, item.mangaId);
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
