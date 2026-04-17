/**
 * 最新更新漫畫 API
 * 從 manhuagui 更新頁面獲取最新漫畫列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchUpdateList, parseUpdateList } from '@/lib/scraper';
import { withCache, CacheHeaders, normalizeUrlCacheKey } from '@/lib/cache';
import { parsePage } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parsePage(searchParams.get('page'));

  try {
    const cacheKey = normalizeUrlCacheKey(request.url);
    const result = await withCache(cacheKey, async () => {
      const html = await fetchUpdateList(page);
      return parseUpdateList(html);
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
