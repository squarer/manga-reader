'use client';

import { useState, useEffect } from 'react';
import MangaCard from '@/components/MangaCard';
import HistorySection from '@/components/HistorySection';
import FavoritesSection from '@/components/FavoritesSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { MangaListItem, PaginationInfo } from '@/lib/scraper/types';

const CATEGORIES = [
  { id: 'japan', name: '日本漫畫' },
  { id: 'hongkong', name: '港台漫畫' },
  { id: 'other', name: '歐美漫畫' },
  { id: 'korea', name: '韓國漫畫' },
];

export default function Home() {
  const [mangas, setMangas] = useState<MangaListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState('japan');
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // 載入漫畫資料
  const fetchMangas = async (pageNum: number, append = false) => {
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
        params.set('keyword', keyword);
      } else {
        params.set('category', category);
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

  // 初始載入或切換分類/搜尋時
  useEffect(() => {
    setPage(1);
    fetchMangas(1, false);
  }, [category, keyword]);

  // 載入更多
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMangas(nextPage, true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
  };

  const clearSearch = () => {
    setKeyword('');
    setSearchInput('');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Manga Reader</h1>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜尋漫畫..."
                className="w-48 sm:w-64"
              />
              <Button type="submit">搜尋</Button>
            </form>
          </div>

          {/* Categories */}
          {!keyword && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id);
                    setPage(1);
                  }}
                  variant={category === cat.id ? 'default' : 'secondary'}
                  size="sm"
                  className="whitespace-nowrap rounded-full"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          )}

          {/* Search indicator */}
          {keyword && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-muted-foreground">搜尋結果：{keyword}</span>
              <Button variant="link" size="sm" onClick={clearSearch}>
                清除搜尋
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* 我的收藏 */}
        {!keyword && <FavoritesSection />}

        {/* 最近閱讀 */}
        {!keyword && <HistorySection />}

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
            {/* Manga Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {mangas.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
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
