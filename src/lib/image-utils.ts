/**
 * 圖片工具函數
 */

/**
 * 取得代理圖片 URL
 * 用於繞過防盜鏈限制
 */
export function getProxiedImageUrl(originalUrl: string): string {
  if (!originalUrl) {
    return '/placeholder.jpg';
  }
  return `/api/image?url=${encodeURIComponent(originalUrl)}`;
}
