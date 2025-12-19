'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import TiltCard from '@/components/TiltCard';
import type { MangaListItem, PaginationInfo } from '@/lib/scraper/types';
import { getProxiedImageUrl } from '@/lib/image-utils';
import { STAGGER_DELAY } from '@/lib/constants';

/** 日期分組類型 */
enum DateGroup {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  EARLIER = 'earlier',
}

/** 分組顯示配置 */
const DATE_GROUP_CONFIG = {
  [DateGroup.TODAY]: { label: '今日更新', icon: Clock },
  [DateGroup.YESTERDAY]: { label: '昨日更新', icon: Calendar },
  [DateGroup.EARLIER]: { label: '更早更新', icon: Calendar },
} as const;


/**
 * 判斷日期屬於哪個分組
 */
function getDateGroup(dateStr: string): DateGroup {
  if (!dateStr) return DateGroup.EARLIER;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const date = new Date(dateStr);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (dateOnly.getTime() === today.getTime()) {
    return DateGroup.TODAY;
  }
  if (dateOnly.getTime() === yesterday.getTime()) {
    return DateGroup.YESTERDAY;
  }
  return DateGroup.EARLIER;
}

/**
 * 格式化更新時間顯示
 */
function formatUpdateTime(dateStr: string): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return '剛剛';
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return dateStr;
}

/**
 * 將漫畫列表按日期分組
 */
function groupMangasByDate(mangas: MangaListItem[]): Map<DateGroup, MangaListItem[]> {
  const groups = new Map<DateGroup, MangaListItem[]>([
    [DateGroup.TODAY, []],
    [DateGroup.YESTERDAY, []],
    [DateGroup.EARLIER, []],
  ]);

  mangas.forEach((manga) => {
    const group = getDateGroup(manga.updateTime);
    groups.get(group)?.push(manga);
  });

  return groups;
}

/**
 * 更新漫畫卡片元件
 */
function UpdateMangaCard({
  manga,
  animationDelay,
}: {
  manga: MangaListItem;
  animationDelay: number;
}) {
  const coverUrl = getProxiedImageUrl(manga.cover);

  return (
    <Link href={`/manga/${manga.id}`} className="group block">
      <TiltCard animationDelay={animationDelay} className="aspect-[3/4] overflow-hidden rounded-lg">
        <div className="relative h-full w-full bg-muted">
          <Image
            src={coverUrl}
            alt={manga.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 15vw"
            unoptimized
          />

          {manga.score && (
            <Badge className="absolute right-1 top-1 z-30 bg-yellow-500 text-black shadow-lg hover:bg-yellow-500">
              {manga.score}
            </Badge>
          )}

          <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 pt-8">
            <p className="truncate text-xs font-medium text-white">
              {manga.latestChapter}
            </p>
            {manga.updateTime && (
              <p className="mt-0.5 truncate text-[10px] text-white/60">
                {formatUpdateTime(manga.updateTime)}
              </p>
            )}
          </div>
        </div>
      </TiltCard>

      <h3 className="mt-2 truncate text-sm font-medium text-foreground transition-colors duration-200 group-hover:text-primary">
        {manga.name}
      </h3>
    </Link>
  );
}

/**
 * 日期分組區塊元件
 */
function DateGroupSection({
  group,
  mangas,
  baseIndex,
}: {
  group: DateGroup;
  mangas: MangaListItem[];
  baseIndex: number;
}) {
  if (mangas.length === 0) return null;

  const config = DATE_GROUP_CONFIG[group];
  const Icon = config.icon;

  return (
    <section className="mb-10">
      {/* 時間線標題 */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{config.label}</h2>
          <p className="text-sm text-muted-foreground">{mangas.length} 部漫畫</p>
        </div>
        {/* 時間線裝飾 */}
        <div className="ml-4 h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>

      {/* 漫畫網格 */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {mangas.map((manga, index) => (
          <UpdateMangaCard
            key={manga.id}
            manga={manga}
            animationDelay={(baseIndex + index) * STAGGER_DELAY}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * 載入中骨架元件
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-10">
      {[0, 1].map((groupIndex) => (
        <section key={groupIndex} className="mb-10">
          <div className="mb-6 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-1 h-4 w-16" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * 最新更新頁面
 */
export default function UpdatePage() {
  const [mangas, setMangas] = useState<MangaListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loaderRef = useRef<HTMLDivElement>(null);

  /**
   * 載入漫畫資料
   */
  const fetchMangas = useCallback(
    async (pageNum: number, append = false, signal?: AbortSignal) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await fetch(`/api/manga/update?page=${pageNum}`, { signal });
        const json = await res.json();

        if (json.success) {
          setMangas((prev) =>
            append ? [...prev, ...json.data.items] : json.data.items
          );
          setPagination(json.data.pagination);
        } else {
          setError(json.error || '載入失敗');
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // 請求被取消，不處理
        }
        console.error('Failed to fetch updates:', err);
        setError('無法連接伺服器');
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    []
  );

  // 初始載入（使用 AbortController 防止 Strict Mode 重複請求）
  useEffect(() => {
    const abortController = new AbortController();
    fetchMangas(1, false, abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchMangas]);

  // 無限滾動 Intersection Observer
  useEffect(() => {
    if (!loaderRef.current || loading || loadingMore) return;
    if (pagination && page >= pagination.total) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchMangas(nextPage, true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [page, pagination, loading, loadingMore, fetchMangas]);

  // 按日期分組
  const groupedMangas = groupMangasByDate(mangas);
  let runningIndex = 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">最新更新</h1>
              <p className="text-sm text-muted-foreground">
                追蹤最新漫畫章節
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <p className="text-lg text-muted-foreground">{error}</p>
            <Button onClick={() => fetchMangas(1, false)}>重試</Button>
          </div>
        ) : mangas.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-lg text-muted-foreground">沒有更新資料</p>
          </div>
        ) : (
          <>
            {/* 日期分組列表 */}
            {[DateGroup.TODAY, DateGroup.YESTERDAY, DateGroup.EARLIER].map((group) => {
              const groupMangas = groupedMangas.get(group) || [];
              const section = (
                <DateGroupSection
                  key={group}
                  group={group}
                  mangas={groupMangas}
                  baseIndex={runningIndex}
                />
              );
              runningIndex += groupMangas.length;
              return section;
            })}

            {/* 無限滾動觸發器 */}
            <div ref={loaderRef} className="flex h-20 items-center justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>載入更多...</span>
                </div>
              )}
              {pagination && page >= pagination.total && mangas.length > 0 && (
                <p className="text-sm text-muted-foreground">已載入全部更新</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
