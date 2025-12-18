'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 地區選項
 * key: API 參數, value: 顯示名稱
 */
export const REGION_OPTIONS = {
  japan: '日本漫畫',
  hongkong: '港台漫畫',
  korea: '韓國漫畫',
  other: '歐美漫畫',
} as const;

/**
 * 劇情分類選項
 * key: URL 參數, value: 顯示名稱
 */
export const GENRE_OPTIONS = {
  rexue: '熱血',
  maoxian: '冒險',
  mohuan: '魔幻',
  gaoxiao: '搞笑',
  aiqing: '愛情',
  kehuan: '科幻',
  xiaoyuan: '校園',
  xuanyi: '懸疑',
  kongbu: '恐怖',
  hougong: '後宮',
  danmei: '耽美',
  baihe: '百合',
  wuxia: '武俠',
  gedou: '格鬥',
  zhiyu: '治癒',
} as const;

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
export type GenreKey = keyof typeof GENRE_OPTIONS;

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
  /** 劇情分類（多選） */
  genres: GenreKey[];
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
  genres: [],
  year: null,
  status: 'all',
  sort: 'update',
};

/**
 * 計算已啟用篩選數量
 */
export function getActiveFilterCount(filters: FilterState): number {
  return (
    (filters.region ? 1 : 0)
    + filters.genres.length
    + (filters.year ? 1 : 0)
    + (filters.status !== 'all' ? 1 : 0)
    + (filters.sort !== 'update' ? 1 : 0)
  );
}

/**
 * 檢查是否有任何篩選啟用
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.region !== null
    || filters.genres.length > 0
    || filters.year !== null
    || filters.status !== 'all'
    || filters.sort !== 'update'
  );
}

/**
 * 篩選器區塊標題元件
 */
function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/**
 * 篩選標籤元件
 * 支援選中狀態的視覺反饋
 */
function FilterTag({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Badge
      variant={isSelected ? 'default' : 'outline'}
      className={cn(
        'cursor-pointer select-none transition-all duration-200',
        isSelected
          ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      onClick={onClick}
    >
      {label}
    </Badge>
  );
}

interface FilterContentProps {
  /** 當前篩選狀態 */
  filters: FilterState;
  /** 篩選狀態變更回調 */
  onChange: (filters: FilterState) => void;
  /** 是否顯示標題和清除按鈕 */
  showHeader?: boolean;
}

/**
 * 篩選內容元件
 * 可在 Popover 或獨立區塊中使用
 */
export function FilterContent({
  filters,
  onChange,
  showHeader = true,
}: FilterContentProps) {
  /** 設定地區（單選） */
  const setRegion = (region: RegionKey | null) => {
    onChange({ ...filters, region: region === filters.region ? null : region });
  };

  /** 切換劇情分類（多選） */
  const toggleGenre = (genre: GenreKey) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter((g) => g !== genre)
      : [...filters.genres, genre];
    onChange({ ...filters, genres: newGenres });
  };

  /** 設定年份（單選） */
  const setYear = (year: YearOption | null) => {
    onChange({ ...filters, year: year === filters.year ? null : year });
  };

  /** 設定進度（單選） */
  const setStatus = (status: StatusKey) => {
    onChange({ ...filters, status });
  };

  /** 設定排序（單選） */
  const setSort = (sort: SortKey) => {
    onChange({ ...filters, sort });
  };

  /** 清除所有篩選 */
  const clearFilters = () => {
    onChange(DEFAULT_FILTER_STATE);
  };

  const isActive = hasActiveFilters(filters);

  return (
    <div className="space-y-4">
      {/* 標題與清除按鈕 */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">篩選條件</h3>
          {isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="mr-1 size-3" />
              清除
            </Button>
          )}
        </div>
      )}

      {/* 地區（單選） */}
      <FilterSection title="地區">
        {Object.entries(REGION_OPTIONS).map(([key, label]) => (
          <FilterTag
            key={key}
            label={label}
            isSelected={filters.region === key}
            onClick={() => setRegion(key as RegionKey)}
          />
        ))}
      </FilterSection>

      {/* 劇情分類（多選） */}
      <FilterSection title="劇情分類">
        {Object.entries(GENRE_OPTIONS).map(([key, label]) => (
          <FilterTag
            key={key}
            label={label}
            isSelected={filters.genres.includes(key as GenreKey)}
            onClick={() => toggleGenre(key as GenreKey)}
          />
        ))}
      </FilterSection>

      {/* 年份（單選） */}
      <FilterSection title="年份">
        {YEAR_OPTIONS.map((year) => (
          <FilterTag
            key={year}
            label={year}
            isSelected={filters.year === year}
            onClick={() => setYear(year)}
          />
        ))}
      </FilterSection>

      {/* 進度（單選） */}
      <FilterSection title="進度">
        {Object.entries(STATUS_OPTIONS).map(([key, label]) => (
          <FilterTag
            key={key}
            label={label}
            isSelected={filters.status === key}
            onClick={() => setStatus(key as StatusKey)}
          />
        ))}
      </FilterSection>

      {/* 排序（單選） */}
      <FilterSection title="排序">
        {Object.entries(SORT_OPTIONS).map(([key, label]) => (
          <FilterTag
            key={key}
            label={label}
            isSelected={filters.sort === key}
            onClick={() => setSort(key as SortKey)}
          />
        ))}
      </FilterSection>
    </div>
  );
}

interface MangaFilterProps {
  /** 當前篩選狀態 */
  filters: FilterState;
  /** 篩選狀態變更回調 */
  onChange: (filters: FilterState) => void;
}

/**
 * 漫畫篩選器元件（卡片版）
 * @deprecated 使用 Navbar 中的 FilterPopover 取代
 */
export default function MangaFilter({ filters, onChange }: MangaFilterProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <FilterContent filters={filters} onChange={onChange} />
    </div>
  );
}
