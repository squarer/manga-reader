/**
 * Provider Registry
 * 管理所有漫畫來源 provider，提供統一的取得與列舉介面。
 */

import type { MangaProvider, SourceId } from './types';
import { manhuaguiProvider } from './manhuagui';

/** 預設來源（未指定時使用） */
export const DEFAULT_SOURCE: SourceId = 'manhuagui';

const PROVIDERS: Record<SourceId, MangaProvider> = {
  manhuagui: manhuaguiProvider,
};

/**
 * 依 source 取得對應的 MangaProvider。
 * source 無效或未傳入時回傳預設 provider（manhuagui）。
 */
export function getProvider(source?: string | null): MangaProvider {
  if (source && source in PROVIDERS) return PROVIDERS[source as SourceId];
  return PROVIDERS[DEFAULT_SOURCE];
}

/**
 * 回傳所有已註冊的 MangaProvider 列表。
 * 主要用於 image proxy 驗證允許網域。
 */
export function allProviders(): MangaProvider[] {
  return Object.values(PROVIDERS);
}

export * from './types';
