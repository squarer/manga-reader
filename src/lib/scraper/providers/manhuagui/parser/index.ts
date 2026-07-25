/**
 * HTML 解析模組
 * 解析 manhuagui.com 的漫畫列表、詳情頁等
 */

export { buildUrl, buildCoverUrl } from './constants';
export { parseMangaList } from './list-parser';
export { parseMangaDetail } from './detail-parser';
export { parseRankList } from './rank-parser';
export { parseUpdateList } from './update-parser';
