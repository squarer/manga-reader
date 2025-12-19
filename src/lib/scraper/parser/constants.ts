/**
 * Parser 常數
 */

export const BASE_URL = 'https://www.manhuagui.com';
export const CDN_URL = 'https://cf.mhgui.com';

/**
 * 構建完整 URL
 */
export function buildUrl(path: string): string {
  if (path.startsWith('http')) return path;
  if (path.startsWith('//')) return 'https:' + path;
  return BASE_URL + path;
}

/**
 * 構建封面 URL
 */
export function buildCoverUrl(mangaId: number): string {
  return `${CDN_URL}/cpic/h/${mangaId}.jpg`;
}
