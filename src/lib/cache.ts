/**
 * 記憶體快取工具
 *
 * 提供簡單的記憶體快取機制，使用 pathname + searchParams 作為 cache key
 */

/** 快取過期時間：24 小時 */
const CACHE_TTL_MS = 86400000;

/** 快取最大數量限制 */
const MAX_CACHE_SIZE = 1000;

/** 快取項目 */
interface CacheEntry<T> {
  data: T;
  expiredAt: number;
}

/** 快取儲存 */
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * 將 URL 正規化為 cache key，移除 host/protocol
 * 確保不同環境（localhost/production）同參數命中同一快取
 *
 * @param url - 完整 URL 字串
 * @returns pathname + search，例如 "/api/rank?type=day"
 */
export function normalizeUrlCacheKey(url: string): string {
  const { pathname, search } = new URL(url);
  return pathname + search;
}

/**
 * 取得快取資料
 *
 * @param key - 快取 key（pathname + searchParams）
 * @returns 快取資料，若不存在或已過期則回傳 null
 */
export function getCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) {
    return null;
  }

  // 檢查是否過期
  if (Date.now() > entry.expiredAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * 設定快取資料
 *
 * 當快取數量超過限制時，刪除最舊的項目（FIFO）
 *
 * @param key - 快取 key（pathname + searchParams）
 * @param data - 要快取的資料
 */
export function setCache<T>(key: string, data: T): void {
  // 超過限制時刪除最舊的項目
  if (cache.size >= MAX_CACHE_SIZE && !cache.has(key)) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, {
    data,
    expiredAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * HTTP Cache-Control 回應標頭策略
 */
export const CacheHeaders = {
  /** 排行榜、最新更新、漫畫列表：5 分鐘 CDN 快取 */
  SHORT: 'public, s-maxage=300, stale-while-revalidate=3600',
  /** 搜尋結果：1 分鐘 CDN 快取 */
  SEARCH: 'public, s-maxage=60, stale-while-revalidate=300',
  /** 漫畫詳情：1 小時 CDN 快取 */
  DETAIL: 'public, s-maxage=3600, stale-while-revalidate=86400',
  /** 章節 API：1 小時 CDN 快取（圖片 URL 含 sl.e expiry token，不加 stale-while-revalidate） */
  CHAPTER: 'public, s-maxage=3600',
} as const;

/**
 * 帶快取的資料取得函數
 *
 * @param key - 快取 key（pathname + searchParams）
 * @param fetcher - 取得資料的函數
 * @returns 快取或新取得的資料
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  setCache(key, data);
  return data;
}
