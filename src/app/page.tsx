'use client';

import { useState, useEffect } from 'react';
import MangaCard from '@/components/MangaCard';
import HistorySection from '@/components/HistorySection';
import FavoritesSection from '@/components/FavoritesSection';
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
  const [category, setCategory] = useState('japan');
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    async function fetchMangas() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
        });

        if (keyword) {
          params.set('keyword', keyword);
        } else {
          params.set('category', category);
        }

        const res = await fetch(`/api/manga?${params}`);
        const json = await res.json();

        if (json.success) {
          setMangas(json.data.items);
          setPagination(json.data.pagination);
        }
      } catch (error) {
        console.error('Failed to fetch mangas:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMangas();
  }, [category, page, keyword]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setKeyword('');
    setSearchInput('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-400">Manga Reader</h1>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜尋漫畫..."
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm hover:bg-blue-700"
              >
                搜尋
              </button>
            </form>
          </div>

          {/* Categories */}
          {!keyword && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id);
                    setPage(1);
                  }}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors ${
                    category === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Search indicator */}
          {keyword && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-gray-400">搜尋結果：{keyword}</span>
              <button
                onClick={clearSearch}
                className="text-sm text-blue-400 hover:underline"
              >
                清除搜尋
              </button>
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
          <div className="flex h-64 items-center justify-center">
            <div className="text-xl text-gray-400">載入中...</div>
          </div>
        ) : mangas.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-xl text-gray-400">沒有找到漫畫</div>
          </div>
        ) : (
          <>
            {/* Manga Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {mangas.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded bg-gray-800 px-4 py-2 disabled:opacity-50"
                >
                  上一頁
                </button>
                <span className="px-4 text-gray-400">
                  {page} / {pagination.total}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.total, p + 1))}
                  disabled={page === pagination.total}
                  className="rounded bg-gray-800 px-4 py-2 disabled:opacity-50"
                >
                  下一頁
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
