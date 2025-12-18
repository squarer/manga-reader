"use client";

import { useState, useRef, useEffect, useLayoutEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  Clock,
  Search,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
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
 * 導航欄內容元件
 * 使用 useSearchParams 需要 Suspense 包裹
 */
function NavbarContent() {
  const router = useRouter();
  const pathname = usePathname();

  // 搜尋相關狀態
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 手機版選單狀態
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 滑動指示器狀態
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  /**
   * 判斷導航項目是否為當前頁面
   */
  const isActiveNavItem = (item: NavItem): boolean => {
    if (item.href === "/") {
      // 首頁：在首頁路徑
      return pathname === "/";
    }
    // 其他頁面：檢查路徑前綴
    return pathname.startsWith(item.href);
  };

  /**
   * 更新滑動指示器位置
   */
  useLayoutEffect(() => {
    const checkActive = (item: NavItem): boolean => {
      if (item.href === "/") {
        return pathname === "/";
      }
      return pathname.startsWith(item.href);
    };

    const activeIndex = NAV_ITEMS.findIndex(checkActive);
    const activeLink = navRefs.current[activeIndex];

    if (activeLink) {
      const containerRect =
        activeLink.parentElement?.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();

      if (containerRect) {
        setIndicatorStyle({
          left: linkRect.left - containerRect.left,
          width: linkRect.width,
        });
      }
    }
  }, [pathname]);

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

  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        "border-b border-border/50",
        "bg-background/80 backdrop-blur-xl",
        "supports-[backdrop-filter]:bg-background/60",
        // 底部微光效果
        "after:absolute after:inset-x-0 after:bottom-0 after:h-px",
        "after:bg-gradient-to-r after:from-transparent after:via-primary/20 after:to-transparent"
      )}
    >
      <nav className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2",
              "text-xl font-bold text-foreground",
              "transition-colors duration-200 hover:text-primary"
            )}
          >
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">Manga Reader</span>
          </Link>

          {/* 桌面版導航 */}
          <div className="relative hidden items-center gap-1 md:flex">
            {/* 滑動指示器 */}
            <div
              className={cn(
                "absolute bottom-0 h-0.5 rounded-full bg-primary",
                "transition-all duration-300 ease-out"
              )}
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
            />

            {NAV_ITEMS.map((item, index) => {
              const isActive = isActiveNavItem(item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={(el) => {
                    navRefs.current[index] = el;
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2",
                    "rounded-lg text-sm font-medium",
                    "transition-all duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* 右側操作區 */}
          <div className="flex items-center gap-2">
            {/* 桌面版搜尋框 */}
            <div className="hidden items-center md:flex">
              <form
                onSubmit={handleSearchSubmit}
                className={cn(
                  "relative flex items-center",
                  "transition-all duration-300 ease-out"
                )}
              >
                {isSearchExpanded ? (
                  <div className="flex items-center gap-2">
                    <Input
                      ref={searchInputRef}
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onBlur={handleSearchBlur}
                      placeholder="搜尋漫畫..."
                      className={cn(
                        "w-48 transition-all duration-300",
                        "bg-muted/50 border-muted-foreground/20",
                        "focus:bg-background focus:w-64"
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setIsSearchExpanded(false);
                        setSearchValue("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSearchExpanded(true)}
                    title="搜尋"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                )}
              </form>
            </div>

            {/* 主題切換 */}
            <ThemeToggle />

            {/* 手機版選單按鈕 */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              title={isMobileMenuOpen ? "關閉選單" : "開啟選單"}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* 手機版選單 */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out md:hidden",
            isMobileMenuOpen ? "max-h-96 pb-4" : "max-h-0"
          )}
        >
          {/* 手機版搜尋框 */}
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="搜尋漫畫..."
                className="pl-10 bg-muted/50"
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
                    "flex items-center gap-3 px-4 py-3",
                    "rounded-lg text-base font-medium",
                    "transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}

/**
 * 導航欄 Fallback 元件
 * 在 Suspense 載入時顯示
 */
function NavbarFallback() {
  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        "border-b border-border/50",
        "bg-background/80 backdrop-blur-xl",
        "supports-[backdrop-filter]:bg-background/60",
        "after:absolute after:inset-x-0 after:bottom-0 after:h-px",
        "after:bg-gradient-to-r after:from-transparent after:via-primary/20 after:to-transparent"
      )}
    >
      <nav className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2",
              "text-xl font-bold text-foreground"
            )}
          >
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">Manga Reader</span>
          </Link>

          {/* 右側操作區 */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </nav>
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
