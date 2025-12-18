/**
 * 最新更新漫畫 API
 * 從 manhuagui 更新頁面獲取最新漫畫列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchUpdateList, parseUpdateList } from '@/lib/scraper';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);

  try {
    const html = await fetchUpdateList(page);
    const result = parseUpdateList(html);

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
