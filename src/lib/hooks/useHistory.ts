'use client';

import { useCallback } from 'react';
import { toCoverRelativePath } from '@/lib/image-utils';
import { useLocalStorage } from './useLocalStorage';

export interface HistoryItem {
  mangaId: number;
  mangaName: string;
  mangaCover: string;
  chapterId: number;
  chapterName: string;
  /** 閱讀到的頁碼（0-based） */
  page: number;
  timestamp: number;
}

const STORAGE_KEY = 'manga-reader-history';
const MAX_HISTORY = 50;

export function useHistory() {
  const [history, setHistory, isLoaded] = useLocalStorage<HistoryItem[]>(STORAGE_KEY, [], {
    transform: (items) =>
      items.map((item) => ({ ...item, mangaCover: toCoverRelativePath(item.mangaCover) })),
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
    (mangaId: number, chapterId: number, page: number) => {
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
    (mangaId: number) => {
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
