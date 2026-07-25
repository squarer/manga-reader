'use client';

import { useCallback } from 'react';
import { toCoverRelativePath } from '@/lib/image-utils';
import { useLocalStorage } from './useLocalStorage';

export interface HistoryItem {
  mangaId: string;
  mangaName: string;
  mangaCover: string;
  chapterId: string;
  chapterName: string;
  /** 閱讀到的頁碼（0-based） */
  page: number;
  timestamp: number;
}

const STORAGE_KEY = 'manga-reader-history';
const MAX_HISTORY = 50;

/**
 * 閱讀歷史管理 hook。
 * 讀取時將舊版 number mangaId / chapterId 正規化為 string，確保新舊 localStorage 資料相容。
 */
export function useHistory() {
  const [history, setHistory, isLoaded] = useLocalStorage<HistoryItem[]>(STORAGE_KEY, [], {
    transform: (items) =>
      items.map((item) => ({
        ...item,
        // 舊資料 mangaId / chapterId 可能為 number，強制轉 string 保持一致
        mangaId: String(item.mangaId),
        chapterId: String(item.chapterId),
        mangaCover: toCoverRelativePath(item.mangaCover),
      })),
  });

  const addHistory = useCallback(
    (item: Omit<HistoryItem, 'timestamp'>) => {
      setHistory((prev) => {
        const filtered = prev.filter(
          (h) => !(h.mangaId === item.mangaId && h.chapterId === item.chapterId)
        );
        return [
          { ...item, mangaCover: toCoverRelativePath(item.mangaCover), timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_HISTORY);
      });
    },
    [setHistory]
  );

  const updateHistoryPage = useCallback(
    (mangaId: string, chapterId: string, page: number) => {
      setHistory((prev) =>
        prev.map((h) =>
          h.mangaId === mangaId && h.chapterId === chapterId
            ? { ...h, page, timestamp: Date.now() }
            : h
        )
      );
    },
    [setHistory]
  );

  const removeHistory = useCallback(
    (mangaId: string) => {
      setHistory((prev) => prev.filter((h) => h.mangaId !== mangaId));
    },
    [setHistory]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  return {
    history,
    isLoaded,
    addHistory,
    updateHistoryPage,
    removeHistory,
    clearHistory,
  };
}
