import { GenreType, GENRE_LABELS } from '@/lib/scraper/types';

/** 地區選項 */
export const REGION_OPTIONS = {
  japan: '日本漫畫',
  hongkong: '港台漫畫',
  korea: '韓國漫畫',
  other: '歐美漫畫',
} as const;

/** 劇情分類選項 */
export const GENRE_OPTIONS: Record<GenreType, string> = GENRE_LABELS;

/** 年份選項 */
export const YEAR_OPTIONS = ['2025', '2024', '2023', '2022', '2021', '2020', '更早'] as const;

/** 進度選項 */
export const STATUS_OPTIONS = {
  all: '全部',
  ongoing: '連載中',
  completed: '已完結',
} as const;

/** 排序選項 */
export const SORT_OPTIONS = {
  latest: '最新發布',
  update: '最新更新',
  popular: '人氣最旺',
  rating: '評分最高',
} as const;

/** 地區型別 */
export type RegionKey = keyof typeof REGION_OPTIONS;

/** 劇情分類 key 型別 */
export type GenreKey = GenreType;

/** 年份型別 */
export type YearOption = (typeof YEAR_OPTIONS)[number];

/** 進度型別 */
export type StatusKey = keyof typeof STATUS_OPTIONS;

/** 排序型別 */
export type SortKey = keyof typeof SORT_OPTIONS;

/** 篩選狀態 */
export interface FilterState {
  /** 地區（單選） */
  region: RegionKey | null;
  /** 劇情分類（單選） */
  genre: GenreKey | null;
  /** 年份（單選） */
  year: YearOption | null;
  /** 進度（單選） */
  status: StatusKey;
  /** 排序（單選） */
  sort: SortKey;
}

/** 預設篩選狀態 */
export const DEFAULT_FILTER_STATE: FilterState = {
  region: null,
  genre: null,
  year: null,
  status: 'all',
  sort: 'update',
};

/** 計算已啟用篩選數量 */
export function getActiveFilterCount(filters: FilterState): number {
  return (
    (filters.region ? 1 : 0)
    + (filters.genre ? 1 : 0)
    + (filters.year ? 1 : 0)
    + (filters.status !== 'all' ? 1 : 0)
    + (filters.sort !== 'update' ? 1 : 0)
  );
}

/** 檢查是否有任何篩選啟用 */
export function hasActiveFilters(filters: FilterState): boolean {
  return getActiveFilterCount(filters) > 0;
}
