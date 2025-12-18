/**
 * 漫畫列表 API
 *
 * 支援參數：
 * - keyword: 搜尋關鍵字
 * - category: 分類（舊版相容）
 * - region: 地區（japan/korea/hongkong/other）
 * - genre: 劇情分類
 * - year: 年份
 * - letter: 字母索引（a-z）
 * - status: 連載狀態（lianzai/wanjie）
 * - sort: 排序（update/view/rate）
 * - page: 頁碼
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchMangaList,
  fetchMangaListWithFilters,
  parseMangaList,
  searchManga,
  RegionType,
  GenreType,
  SortType,
  MangaStatus,
} from '@/lib/scraper';
import type { FilterOptions } from '@/lib/scraper';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // 搜尋參數
  const keyword = searchParams.get('keyword');

  // 篩選參數
  const category = searchParams.get('category');
  const region = searchParams.get('region') as RegionType | null;
  const genre = searchParams.get('genre') as GenreType | null;
  const year = searchParams.get('year');
  const letter = searchParams.get('letter');
  const status = searchParams.get('status') as MangaStatus | null;
  const sort = searchParams.get('sort') as SortType | null;
  const page = parseInt(searchParams.get('page') || '1', 10);

  try {
    let html: string;

    if (keyword) {
      // 搜尋模式
      html = await searchManga(keyword, page);
    } else if (region || genre || year || letter || status || sort) {
      // 進階篩選模式
      const options: FilterOptions = {
        region: region || undefined,
        genre: genre || undefined,
        year: year || undefined,
        letter: letter?.toLowerCase() || undefined,
        status: status || undefined,
        sort: sort || undefined,
        page,
      };
      html = await fetchMangaListWithFilters(options);
    } else {
      // 舊版分類列表模式（向後相容）
      html = await fetchMangaList(category || 'japan', page);
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
