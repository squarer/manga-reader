'use client';

/**
 * 全站來源狀態 Context
 * 持有 source: SourceId + setSource，持久化到 localStorage
 * 單一來源確保首頁/排行/更新一起 re-render
 */

import { createContext, useContext } from 'react';
import type { SourceId } from '@/lib/scraper/types';
import { DEFAULT_SOURCE } from '@/lib/scraper/providers';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';

const STORAGE_KEY = 'manga-reader-source';

interface SourceContextValue {
  source: SourceId;
  setSource: (source: SourceId) => void;
  isLoaded: boolean;
}

const SourceContext = createContext<SourceContextValue>({
  source: DEFAULT_SOURCE,
  setSource: () => {},
  isLoaded: false,
});

/** 驗證存取的 source 是合法 SourceId，否則回退預設值 */
function validateSource(parsed: SourceId): SourceId {
  if (parsed === 'manhuagui' || parsed === 'dm5') return parsed;
  return DEFAULT_SOURCE;
}

export function SourceProvider({ children }: { children: React.ReactNode }) {
  const [source, setSourceRaw, isLoaded] = useLocalStorage<SourceId>(
    STORAGE_KEY,
    DEFAULT_SOURCE,
    { transform: validateSource }
  );

  const setSource = (next: SourceId) => {
    setSourceRaw(next);
  };

  return (
    <SourceContext.Provider value={{ source, setSource, isLoaded }}>
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
