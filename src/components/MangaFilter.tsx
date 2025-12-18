'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 地區選項
 * key: API 參數, value: 顯示名稱
 */
const REGION_OPTIONS = {
  japan: '日本漫畫',
  hongkong: '港台漫畫',
  korea: '韓國漫畫',
  other: '歐美漫畫',
} as const;

/**
 * 劇情分類選項
 * key: URL 參數, value: 顯示名稱
 */
const GENRE_OPTIONS = {
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
const YEAR_OPTIONS = ['2025', '2024', '2023', '2022', '2021', '2020', '更早'] as const;

/** 進度選項 */
const STATUS_OPTIONS = {
  all: '全部',
  ongoing: '連載中',
  completed: '已完結',
} as const;

/** 排序選項 */
const SORT_OPTIONS = {
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

interface MangaFilterProps {
  /** 當前篩選狀態 */
  filters: FilterState;
  /** 篩選狀態變更回調 */
  onChange: (filters: FilterState) => void;
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

/**
 * 漫畫篩選器元件
 * 支援劇情分類（多選）、年份、進度、排序篩選
 * 響應式設計：手機版可折疊
 */
export default function MangaFilter({ filters, onChange }: MangaFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  /** 檢查是否有任何篩選啟用 */
  const hasActiveFilters =
    filters.region !== null
    || filters.genres.length > 0
    || filters.year !== null
    || filters.status !== 'all'
    || filters.sort !== 'update';

  /** 取得已啟用篩選數量 */
  const activeFilterCount =
    (filters.region ? 1 : 0)
    + filters.genres.length
    + (filters.year ? 1 : 0)
    + (filters.status !== 'all' ? 1 : 0)
    + (filters.sort !== 'update' ? 1 : 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/* 手機版：折疊控制按鈕 */}
      <div className="flex items-center justify-between md:hidden">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-1 items-center justify-between"
        >
          <span className="text-sm font-medium">
            篩選
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </span>
          {isExpanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-2 h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="mr-1 size-3" />
            清除
          </Button>
        )}
      </div>

      {/* 桌面版標題與清除按鈕 */}
      <div className="mb-4 hidden items-center justify-between md:flex">
        <h3 className="text-base font-semibold">篩選條件</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="mr-1 size-3" />
            清除篩選
          </Button>
        )}
      </div>

      {/* 篩選內容區域 */}
      <div
        className={cn(
          'space-y-4 overflow-hidden transition-all duration-300',
          // 手機版：折疊效果
          isExpanded ? 'mt-4 max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 md:mt-0 md:max-h-none md:opacity-100'
        )}
      >
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
    </div>
  );
}
