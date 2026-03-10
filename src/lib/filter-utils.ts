/**
 * 篩選器工具函數
 */

import {
  type FilterState,
  type GenreKey,
  type RegionKey,
  type StatusKey,
  type SortKey,
  type YearOption,
  GENRE_OPTIONS,
  YEAR_OPTIONS,
} from '@/lib/filter-types';

/**
 * 進度映射：UI 值 -> API 值
 */
export const STATUS_MAP: Record<string, string> = {
  ongoing: 'lianzai',
  completed: 'wanjie',
};

/**
 * 排序映射：UI 值 -> API 值
 */
export const SORT_MAP: Record<string, string> = {
  latest: 'update',
  update: 'update',
  popular: 'view',
  rating: 'rate',
};

/**
 * 從 URL 參數解析 FilterState
 */
export function parseFiltersFromParams(searchParams: URLSearchParams): FilterState {
  const region = searchParams.get('region') as RegionKey | null;
  const genreParam = searchParams.get('genre');
  const firstGenre = genreParam?.split(',')[0];
  const genre = firstGenre && firstGenre in GENRE_OPTIONS ? (firstGenre as GenreKey) : null;
  const yearParam = searchParams.get('year');
  const year =
    yearParam && YEAR_OPTIONS.includes(yearParam as YearOption)
      ? (yearParam as YearOption)
      : null;
  const status = (searchParams.get('status') as StatusKey) || 'all';
  const sort = (searchParams.get('sort') as SortKey) || 'update';

  return { region, genre, year, status, sort };
}

/**
 * 將 FilterState 轉換為 URL 參數
 */
export function filtersToParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.region) {
    params.set('region', filters.region);
  }
  if (filters.genre) {
    params.set('genre', filters.genre);
  }
  if (filters.year) {
    params.set('year', filters.year);
  }
  if (filters.status !== 'all') {
    params.set('status', filters.status);
  }
  if (filters.sort !== 'update') {
    params.set('sort', filters.sort);
  }

  return params;
}
