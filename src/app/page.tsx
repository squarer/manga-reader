'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MangaCard from '@/components/MangaCard';
import type { FilterState } from '@/components/MangaFilter';
import HistorySection from '@/components/HistorySection';
import FavoritesSection from '@/components/FavoritesSection';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { MangaListItem, PaginationInfo } from '@/lib/scraper/types';
import { STAGGER_DELAY } from '@/lib/constants';
import { parseFiltersFromParams, STATUS_MAP, SORT_MAP } from '@/lib/filter-utils';

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

        // 劇情分類（多選）
        if (f.genres.length > 0) {
          params.set('genre', f.genres.join(','));
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
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-20">
        {/* 搜尋結果提示 */}
        {keywordFromUrl && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-card p-4">
            <span className="text-muted-foreground">
              搜尋結果：
              <span className="font-medium text-foreground">
                {keywordFromUrl}
              </span>
            </span>
            <Button variant="link" size="sm" onClick={clearSearch}>
              清除搜尋
            </Button>
          </div>
        )}

        {/* 我的收藏 & 最近閱讀 */}
        {!keywordFromUrl && (
          <div className="mb-8 flex flex-col gap-8 lg:flex-row lg:gap-12">
            <FavoritesSection />
            <HistorySection />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-3/4 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : mangas.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-xl text-muted-foreground">沒有找到漫畫</div>
          </div>
        ) : (
          <>
            {/* Manga Grid with staggered entrance */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {mangas.map((manga, index) => (
                <MangaCard
                  key={manga.id}
                  manga={manga}
                  animationDelay={index * STAGGER_DELAY}
                />
              ))}
            </div>

            {/* Load More */}
            {pagination && page < pagination.total && (
              <div className="mt-8 flex flex-col items-center gap-2">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 font-medium"
                >
                  {loadingMore ? '載入中...' : '載入更多'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  已顯示 {mangas.length} / {pagination.totalItems} 部漫畫
                </span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
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
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-7xl px-4 pb-8 pt-20">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-3/4 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
