'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MangaCard from '@/components/MangaCard';
import MangaFilter, {
  type FilterState,
  DEFAULT_FILTER_STATE,
} from '@/components/MangaFilter';
import HistorySection from '@/components/HistorySection';
import FavoritesSection from '@/components/FavoritesSection';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { MangaListItem, PaginationInfo } from '@/lib/scraper/types';

/** 交錯進場延遲基數（毫秒） */
const STAGGER_DELAY = 50;

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
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [page, setPage] = useState(1);

  /**
   * 載入漫畫資料
   */
  const fetchMangas = async (
    pageNum: number,
    append = false,
    keyword?: string,
    currentFilters?: FilterState
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

        // 進度映射：UI 值 -> API 值
        const statusMap: Record<string, string> = {
          ongoing: 'lianzai',
          completed: 'wanjie',
        };
        if (f.status !== 'all' && statusMap[f.status]) {
          params.set('status', statusMap[f.status]);
        }

        // 排序映射：UI 值 -> API 值
        const sortMap: Record<string, string> = {
          latest: 'update',  // 最新發布
          update: 'update',  // 最新更新
          popular: 'view',   // 人氣最旺
          rating: 'rate',    // 評分最高
        };
        params.set('sort', sortMap[f.sort] || 'update');
      }

      const res = await fetch(`/api/manga?${params}`);
      const json = await res.json();

      if (json.success) {
        setMangas((prev) =>
          append ? [...prev, ...json.data.items] : json.data.items
        );
        setPagination(json.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch mangas:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 初始載入或切換篩選/搜尋時
  useEffect(() => {
    setPage(1);
    fetchMangas(1, false, keywordFromUrl, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, keywordFromUrl]);

  /**
   * 處理篩選變更
   */
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

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
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* 搜尋結果提示 */}
        {keywordFromUrl && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-card p-4">
            <span className="text-muted-foreground">
              搜尋結果：<span className="font-medium text-foreground">{keywordFromUrl}</span>
            </span>
            <Button variant="link" size="sm" onClick={clearSearch}>
              清除搜尋
            </Button>
          </div>
        )}

        {/* 篩選器（非搜尋模式時顯示） */}
        {!keywordFromUrl && (
          <div className="mb-6">
            <MangaFilter filters={filters} onChange={handleFilterChange} />
          </div>
        )}

        {/* 我的收藏 */}
        {!keywordFromUrl && <FavoritesSection />}

        {/* 最近閱讀 */}
        {!keywordFromUrl && <HistorySection />}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
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
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[3/4] w-full rounded-lg" />
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
