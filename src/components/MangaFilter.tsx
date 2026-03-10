'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  REGION_OPTIONS,
  GENRE_OPTIONS,
  YEAR_OPTIONS,
  STATUS_OPTIONS,
  SORT_OPTIONS,
  DEFAULT_FILTER_STATE,
  hasActiveFilters,
  type FilterState,
  type RegionKey,
  type GenreKey,
  type YearOption,
  type StatusKey,
  type SortKey,
} from '@/lib/filter-types';

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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Badge
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      variant={isSelected ? 'default' : 'outline'}
      className={cn(
        'cursor-pointer select-none transition-all duration-200',
        isSelected
          ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
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

  /** 設定劇情分類（單選，再次點擊取消） */
  const setGenre = (genre: GenreKey) => {
    onChange({ ...filters, genre: genre === filters.genre ? null : genre });
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

      {/* 劇情分類（單選） */}
      <FilterSection title="劇情分類">
        {Object.entries(GENRE_OPTIONS).map(([key, label]) => (
          <FilterTag
            key={key}
            label={label}
            isSelected={filters.genre === key}
            onClick={() => setGenre(key as GenreKey)}
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
