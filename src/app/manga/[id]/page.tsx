'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { MangaInfo } from '@/lib/scraper/types';
import { useFavorites } from '@/lib/hooks/useFavorites';

export default function MangaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [manga, setManga] = useState<MangaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isFavorite, toggleFavorite, isLoaded: favLoaded } = useFavorites();

  useEffect(() => {
    async function fetchManga() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/manga/${id}`);
        const json = await res.json();

        if (json.success) {
          setManga(json.data);
        } else {
          setError(json.error || 'Failed to load manga');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }

    fetchManga();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-xl text-white">載入中...</div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-900">
        <div className="text-xl text-red-500">{error || '載入失敗'}</div>
        <Link href="/" className="text-blue-400 hover:underline">
          返回首頁
        </Link>
      </div>
    );
  }

  const coverUrl = manga.cover
    ? `/api/image?url=${encodeURIComponent(manga.cover)}`
    : '/placeholder.jpg';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/95">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Link href="/" className="text-blue-400 hover:underline">
            ← 返回首頁
          </Link>
        </div>
      </header>

      {/* Manga Info */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Cover */}
          <div className="flex-shrink-0">
            <div className="relative h-80 w-60 overflow-hidden rounded-lg">
              <Image
                src={coverUrl}
                alt={manga.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold">{manga.name}</h1>
              {favLoaded && (
                <button
                  onClick={() =>
                    toggleFavorite({
                      mangaId: manga.id,
                      mangaName: manga.name,
                      mangaCover: manga.cover,
                    })
                  }
                  className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isFavorite(manga.id)
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  {isFavorite(manga.id) ? '已收藏' : '收藏'}
                </button>
              )}
            </div>

            <div className="mt-4 space-y-2 text-gray-300">
              <p>
                <span className="text-gray-500">作者：</span>
                {manga.author}
              </p>
              <p>
                <span className="text-gray-500">狀態：</span>
                {manga.status}
              </p>
              {manga.lastUpdate && (
                <p>
                  <span className="text-gray-500">更新：</span>
                  {manga.lastUpdate}
                </p>
              )}
            </div>

            {/* Genres */}
            {manga.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {manga.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-gray-800 px-3 py-1 text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {manga.description && (
              <p className="mt-6 text-gray-400">{manga.description}</p>
            )}
          </div>
        </div>

        {/* Chapters */}
        <div className="mt-12">
          <h2 className="text-xl font-bold">章節列表</h2>

          {manga.chapters.length === 0 ? (
            <p className="mt-4 text-gray-500">沒有章節</p>
          ) : (
            manga.chapters.map((group, groupIndex) => (
              <div key={groupIndex} className="mt-6">
                <h3 className="mb-3 text-lg font-medium text-gray-300">
                  {group.title}
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {group.chapters.map((chapter) => (
                    <Link
                      key={chapter.id}
                      href={`/read/${id}/${chapter.id}`}
                      className="rounded bg-gray-800 px-3 py-2 text-center text-sm hover:bg-gray-700"
                    >
                      {chapter.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
