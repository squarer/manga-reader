'use client';

import { useCallback } from 'react';
import { toCoverRelativePath } from '@/lib/image-utils';
import type { SourceId } from '@/lib/scraper/types';
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
  /** 資料來源；舊資料經 migration 補 'manhuagui' */
  source: SourceId;
}

const STORAGE_KEY = 'manga-reader-history';
const MAX_HISTORY = 50;

/**
 * 讀取時的歷史資料 migration（純函式，供測試）：
 * - 舊版 number mangaId / chapterId 正規化為 string
 * - 無 source 欄位 → 補 'manhuagui'
 * - 非 manhuagui 項目卻存了 manhuagui 專屬封面路徑（/cpic/…）→ 清空走 placeholder
 *   （舊 bug 產物；該路徑會被 normalizeCoverUrl 接上 cf.mhgui.com → 破圖）
 */
export function migrateHistoryItems(items: HistoryItem[]): HistoryItem[] {
  return items.map((item) => {
    // source 須先解析，供下方封面判斷
    const source = (item.source ?? 'manhuagui') as SourceId;
    let mangaCover = toCoverRelativePath(item.mangaCover);
    if (source !== 'manhuagui' && mangaCover.startsWith('/cpic/')) {
      mangaCover = '';
    }
    return {
      ...item,
      mangaId: String(item.mangaId),
      chapterId: String(item.chapterId),
      mangaCover,
      source,
    };
  });
}

/**
 * 閱讀歷史管理 hook。
 * 讀取時將舊版 number mangaId / chapterId 正規化為 string，並 migration 補 source 欄位。
 */
export function useHistory() {
  const [history, setHistory, isLoaded] = useLocalStorage<HistoryItem[]>(STORAGE_KEY, [], {
    transform: migrateHistoryItems,
  });

  const addHistory = useCallback(
    (item: Omit<HistoryItem, 'timestamp'>) => {
      setHistory((prev) => {
        // source + mangaId + chapterId 三者複合 dedup
        const filtered = prev.filter(
          (h) => !(h.source === item.source && h.mangaId === item.mangaId && h.chapterId === item.chapterId)
        );
        return [
          { ...item, mangaCover: toCoverRelativePath(item.mangaCover), timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_HISTORY);
      });
    },
    [setHistory]
  );

  /** source + mangaId + chapterId 三鍵定位更新頁碼 */
  const updateHistoryPage = useCallback(
    (source: SourceId, mangaId: string, chapterId: string, page: number) => {
      setHistory((prev) =>
        prev.map((h) =>
          h.source === source && h.mangaId === mangaId && h.chapterId === chapterId
            ? { ...h, page, timestamp: Date.now() }
            : h
        )
      );
    },
    [setHistory]
  );

  /** 移除特定來源的特定漫畫全部章節記錄 */
  const removeHistory = useCallback(
    (source: SourceId, mangaId: string) => {
      setHistory((prev) => prev.filter((h) => !(h.source === source && h.mangaId === mangaId)));
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
