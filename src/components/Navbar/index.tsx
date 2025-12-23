'use client';

/**
 * 導航欄元件
 * 包含 Logo、導航連結、搜尋框和主題切換
 * 響應式設計：桌面版水平導航，手機版漢堡選單
 */

import { useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { BookOpen, SlidersHorizontal, Menu, X, Heart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FilterContent, type FilterState, getActiveFilterCount } from '@/components/MangaFilter';
import { cn } from '@/lib/utils';
import { useHistory } from '@/lib/hooks/useHistory';
import { NAV_ITEMS, type NavItem } from './types';
import { parseFiltersFromParams, filtersToParams } from './utils';
import { DesktopSearch } from './DesktopSearch';
import { MobileMenu } from './MobileMenu';

/**
 * Hover 展開按鈕共用元件
 */
interface HoverExpandButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
  href?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function HoverExpandButton({
  icon: Icon,
  label,
  isActive = false,
  href,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: HoverExpandButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onMouseLeave?.();
  };

  const className = cn(
    'flex items-center h-8 px-2',
    'rounded-full',
    'transition-all duration-200',
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
  );

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      <span
        className={cn(
          'text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-200',
          isHovered ? 'w-16 ml-1.5' : 'w-0'
        )}
      >
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {content}
    </button>
  );
}

/**
 * 導航欄內容元件
 */
function NavbarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 狀態
  const [searchValue, setSearchValue] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 閱讀歷史
  const { history, isLoaded: isHistoryLoaded } = useHistory();

  // 從 URL 解析 filter 狀態
  const filters = parseFiltersFromParams(searchParams);
  const activeFilterCount = getActiveFilterCount(filters);

  // 頁面狀態
  const isHomePage = pathname === '/';
  const isSearchMode = !!searchParams.get('keyword');

  /** 判斷導航項目是否為當前頁面 */
  const isActiveNavItem = (item: NavItem): boolean => {
    if (item.href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(item.href);
  };

  /** 處理搜尋 */
  const handleSearch = useCallback(
    (keyword: string) => {
      router.push(`/?keyword=${encodeURIComponent(keyword)}`);
      setIsMobileMenuOpen(false);
    },
    [router]
  );

  /** 處理手機版搜尋提交 */
  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      handleSearch(searchValue.trim());
      setSearchValue('');
    }
  };

  /** 處理篩選變更 */
  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      const params = filtersToParams(newFilters);
      const queryString = params.toString();
      router.push(queryString ? `/?${queryString}` : '/');
    },
    [router]
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] pt-4">
      <div className="mx-auto max-w-7xl px-4">
        <nav
          className={cn(
            'inline-flex items-center gap-1',
            'rounded-full px-2 py-1.5',
            'border border-border/50',
            'bg-background/80 backdrop-blur-xl',
            'supports-[backdrop-filter]:bg-background/60',
            'shadow-lg shadow-black/5'
          )}
        >
          <div className="flex items-center">
            {/* Logo */}
            <Link
              href="/"
              className={cn(
                'flex items-center gap-2 px-3 py-1.5',
                'rounded-full',
                'text-lg font-bold text-foreground',
                'transition-colors duration-200 hover:text-primary hover:bg-accent'
              )}
            >
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="hidden sm:inline">Manga</span>
            </Link>

            {/* 分隔線 */}
            <div className="hidden h-6 w-px bg-border/50 md:block" />

            {/* 桌面版導航 */}
            <div className="relative hidden items-center md:flex">
              {NAV_ITEMS.map((item) => (
                <HoverExpandButton
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  isActive={isActiveNavItem(item)}
                />
              ))}
            </div>

            {/* 操作區 */}
            <div className="flex items-center">
              {/* 閱讀歷史 */}
              <HoverExpandButton
                icon={Clock}
                label="閱讀歷史"
                href="/history"
                isActive={pathname.startsWith('/history')}
              />

              {/* 我的收藏 */}
              <HoverExpandButton
                icon={Heart}
                label="我的收藏"
                href="/favorites"
                isActive={pathname.startsWith('/favorites')}
              />

              {/* 分隔線 */}
              <div className="hidden h-6 w-px bg-border/50 md:block" />

              {/* 篩選按鈕（僅首頁非搜尋模式顯示） */}
              {isHomePage && !isSearchMode && (
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'relative h-8 w-8 rounded-full',
                        activeFilterCount > 0 && 'text-primary'
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
                  <PopoverContent className="w-[360px] p-4" align="end" sideOffset={8}>
                    <FilterContent filters={filters} onChange={handleFilterChange} />
                  </PopoverContent>
                </Popover>
              )}

              {/* 桌面版搜尋框 */}
              <DesktopSearch onSearch={handleSearch} />

              {/* 主題切換 */}
              <ThemeToggle />

              {/* 手機版選單按鈕 */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                title={isMobileMenuOpen ? '關閉選單' : '開啟選單'}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </nav>

        {/* 手機版選單 */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          pathname={pathname}
          searchValue={searchValue}
          historyCount={isHistoryLoaded ? history.length : 0}
          onSearchChange={setSearchValue}
          onSearchSubmit={handleMobileSearchSubmit}
          onClose={() => setIsMobileMenuOpen(false)}
          isActiveNavItem={isActiveNavItem}
        />
      </div>
    </header>
  );
}

/**
 * 導航欄 Fallback 元件
 */
function NavbarFallback() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[60] pt-4">
      <div className="mx-auto max-w-7xl px-4">
        <nav
          className={cn(
            'inline-flex items-center gap-1',
            'rounded-full px-2 py-1.5',
            'border border-border/50',
            'bg-background/80 backdrop-blur-xl',
            'supports-[backdrop-filter]:bg-background/60',
            'shadow-lg shadow-black/5'
          )}
        >
          <Link
            href="/"
            className={cn(
              'flex items-center gap-2 px-3 py-1.5',
              'rounded-full',
              'text-lg font-bold text-foreground'
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
 */
export function Navbar() {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <NavbarContent />
    </Suspense>
  );
}
