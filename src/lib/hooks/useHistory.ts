'use client';

import { useState, useEffect, useCallback } from 'react';

export interface HistoryItem {
  mangaId: number;
  mangaName: string;
  mangaCover: string;
  chapterId: number;
  chapterName: string;
  timestamp: number;
}

const STORAGE_KEY = 'manga-reader-history';
const MAX_HISTORY = 50;

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 從 localStorage 載入歷史記錄
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // 儲存到 localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history, isLoaded]);

  // 添加閱讀記錄
  const addHistory = useCallback((item: Omit<HistoryItem, 'timestamp'>) => {
    setHistory((prev) => {
      // 移除同一漫畫的舊記錄
      const filtered = prev.filter((h) => h.mangaId !== item.mangaId);
      // 添加新記錄到最前面
      const newHistory = [
        { ...item, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_HISTORY);
      return newHistory;
    });
  }, []);

  // 移除單個記錄
  const removeHistory = useCallback((mangaId: number) => {
    setHistory((prev) => prev.filter((h) => h.mangaId !== mangaId));
  }, []);

  // 清空所有記錄
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    isLoaded,
    addHistory,
    removeHistory,
    clearHistory,
  };
}
