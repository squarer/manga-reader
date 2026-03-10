'use client';

import { useState, useEffect, useCallback } from 'react';
import { toCoverRelativePath } from '@/lib/image-utils';

export interface FavoriteItem {
  mangaId: number;
  mangaName: string;
  mangaCover: string;
  addedAt: number;
}

const STORAGE_KEY = 'manga-reader-favorites';

/**
 * 從 localStorage 讀取收藏
 */
function getStoredFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const items: FavoriteItem[] = JSON.parse(stored);
    return items.map((item) => ({ ...item, mangaCover: toCoverRelativePath(item.mangaCover) }));
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 初始化：從 localStorage 載入（這是 hydration 同步，必須在 effect 中執行）
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 初始化 localStorage 的標準模式
    setFavorites(getStoredFavorites());
    setIsLoaded(true);
  }, []);

  // 同步到 localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  /**
   * 檢查是否已收藏
   */
  const isFavorite = useCallback(
    (mangaId: number) => favorites.some((f) => f.mangaId === mangaId),
    [favorites]
  );

  /**
   * 添加收藏
   */
  const addFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.mangaId === item.mangaId)) return prev;
      return [{ ...item, mangaCover: toCoverRelativePath(item.mangaCover), addedAt: Date.now() }, ...prev];
    });
  }, []);

  /**
   * 移除收藏
   */
  const removeFavorite = useCallback((mangaId: number) => {
    setFavorites((prev) => prev.filter((f) => f.mangaId !== mangaId));
  }, []);

  /**
   * 切換收藏狀態
   */
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
