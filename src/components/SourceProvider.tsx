'use client';

/**
 * 全站來源狀態 Context
 * 持有 sources: SourceId[]（恆非空、去重、manhuagui-first）+ toggleSource，持久化到 localStorage
 * 單一來源確保首頁/排行/更新一起 re-render
 */

import { createContext, useContext, useCallback } from 'react';
import type { SourceId } from '@/lib/scraper/types';
import { DEFAULT_SOURCE } from '@/lib/scraper/providers';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';

const STORAGE_KEY = 'manga-reader-source';

/** 顯示與排序用的來源固定順序（manhuagui-first） */
export const SOURCE_IDS: SourceId[] = ['manhuagui', 'dm5'];

interface SourceContextValue {
  /** 選定來源集合，恆非空、去重、順序固定 manhuagui-first */
  sources: SourceId[];
  /** 切換單一來源；已選則移除（唯一一個時 no-op），未選則加入 */
  toggleSource: (id: SourceId) => void;
  isLoaded: boolean;
}

const SourceContext = createContext<SourceContextValue>({
  sources: [DEFAULT_SOURCE],
  toggleSource: () => {},
  isLoaded: false,
});

/**
 * 正規化持久化來源集合，並相容舊格式：
 * - 舊值為單一字串（如 "manhuagui"）→ 包成單元素陣列
 * - 已是陣列 → 過濾出合法 SourceId
 * - 結果為空/非法 → 回退 [DEFAULT_SOURCE]
 * 依 SOURCE_IDS 過濾同時完成去重與 manhuagui-first 排序。
 */
function normalizeSources(parsed: SourceId[]): SourceId[] {
  const raw: unknown = parsed;
  const arr: unknown[] = typeof raw === 'string' ? [raw] : Array.isArray(raw) ? raw : [];
  const valid = SOURCE_IDS.filter((id) => arr.includes(id));
  return valid.length > 0 ? valid : [DEFAULT_SOURCE];
}

export function SourceProvider({ children }: { children: React.ReactNode }) {
  const [sources, setSources, isLoaded] = useLocalStorage<SourceId[]>(
    STORAGE_KEY,
    [DEFAULT_SOURCE],
    { transform: normalizeSources }
  );

  const toggleSource = useCallback(
    (id: SourceId) => {
      setSources((prev) => {
        if (prev.includes(id)) {
          // 不能取消最後一個
          if (prev.length === 1) return prev;
          return prev.filter((s) => s !== id);
        }
        // 加入並維持 manhuagui-first 排序
        return SOURCE_IDS.filter((s) => s === id || prev.includes(s));
      });
    },
    [setSources]
  );

  return (
    <SourceContext.Provider value={{ sources, toggleSource, isLoaded }}>
      {children}
    </SourceContext.Provider>
  );
}

/** 取得全站來源狀態 */
export function useSource(): SourceContextValue {
  return useContext(SourceContext);
}

/** 人話來源標籤 */
export const SOURCE_LABELS: Record<SourceId, string> = {
  manhuagui: '漫画柜',
  dm5: '动漫屋',
};

/**
 * 來源品牌色（取各站 logo 主色）：manhuagui logo 藍、dm5 logo 紅。
 * outline 樣式：柔和色用於 ring（畫在盒子外緣）與文字（低對比），背景由各消費端自帶。
 * 用 ring 而非 border，框線落在最外圈、不內推。
 * 供漫畫卡片來源徽章與功能列來源按鈕選中態共用（SSOT）。
 * 需為完整 Tailwind class 字串（不可動態拼接，否則被 purge）。
 */
export const SOURCE_COLORS: Record<SourceId, string> = {
  manhuagui: 'ring-blue-400 text-blue-600',
  dm5: 'ring-red-400 text-red-600',
};
