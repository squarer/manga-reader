'use client';

import { useState, useEffect, useCallback } from 'react';

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

/**
 * 從 localStorage 讀取歷史記錄
 */
function getStoredHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 初始化：從 localStorage 載入（這是 hydration 同步，必須在 effect 中執行）
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 初始化 localStorage 的標準模式
    setHistory(getStoredHistory());
    setIsLoaded(true);
  }, []);

  // 同步到 localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history, isLoaded]);

  /**
   * 添加閱讀記錄
   */
  const addHistory = useCallback((item: Omit<HistoryItem, 'timestamp'>) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.mangaId !== item.mangaId);
      return [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, MAX_HISTORY);
    });
  }, []);

  /**
   * 更新閱讀頁碼
   */
  const updateHistoryPage = useCallback((mangaId: number, page: number) => {
    setHistory((prev) =>
      prev.map((h) => (h.mangaId === mangaId ? { ...h, page, timestamp: Date.now() } : h))
    );
  }, []);

  /**
   * 移除單個記錄
   */
  const removeHistory = useCallback((mangaId: number) => {
    setHistory((prev) => prev.filter((h) => h.mangaId !== mangaId));
  }, []);

  /**
   * 清空所有記錄
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    isLoaded,
    addHistory,
    updateHistoryPage,
    removeHistory,
    clearHistory,
  };
}
