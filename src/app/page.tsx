'use client';

import { useState, useEffect, useRef, Suspense, useMemo, startTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MangaCard from '@/components/MangaCard';
import type { FilterState } from '@/lib/filter-types';
import { hasActiveFilters } from '@/lib/filter-types';
import HistorySection from '@/components/HistorySection';
import FavoritesSection from '@/components/FavoritesSection';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Loader2 } from 'lucide-react';
import type { MangaListItem, PaginationInfo } from '@/lib/scraper/types';
import { STAGGER_DELAY } from '@/lib/constants';
import { parseFiltersFromParams, STATUS_MAP, SORT_MAP } from '@/lib/filter-utils';

function MangaGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-3/4 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

/**
 * 首頁內容元件
 * 使用 useSearchParams 需要 Suspense 包裹
 */
function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const keywordFromUrl = searchParams.get('keyword') || '';

  const [mangas, setMangas] = useState<MangaListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const loaderRef = useRef<HTMLDivElement>(null);

  // 從 URL 解析 filter 狀態
  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams]
  );

  /**
   * 載入漫畫資料
   */
  const fetchMangas = async (
    pageNum: number,
    append = false,
    keyword?: string,
    currentFilters?: FilterState,
    signal?: AbortSignal
  ) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
      });

      if (keyword) {
        // 搜尋模式
        params.set('keyword', keyword);
      } else {
        // 篩選模式
        const f = currentFilters || filters;

        // 地區
        if (f.region) {
          params.set('region', f.region);
        }

        // 劇情分類（單選）
        if (f.genre) {
          params.set('genre', f.genre);
        }

        // 年份
        if (f.year) {
          params.set('year', f.year === '更早' ? '2019' : f.year);
        }

        // 進度
        if (f.status !== 'all' && STATUS_MAP[f.status]) {
          params.set('status', STATUS_MAP[f.status]);
        }

        // 排序
        params.set('sort', SORT_MAP[f.sort] || 'update');
      }

      const res = await fetch(`/api/manga?${params}`, { signal });
      const json = await res.json();

      if (json.success) {
        setMangas((prev) =>
          append ? [...prev, ...json.data.items] : json.data.items
        );
        setPagination(json.data.pagination);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // 請求被取消，不處理
      }
      console.error('Failed to fetch mangas:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  // 初始載入或切換篩選/搜尋時（使用 AbortController 防止 Strict Mode 重複請求）
  useEffect(() => {
    const abortController = new AbortController();
    setPage(1);
    fetchMangas(1, false, keywordFromUrl, filters, abortController.signal);

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, keywordFromUrl]);

  // IntersectionObserver 無限滾動
  useEffect(() => {
    if (!loaderRef.current || loading || loadingMore) return;
    if (pagination && page >= pagination.total) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pagination, loading, loadingMore]);

  /**
   * 載入更多
   */
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMangas(nextPage, true, keywordFromUrl, filters);
  };

  /**
   * 清除搜尋
   */
  const clearSearch = () => {
    startTransition(() => {
      router.push('/');
    });
  };

  return (
    <>
      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 pb-8">
        {/* 搜尋結果提示 */}
        {keywordFromUrl && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <Search className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">
              搜尋：
              <span className="font-medium text-foreground">{keywordFromUrl}</span>
              {pagination && (
                <span className="ml-2">（{pagination.totalItems} 部結果）</span>
              )}
            </span>
            <Button variant="ghost" size="sm" onClick={clearSearch} className="ml-auto">
              清除
            </Button>
          </div>
        )}

        {/* 我的收藏 & 最近閱讀 */}
        {!keywordFromUrl && (
          <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:gap-12">
            <FavoritesSection />
            <HistorySection />
          </div>
        )}

        {/* 分隔線 + 主要漫畫區塊 */}
        <div className={!keywordFromUrl ? 'border-t border-border pt-8' : ''}>
          {/* 區塊標題 */}
          {!keywordFromUrl && (
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-serif font-medium">
                {hasActiveFilters(filters) ? '篩選結果' : '所有漫畫'}
              </h2>
              {pagination && (
                <span className="text-sm text-muted-foreground">
                  共 {pagination.totalItems} 部
                </span>
              )}
            </div>
          )}

          <div aria-live="polite">
            {loading ? (
              <MangaGridSkeleton />
            ) : mangas.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <Search className="h-16 w-16 text-muted-foreground/30" />
                <p className="text-lg text-muted-foreground">沒有找到符合條件的漫畫</p>
                {keywordFromUrl ? (
                  <Button onClick={clearSearch} variant="outline">清除搜尋</Button>
                ) : hasActiveFilters(filters) ? (
                  <Button onClick={() => { startTransition(() => { router.push('/'); }); }} variant="outline">清除篩選</Button>
                ) : null}
              </div>
            ) : (
              <>
                {/* Manga Grid with staggered entrance */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {mangas.map((manga, index) => (
                    <MangaCard
                      key={manga.id}
                      manga={manga}
                      animationDelay={Math.min(index, 12) * STAGGER_DELAY}
                    />
                  ))}
                </div>

                {/* Infinite scroll loader */}
                <div ref={loaderRef} className="flex h-20 items-center justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>載入更多...</span>
                    </div>
                  )}
                  {pagination && page >= pagination.total && mangas.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      已顯示全部 {pagination.totalItems} 部漫畫
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

/**
 * 首頁
 * 漫畫列表、搜尋、分類篩選
 */
export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 pb-8">
          <MangaGridSkeleton />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
