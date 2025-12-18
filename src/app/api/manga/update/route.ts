/**
 * 最新更新漫畫 API
 * 從 manhuagui 更新頁面獲取最新漫畫列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchUpdateList, parseUpdateList } from '@/lib/scraper';
import { withCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get('page');
  const page = pageParam ? parseInt(pageParam, 10) : 1;

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
    const cacheKey = request.url;
    const result = await withCache(cacheKey, async () => {
      const html = await fetchUpdateList(page);
      return parseUpdateList(html);
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
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
