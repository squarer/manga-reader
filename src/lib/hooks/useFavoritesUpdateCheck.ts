'use client';

import { useState, useEffect } from 'react';
import type { FavoriteItem } from './useFavorites';
import type { HistoryItem } from './useHistory';

const CONCURRENCY = 3;

async function runWithConcurrency<T>(
  tasks: (() => Promise<T | null>)[],
  limit: number,
  signal: AbortSignal
): Promise<(T | null)[]> {
  const results: (T | null)[] = new Array(tasks.length).fill(null);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      if (signal.aborted) break;
      const i = index++;
      try {
        results[i] = await tasks[i]();
      } catch {
        results[i] = null;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker)
  );
  return results;
}

/**
 * 批次檢查收藏漫畫是否有新章節
 *
 * - concurrency = 3，避免同時打爆 server
 * - 利用 HTTP cache，短期內重複查詢不會打出真實請求
 * - 無閱讀紀錄的漫畫不顯示 NEW（無基準可比較）
 * - 任何 API 失敗靜默跳過
 * - 比對邏輯：latest chapterId 是否曾出現在歷史紀錄中（非最近讀的那筆），
 *   避免倒回重讀舊章節時誤顯示 NEW
 */
export function useFavoritesUpdateCheck(
  favorites: FavoriteItem[],
  history: HistoryItem[],
  enabled: boolean
): { newChapterIds: Set<number> } {
  const [newChapterIds, setNewChapterIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!enabled || favorites.length === 0) return;

    const abortController = new AbortController();
    const { signal } = abortController;

    async function checkUpdates() {
      const tasks = favorites.map((fav) => async () => {
        if (signal.aborted) return null;

        const mangaHistory = history.filter((h) => h.mangaId === fav.mangaId);
        if (mangaHistory.length === 0) return null;

        try {
          const res = await fetch(`/api/manga/${fav.mangaId}`, { signal });
          if (!res.ok) return null;
          const json = await res.json();
          if (!json.success) return null;

          const latestChapterId: number | null =
            json.data?.chapters?.[0]?.chapters?.[0]?.id ?? null;
          if (latestChapterId === null) return null;

          const hasReadLatest = mangaHistory.some((h) => h.chapterId === latestChapterId);
          return hasReadLatest ? null : fav.mangaId;
        } catch {
          return null;
        }
      });

      const results = await runWithConcurrency(tasks, CONCURRENCY, signal);

      if (!signal.aborted) {
        setNewChapterIds(new Set(results.filter((id): id is number => id !== null)));
      }
    }

    checkUpdates();

    return () => {
      abortController.abort();
    };
  }, [enabled, favorites, history]);

  return { newChapterIds };
}
