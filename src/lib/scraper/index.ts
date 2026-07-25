/**
 * Scraper 模組入口
 * 匯出共用 domain types、providers registry 及 manhuagui 底層函數（供 API routes 直接使用）
 */

// 共用 domain types
export * from './types';

// Provider registry（含 MangaProvider 介面、ChapterImages、getProvider 等）
export * from './providers';

// manhuagui 底層函數（保留供現有 API routes 直接呼叫，後續可逐步收入 provider）
export {
  fetchMangaList,
  fetchMangaListWithFilters,
  fetchMangaDetail,
  fetchChapterPage,
  fetchRankList,
  fetchUpdateList,
  fetchImage,
  searchManga,
  delay,
} from './providers/manhuagui/fetcher';

export {
  parseMangaList,
  parseMangaDetail,
  parseRankList,
  parseUpdateList,
  buildUrl,
  buildCoverUrl,
} from './providers/manhuagui/parser';

export {
  decryptChapterPage,
  buildImageUrl,
  extractPackedScript,
  parseImageData,
} from './providers/manhuagui/decrypt';

export { unpack } from './unpack';
