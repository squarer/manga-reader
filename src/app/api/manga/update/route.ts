/**
 * 最新更新漫畫 API
 * 從 manhuagui 更新頁面獲取最新漫畫列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/scraper/providers';
import { withCache, CacheHeaders, normalizeUrlCacheKey } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get('page');
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const source = searchParams.get('source');

  // 驗證 page 參數必須是正整數
  if (isNaN(page) || page < 1 || !Number.isInteger(page)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid page parameter. Must be a positive integer.',
      },
      { status: 400 }
    );
  }

  try {
    const cacheKey = normalizeUrlCacheKey(request.url);
    const result = await withCache(cacheKey, async () => {
      return getProvider(source).getUpdateList(page);
    });

    return NextResponse.json(
      { success: true, data: result },
      { headers: { 'Cache-Control': CacheHeaders.SHORT } }
    );
  } catch (error) {
    console.error('Update list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch update list',
      },
      { status: 500 }
    );
  }
}
