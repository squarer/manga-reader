'use client';

/**
 * 搜尋紀錄 hook（Google 風格）
 * - 持久化到 localStorage（單一 instance：於 Navbar 呼叫、往下傳，避免多 instance 狀態不同步）
 * - 去重置頂、上限 SEARCH_HISTORY_MAX 筆
 */

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'manga-reader-search-history';
export const SEARCH_HISTORY_MAX = 10;

/**
 * 純函式：把新關鍵字併入歷史清單。
 * - trim 後為空 → 原樣返回（不記錄空白搜尋）
 * - 已存在的詞移到最前（不重複），達成 MRU 排序
 * - 上限 SEARCH_HISTORY_MAX 筆，超出截斷最舊
 */
export function addSearchEntry(history: string[], keyword: string): string[] {
  const term = keyword.trim();
  if (!term) return history;
  return [term, ...history.filter((k) => k !== term)].slice(0, SEARCH_HISTORY_MAX);
}

export function useSearchHistory() {
  const [history, setHistory] = useLocalStorage<string[]>(STORAGE_KEY, []);

  const addSearch = useCallback(
    (keyword: string) => setHistory((prev) => addSearchEntry(prev, keyword)),
    [setHistory]
  );

  const removeSearch = useCallback(
    (keyword: string) => setHistory((prev) => prev.filter((k) => k !== keyword)),
    [setHistory]
  );

  const clearSearch = useCallback(() => setHistory([]), [setHistory]);

  return { history, addSearch, removeSearch, clearSearch };
}
