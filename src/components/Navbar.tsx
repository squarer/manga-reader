"use client";

import { useState, useRef, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  TrendingUp,
  Clock,
  Search,
  Menu,
  X,
  BookOpen,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  FilterContent,
  type FilterState,
  type GenreKey,
  type RegionKey,
  type StatusKey,
  type SortKey,
  type YearOption,
  GENRE_OPTIONS,
  YEAR_OPTIONS,
  getActiveFilterCount,
} from "@/components/MangaFilter";
import { cn } from "@/lib/utils";

/**
 * 導航項目定義
 */
interface NavItem {
  /** 顯示名稱 */
  label: string;
  /** 連結路徑 */
  href: string;
  /** 圖標元件 */
  icon: React.ComponentType<{ className?: string }>;
}

/** 導航選單項目 */
const NAV_ITEMS: NavItem[] = [
  { label: "首頁", href: "/", icon: Home },
  { label: "排行榜", href: "/rank", icon: TrendingUp },
  { label: "最新更新", href: "/update", icon: Clock },
];

/**
 * 從 URL 參數解析 FilterState
 */
function parseFiltersFromParams(searchParams: URLSearchParams): FilterState {
  const region = searchParams.get("region") as RegionKey | null;
  const genreParam = searchParams.get("genre");
  const genres = genreParam
    ? (genreParam.split(",").filter((g) => g in GENRE_OPTIONS) as GenreKey[])
    : [];
  const yearParam = searchParams.get("year");
  const year = yearParam && YEAR_OPTIONS.includes(yearParam as YearOption)
    ? (yearParam as YearOption)
    : null;
  const status = (searchParams.get("status") as StatusKey) || "all";
  const sort = (searchParams.get("sort") as SortKey) || "update";

  return { region, genres, year, status, sort };
}

/**
 * 將 FilterState 轉換為 URL 參數
 */
function filtersToParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.region) {
    params.set("region", filters.region);
  }
  if (filters.genres.length > 0) {
    params.set("genre", filters.genres.join(","));
  }
  if (filters.year) {
    params.set("year", filters.year);
  }
  if (filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (filters.sort !== "update") {
    params.set("sort", filters.sort);
  }

  return params;
}

/**
 * 導航欄內容元件
 * 使用 useSearchParams 需要 Suspense 包裹
 */
function NavbarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 搜尋相關狀態
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 手機版選單狀態
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 篩選 Popover 狀態
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 從 URL 解析 filter 狀態
  const filters = parseFiltersFromParams(searchParams);
  const activeFilterCount = getActiveFilterCount(filters);

  // 是否在首頁（只有首頁顯示篩選）
  const isHomePage = pathname === "/";

  // 是否為搜尋模式
  const isSearchMode = !!searchParams.get("keyword");

  /**
   * 判斷導航項目是否為當前頁面
   */
  const isActiveNavItem = (item: NavItem): boolean => {
    if (item.href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(item.href);
  };

  /**
   * 搜尋框展開時自動聚焦
   */
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  /**
   * 處理搜尋提交
   */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/?keyword=${encodeURIComponent(searchValue.trim())}`);
      setIsSearchExpanded(false);
      setSearchValue("");
      setIsMobileMenuOpen(false);
    }
  };

  /**
   * 處理搜尋框失去焦點
   */
  const handleSearchBlur = () => {
    if (!searchValue) {
      setIsSearchExpanded(false);
    }
  };

  /**
   * 關閉手機版選單
   */
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  /**
   * 處理篩選變更
   */
  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      const params = filtersToParams(newFilters);
      const queryString = params.toString();
      router.push(queryString ? `/?${queryString}` : "/");
    },
    [router]
  );

  return (
    <header className="sticky top-0 z-[60] pt-4">
      <div className="mx-auto max-w-7xl px-4">
        <nav
          className={cn(
            "inline-flex items-center gap-1",
            "rounded-full px-2 py-1.5",
            "border border-border/50",
            "bg-background/80 backdrop-blur-xl",
            "supports-[backdrop-filter]:bg-background/60",
            "shadow-lg shadow-black/5"
          )}
        >
          <div className="flex items-center">
            {/* Logo */}
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5",
                "rounded-full",
                "text-lg font-bold text-foreground",
                "transition-colors duration-200 hover:text-primary hover:bg-accent"
              )}
            >
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="hidden sm:inline">Manga</span>
            </Link>

            {/* 分隔線 */}
            <div className="hidden h-6 w-px bg-border/50 md:block" />

            {/* 桌面版導航 */}
            <div className="relative hidden items-center md:flex">
              {NAV_ITEMS.map((item) => {
                const isActive = isActiveNavItem(item);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5",
                      "rounded-full text-sm font-medium",
                      "transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* 分隔線 */}
            <div className="hidden h-6 w-px bg-border/50 md:block" />

            {/* 操作區 */}
            <div className="flex items-center">
              {/* 篩選按鈕（僅首頁非搜尋模式顯示） */}
              {isHomePage && !isSearchMode && (
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "relative h-8 w-8 rounded-full",
                        activeFilterCount > 0 && "text-primary"
                      )}
                      title="篩選"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      {activeFilterCount > 0 && (
                        <Badge
                          variant="default"
                          className="absolute -right-1 -top-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
                        >
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[360px] p-4"
                    align="end"
                    sideOffset={8}
                  >
                    <FilterContent
                      filters={filters}
                      onChange={handleFilterChange}
                    />
                  </PopoverContent>
                </Popover>
              )}

              {/* 桌面版搜尋框 */}
              <div className="hidden items-center md:flex">
                <form
                  onSubmit={handleSearchSubmit}
                  className="relative flex items-center"
                >
                  {/* 搜尋按鈕 */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full transition-all duration-300",
                      isSearchExpanded && "opacity-0 scale-75 pointer-events-none absolute"
                    )}
                    onClick={() => setIsSearchExpanded(true)}
                    title="搜尋"
                  >
                    <Search className="h-4 w-4" />
                  </Button>

                  {/* 展開的搜尋框 */}
                  <div
                    className={cn(
                      "flex items-center gap-1 overflow-hidden transition-all duration-300 ease-out",
                      isSearchExpanded
                        ? "w-52 opacity-100"
                        : "w-0 opacity-0 pointer-events-none"
                    )}
                  >
                    <Input
                      ref={searchInputRef}
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onBlur={handleSearchBlur}
                      placeholder="搜尋漫畫..."
                      className={cn(
                        "h-8 w-40 rounded-full transition-all duration-200",
                        "bg-muted border-transparent",
                        "focus-visible:ring-0 focus-visible:border-transparent",
                        "focus:w-44"
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 rounded-full"
                      onClick={() => {
                        setIsSearchExpanded(false);
                        setSearchValue("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>

              {/* 主題切換 */}
              <ThemeToggle />

              {/* 手機版選單按鈕 */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                title={isMobileMenuOpen ? "關閉選單" : "開啟選單"}
              >
                {isMobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </nav>

        {/* 手機版選單 - 獨立於浮動導航欄 */}
        <div
          className={cn(
            "mt-2 overflow-hidden transition-all duration-300 ease-out md:hidden",
            "rounded-2xl",
            "border border-border/50",
            "bg-background/95 backdrop-blur-xl",
            "shadow-lg shadow-black/5",
            isMobileMenuOpen
              ? "max-h-96 p-4"
              : "max-h-0 p-0 border-transparent"
          )}
        >
          {/* 手機版搜尋框 */}
          <form onSubmit={handleSearchSubmit} className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="搜尋漫畫..."
                className="h-10 rounded-full pl-10 bg-muted/50 border-transparent"
              />
            </div>
          </form>

          {/* 手機版導航連結 */}
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = isActiveNavItem(item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5",
                    "rounded-full text-sm font-medium",
                    "transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * 導航欄 Fallback 元件
 * 在 Suspense 載入時顯示
 */
function NavbarFallback() {
  return (
    <header className="sticky top-0 z-[60] pt-4">
      <div className="mx-auto max-w-7xl px-4">
        <nav
          className={cn(
            "inline-flex items-center gap-1",
            "rounded-full px-2 py-1.5",
            "border border-border/50",
            "bg-background/80 backdrop-blur-xl",
            "supports-[backdrop-filter]:bg-background/60",
            "shadow-lg shadow-black/5"
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5",
              "rounded-full",
              "text-lg font-bold text-foreground"
            )}
          >
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">Manga</span>
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

/**
 * 導航欄元件
 * 包含 Logo、導航連結、搜尋框和主題切換
 * 響應式設計：桌面版水平導航，手機版漢堡選單
 */
export function Navbar() {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <NavbarContent />
    </Suspense>
  );
}
