/**
 * 記憶體快取工具
 *
 * 提供簡單的記憶體快取機制，使用完整 URL 作為 cache key
 */

/** 快取過期時間：24 小時 */
const CACHE_TTL_MS = 86400000;

/** 快取項目 */
interface CacheEntry<T> {
  data: T;
  expiredAt: number;
}

/** 快取儲存 */
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * 取得快取資料
 *
 * @param key - 快取 key（通常是完整 URL）
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
 * @param key - 快取 key（通常是完整 URL）
 * @param data - 要快取的資料
 */
export function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    expiredAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * 帶快取的資料取得函數
 *
 * @param key - 快取 key（通常是完整 URL）
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
