'use client';

import { useState, useEffect, useCallback } from 'react';

export interface FavoriteItem {
  mangaId: number;
  mangaName: string;
  mangaCover: string;
  addedAt: number;
}

const STORAGE_KEY = 'manga-reader-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 從 localStorage 載入收藏
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // 儲存到 localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  // 檢查是否已收藏
  const isFavorite = useCallback(
    (mangaId: number) => {
      return favorites.some((f) => f.mangaId === mangaId);
    },
    [favorites]
  );

  // 添加收藏
  const addFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.mangaId === item.mangaId)) {
        return prev;
      }
      return [{ ...item, addedAt: Date.now() }, ...prev];
    });
  }, []);

  // 移除收藏
  const removeFavorite = useCallback((mangaId: number) => {
    setFavorites((prev) => prev.filter((f) => f.mangaId !== mangaId));
  }, []);

  // 切換收藏狀態
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
