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
import { Search, Loader2, Info } from 'lucide-react';
import type { MangaListItem, PaginationInfo } from '@/lib/scraper/types';
import { STAGGER_DELAY } from '@/lib/constants';
import { parseFiltersFromParams, STATUS_MAP, SORT_MAP } from '@/lib/filter-utils';
import { useSource } from '@/components/SourceProvider';
import { DEFAULT_FILTER_STATE } from '@/lib/filter-types';

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

  const { source } = useSource();

  const [mangas, setMangas] = useState<MangaListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  // 聚合搜尋時，記錄哪一站有錯
  const [searchError, setSearchError] = useState<string | null>(null);

  const loaderRef = useRef<HTMLDivElement>(null);

  // 從 URL 解析 filter 狀態（dm5 時忽略 filter 參數）
  const filters = useMemo(
    () => (source === 'dm5' ? DEFAULT_FILTER_STATE : parseFiltersFromParams(searchParams)),
    [searchParams, source]
  );

  /**
   * 建構單一來源的 API 搜尋/篩選 URL params
   */
  function buildParams(pageNum: number, keyword?: string, currentFilters?: FilterState): URLSearchParams {
    const params = new URLSearchParams({ page: pageNum.toString() });

    if (keyword) {
      params.set('keyword', keyword);
    } else if (source !== 'dm5') {
      // dm5 不傳進階篩選
      const f = currentFilters || filters;
      if (f.region) params.set('region', f.region);
      if (f.genre) params.set('genre', f.genre);
      if (f.year) params.set('year', f.year === '更早' ? '2019' : f.year);
      if (f.status !== 'all' && STATUS_MAP[f.status]) params.set('status', STATUS_MAP[f.status]);
      params.set('sort', SORT_MAP[f.sort] || 'update');
    }

    return params;
  }

  /**
   * 載入漫畫資料
   * - 搜尋模式：平行查兩站、合併、容錯
   * - 瀏覽模式：只查選定來源
   *
   * 注意：聚合搜尋僅取兩站各第一頁合併，分頁在聚合模式下隱藏（複雜度高、MVP 限制）
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
    setSearchError(null);

    try {
      if (keyword) {
        // 搜尋模式：平行查兩站
        const [r1, r2] = await Promise.allSettled([
          fetch(`/api/manga?${new URLSearchParams({ keyword, page: '1', source: 'manhuagui' })}`, { signal }).then((r) => r.json()),
          fetch(`/api/manga?${new URLSearchParams({ keyword, page: '1', source: 'dm5' })}`, { signal }).then((r) => r.json()),
        ]);

        const items: MangaListItem[] = [];
        const failures: string[] = [];

        if (r1.status === 'fulfilled' && r1.value.success) {
          items.push(...(r1.value.data.items as MangaListItem[]));
        } else {
          failures.push('漫画柜');
        }

        if (r2.status === 'fulfilled' && r2.value.success) {
          items.push(...(r2.value.data.items as MangaListItem[]));
        } else {
          failures.push('动漫屋');
        }

        if (failures.length > 0 && failures.length < 2) {
          setSearchError(`${failures.join('、')} 查詢失敗，僅顯示其他來源結果`);
        }

        setMangas(items);
        // 聚合搜尋不支援跨站分頁，pagination 設為 null 隱藏分頁觸發器
        setPagination(null);
      } else {
        // 瀏覽模式：只查選定來源
        const params = buildParams(pageNum, undefined, currentFilters);
        params.set('source', source);

        const res = await fetch(`/api/manga?${params}`, { signal });
        const json = await res.json();

        if (json.success) {
          setMangas((prev) => (append ? [...prev, ...json.data.items] : json.data.items));
          setPagination(json.data.pagination);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Failed to fetch mangas:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  // 初始載入或切換篩選/搜尋/來源時重新 fetch
  // 切換來源時清空篩選（dm5 不傳 manhuagui filter），由 filters memo 已處理
  useEffect(() => {
    const abortController = new AbortController();
    setPage(1);
    fetchMangas(1, false, keywordFromUrl, filters, abortController.signal);

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, keywordFromUrl, source]);

  // IntersectionObserver 無限滾動（聚合搜尋不啟用，pagination 為 null）
  useEffect(() => {
    if (!loaderRef.current || loading || loadingMore) return;
    if (!pagination || page >= pagination.total) return;

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

  /** 載入更多（僅單一來源瀏覽模式） */
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMangas(nextPage, true, keywordFromUrl, filters);
  };

  /** 清除搜尋 */
  const clearSearch = () => {
    startTransition(() => {
      router.push('/');
    });
  };

  // 是否顯示來源徽章（聚合搜尋模式）
  const showSourceBadge = !!keywordFromUrl;

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
              {mangas.length > 0 && (
                <span className="ml-2">（兩站共 {mangas.length} 部結果）</span>
              )}
            </span>
            <Button variant="ghost" size="sm" onClick={clearSearch} className="ml-auto">
              清除
            </Button>
          </div>
        )}

        {/* 聚合搜尋某站失敗提示 */}
        {searchError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400">
            <Info className="h-4 w-4 shrink-0" />
            {searchError}
          </div>
        )}

        {/* dm5 篩選停用說明（非搜尋模式） */}
        {source === 'dm5' && !keywordFromUrl && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            动漫屋目前僅支援預設瀏覽與搜尋
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
                {hasActiveFilters(filters) && source !== 'dm5' ? '篩選結果' : '所有漫畫'}
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
                ) : hasActiveFilters(filters) && source !== 'dm5' ? (
                  <Button onClick={() => { startTransition(() => { router.push('/'); }); }} variant="outline">清除篩選</Button>
                ) : null}
              </div>
            ) : (
              <>
                {/* Manga Grid with staggered entrance */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {mangas.map((manga, index) => (
                    <MangaCard
                      key={`${manga.source}-${manga.id}`}
                      manga={manga}
                      animationDelay={Math.min(index, 12) * STAGGER_DELAY}
                      showSourceBadge={showSourceBadge}
                    />
                  ))}
                </div>

                {/* 無限滾動 loader（聚合搜尋不分頁，不顯示） */}
                {!keywordFromUrl && (
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
                )}
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
 * 漫畫列表、搜尋（跨站聚合）、分類篩選（manhuagui only）
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
