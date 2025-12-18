/**
 * 漫畫列表 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchMangaList, parseMangaList, searchManga } from '@/lib/scraper';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'japan';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const keyword = searchParams.get('keyword');

  try {
    let html: string;

    if (keyword) {
      // 搜尋模式
      html = await searchManga(keyword, page);
    } else {
      // 分類列表模式
      html = await fetchMangaList(category, page);
    }

    const result = parseMangaList(html);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Manga list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch manga list',
      },
      { status: 500 }
    );
  }
}
