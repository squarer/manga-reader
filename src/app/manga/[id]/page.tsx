'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/animate-ui/components/buttons/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import type { MangaInfo, ChapterGroup } from '@/lib/scraper/types';
import { useFavorites } from '@/lib/hooks/useFavorites';

/**
 * 章節分組顯示元件（支援分 tab）
 */
function ChapterGroupDisplay({
  group,
  mangaId,
}: {
  group: ChapterGroup;
  mangaId: string;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const THRESHOLD = 100; // 超過 100 章節就分 tab
  const TAB_COUNT = 5; // 分成 5 個 tab

  // 判斷是否需要分 tab
  const needTabs = group.chapters.length > THRESHOLD;
  const chapterPerTab = Math.ceil(group.chapters.length / TAB_COUNT);

  // 計算當前 tab 要顯示的章節
  const displayChapters = needTabs
    ? group.chapters.slice(
        activeTab * chapterPerTab,
        (activeTab + 1) * chapterPerTab
      )
    : group.chapters;

  // 生成 tab 標籤
  const tabs = needTabs
    ? Array.from({ length: TAB_COUNT }, (_, i) => {
        const start = i * chapterPerTab;
        const end = Math.min((i + 1) * chapterPerTab, group.chapters.length);
        const startChapter = group.chapters[start];
        const endChapter = group.chapters[end - 1];
        return {
          label: `${startChapter.name} - ${endChapter.name}`,
          count: end - start,
        };
      })
    : [];

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-lg font-medium text-gray-300">
        {group.title}
        <span className="ml-2 text-sm text-gray-500">
          ({group.chapters.length} 章)
        </span>
      </h3>

      {/* Tab 切換 */}
      {needTabs && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex-shrink-0 rounded px-4 py-2 text-sm transition-colors ${
                activeTab === i
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div>{tab.label}</div>
              <div className="text-xs opacity-75">({tab.count} 章)</div>
            </button>
          ))}
        </div>
      )}

      {/* 章節列表 */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {displayChapters.map((chapter) => (
          <Link
            key={chapter.id}
            href={`/read/${mangaId}/${chapter.id}`}
            className="rounded bg-gray-800 px-3 py-2 text-center text-sm hover:bg-gray-700"
          >
            {chapter.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

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
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <Skeleton className="h-5 w-24" />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col gap-8 md:flex-row">
            <Skeleton className="h-80 w-60 flex-shrink-0 rounded-lg" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="text-xl text-destructive">{error || '載入失敗'}</div>
        <Button asChild variant="link">
          <Link href="/">返回首頁</Link>
        </Button>
      </div>
    );
  }

  const coverUrl = manga.cover
    ? `/api/image?url=${encodeURIComponent(manga.cover)}`
    : '/placeholder.jpg';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Button asChild variant="link" className="p-0">
            <Link href="/">← 返回首頁</Link>
          </Button>
        </div>
      </header>

      {/* Manga Info */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Cover */}
          <div className="flex-shrink-0">
            <Card className="overflow-hidden border-0">
              <CardContent className="p-0">
                <div className="relative h-80 w-60 overflow-hidden rounded-lg">
                  <Image
                    src={coverUrl}
                    alt={manga.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold">{manga.name}</h1>
              {favLoaded && (
                <Button
                  onClick={() =>
                    toggleFavorite({
                      mangaId: manga.id,
                      mangaName: manga.name,
                      mangaCover: manga.cover,
                    })
                  }
                  variant={isFavorite(manga.id) ? 'destructive' : 'secondary'}
                  className="flex-shrink-0"
                >
                  {isFavorite(manga.id) ? '已收藏' : '收藏'}
                </Button>
              )}
            </div>

            <div className="mt-4 space-y-2 text-muted-foreground">
              <p>
                <span className="text-muted-foreground/60">作者：</span>
                {manga.author}
              </p>
              <p>
                <span className="text-muted-foreground/60">狀態：</span>
                {manga.status}
              </p>
              {manga.lastUpdate && (
                <p>
                  <span className="text-muted-foreground/60">更新：</span>
                  {manga.lastUpdate}
                </p>
              )}
            </div>

            {/* Genres */}
            {manga.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {manga.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            {manga.description && (
              <p className="mt-6 text-muted-foreground">{manga.description}</p>
            )}
          </div>
        </div>

        {/* Chapters */}
        <div className="mt-12">
          <h2 className="text-xl font-bold">章節列表</h2>

          {manga.chapters.length === 0 ? (
            <p className="mt-4 text-muted-foreground">沒有章節</p>
          ) : (
            manga.chapters.map((group, groupIndex) => (
              <ChapterGroupDisplay
                key={groupIndex}
                group={group}
                mangaId={id}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
