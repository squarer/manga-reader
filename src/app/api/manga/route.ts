/**
 * 漫畫列表 API
 *
 * 支援參數：
 * - keyword: 搜尋關鍵字
 * - category: 分類（舊版相容）
 * - region: 地區（japan/korea/hongkong/china/europe/other）
 * - genre: 劇情分類（單一值，網站不支援多類型組合）
 * - year: 年份
 * - letter: 字母索引（a-z）
 * - status: 連載狀態（lianzai/wanjie）
 * - sort: 排序（update/view/rate）
 * - page: 頁碼
 *
 * URL 結構：/list/{region}_{genre}_{status}_{year}_{letter}/{sort}.html
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
import { withCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // 搜尋參數
  const keyword = searchParams.get('keyword');

  // 篩選參數
  const category = searchParams.get('category');
  const region = searchParams.get('region') as RegionType | null;
  // genre 可能是逗號分隔的多值，只取第一個（網站不支援多類型組合）
  const genreParam = searchParams.get('genre');
  const genre = genreParam ? (genreParam.split(',')[0] as GenreType) : null;
  const year = searchParams.get('year');
  const letter = searchParams.get('letter');
  const status = searchParams.get('status') as MangaStatus | null;
  const sort = searchParams.get('sort') as SortType | null;
  const page = parseInt(searchParams.get('page') || '1', 10);

  try {
    const cacheKey = request.url;
    const result = await withCache(cacheKey, async () => {
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

      return parseMangaList(html);
    });

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
