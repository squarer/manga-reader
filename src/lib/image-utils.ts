/**
 * 圖片工具函數
 */

const PRIMARY_CDN = 'https://cf.mhgui.com';
const CDN_ORIGINS = [PRIMARY_CDN, 'https://cf2.mhgui.com'];

/**
 * 將相對路徑補全為完整 CDN URL（向後相容舊格式的完整 URL）
 */
function normalizeCoverUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  return PRIMARY_CDN + url;
}

/**
 * 將完整 CDN URL 轉換為相對路徑（用於存入 localStorage）
 * 互為 normalizeCoverUrl 的反操作
 */
export function toCoverRelativePath(url: string): string {
  if (!url) return url;
  // 先補全 protocol-relative URL 再 strip origin
  const normalized = url.startsWith('//') ? 'https:' + url : url;
  for (const origin of CDN_ORIGINS) {
    if (normalized.startsWith(origin)) return normalized.slice(origin.length);
  }
  return url;
}

/**
 * 取得代理圖片 URL
 * 用於繞過防盜鏈限制，接受相對路徑或完整 URL
 */
export function getProxiedImageUrl(originalUrl: string): string {
  if (!originalUrl) {
    return '/placeholder.svg';
  }
  return `/api/image?url=${encodeURIComponent(normalizeCoverUrl(originalUrl))}`;
}
