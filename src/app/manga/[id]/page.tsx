'use client';

import { useState, useEffect, use, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { MangaInfo, ChapterGroup } from '@/lib/scraper/types';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useHistory, type HistoryItem } from '@/lib/hooks/useHistory';
import {
  Heart,
  Play,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowLeft,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TiltCard from '@/components/TiltCard';

/**
 * 章節分組顯示元件（支援分 tab、可折疊、已讀標記）
 */
function ChapterGroupDisplay({
  group,
  mangaId,
  readChapterIds,
  defaultOpen = true,
}: {
  group: ChapterGroup;
  mangaId: string;
  readChapterIds: Set<number>;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState(0);
  const THRESHOLD = 100;
  const TAB_COUNT = 5;

  const needTabs = group.chapters.length > THRESHOLD;
  const chapterPerTab = Math.ceil(group.chapters.length / TAB_COUNT);

  const displayChapters = needTabs
    ? group.chapters.slice(
        activeTab * chapterPerTab,
        (activeTab + 1) * chapterPerTab
      )
    : group.chapters;

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

  const readCount = group.chapters.filter((ch) =>
    readChapterIds.has(ch.id)
  ).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium">{group.title}</h3>
            <span className="text-sm text-muted-foreground">
              {readCount > 0 && (
                <span className="text-primary">{readCount} / </span>
              )}
              {group.chapters.length} 章
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-4">
        {/* Tab 切換 */}
        {needTabs && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab, i) => (
              <Button
                key={i}
                onClick={() => setActiveTab(i)}
                variant={activeTab === i ? 'default' : 'outline'}
                size="sm"
                className="flex-shrink-0"
              >
                <div>{tab.label}</div>
                <div className="text-xs opacity-75">({tab.count} 章)</div>
              </Button>
            ))}
          </div>
        )}

        {/* 章節網格 */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {displayChapters.map((chapter) => {
            const isRead = readChapterIds.has(chapter.id);
            return (
              <Button
                key={chapter.id}
                asChild
                variant={isRead ? 'outline' : 'secondary'}
                size="sm"
                className={cn(
                  'relative',
                  isRead && 'border-primary/30 text-muted-foreground'
                )}
              >
                <Link href={`/read/${mangaId}/${chapter.id}`}>
                  {isRead && (
                    <Check className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-primary p-0.5 text-primary-foreground" />
                  )}
                  {chapter.name}
                </Link>
              </Button>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * 收藏按鈕（帶心跳動畫）
 */
function FavoriteButton({
  isFavorited,
  onClick,
}: {
  isFavorited: boolean;
  onClick: () => void;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (!isFavorited) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
    onClick();
  };

  return (
    <Button
      onClick={handleClick}
      variant={isFavorited ? 'default' : 'outline'}
      size="lg"
      className={cn(
        'gap-2 transition-all',
        isFavorited && 'bg-red-500 hover:bg-red-600'
      )}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-transform',
          isFavorited && 'fill-current',
          isAnimating && 'animate-heartbeat'
        )}
      />
      {isFavorited ? '已收藏' : '收藏'}
    </Button>
  );
}

/**
 * Loading 骨架屏
 */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero 骨架 */}
      <div className="relative h-[60vh] min-h-[500px]">
        <div className="absolute inset-0 bg-muted" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col items-center gap-8 px-4 pt-20 md:flex-row md:items-end md:pb-12">
          <Skeleton className="h-72 w-48 flex-shrink-0 rounded-lg md:h-80 md:w-56" />
          <div className="flex-1 space-y-4 pb-8">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* 章節骨架 */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="h-12 w-full rounded-lg" />
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
  const { history, isLoaded: historyLoaded } = useHistory();

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

  // 計算已讀章節 ID Set
  const readChapterIds = useMemo(() => {
    if (!historyLoaded || !manga) return new Set<number>();
    const mangaHistory = history.filter((h) => h.mangaId === manga.id);
    return new Set(mangaHistory.map((h) => h.chapterId));
  }, [history, historyLoaded, manga]);

  // 取得本漫畫的閱讀歷史
  const currentMangaHistory: HistoryItem | undefined = useMemo(() => {
    if (!historyLoaded || !manga) return undefined;
    return history.find((h) => h.mangaId === manga.id);
  }, [history, historyLoaded, manga]);

  // 取得第一章
  const firstChapter = useMemo(() => {
    if (!manga || manga.chapters.length === 0) return null;
    const firstGroup = manga.chapters[0];
    if (firstGroup.chapters.length === 0) return null;
    return firstGroup.chapters[0];
  }, [manga]);

  if (loading) {
    return <LoadingSkeleton />;
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
      {/* Hero 區域 - 負 margin 讓背景延伸到 navbar 後方 */}
      <div className="relative -mt-20 min-h-[60vh] overflow-hidden pt-20">
        {/* 背景封面（模糊） */}
        <div className="absolute inset-0 -top-20">
          <Image
            src={coverUrl}
            alt=""
            fill
            className="object-cover blur-2xl brightness-50 saturate-150"
            unoptimized
            priority
          />
          {/* 漸層遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />
        </div>

        {/* 返回按鈕 */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              返回首頁
            </Link>
          </Button>
        </div>

        {/* 主要內容 */}
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 pb-12 pt-8 md:flex-row md:items-end md:pt-12">
          {/* 封面圖 */}
          <TiltCard className="flex-shrink-0" enableEntrance={false}>
            <div className="relative h-72 w-48 overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10 md:h-80 md:w-56">
              <Image
                src={coverUrl}
                alt={manga.name}
                fill
                className="object-cover"
                unoptimized
                priority
              />
            </div>
          </TiltCard>

          {/* 資訊區 */}
          <div className="flex-1 text-center md:pb-4 md:text-left">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {manga.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-muted-foreground md:justify-start">
              <span className="flex items-center gap-1.5">
                <span className="text-muted-foreground/60">作者</span>
                <Link
                  href={`/?keyword=${encodeURIComponent(manga.author)}`}
                  className="text-primary hover:underline"
                >
                  {manga.author}
                </Link>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-muted-foreground/60">狀態</span>
                <Badge
                  variant={
                    manga.status.includes('完結') ? 'secondary' : 'default'
                  }
                >
                  {manga.status}
                </Badge>
              </span>
              {manga.lastUpdate && (
                <span className="flex items-center gap-1.5">
                  <span className="text-muted-foreground/60">更新</span>
                  {manga.lastUpdate}
                </span>
              )}
            </div>

            {/* 評分 (10 分制) */}
            {manga.score && (
              <div className="mt-3 flex items-center justify-center gap-1.5 md:justify-start">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">
                  {manga.score}
                </span>
              </div>
            )}

            {/* 分類標籤 */}
            {manga.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                {manga.genres.map((genre) => (
                  <Link key={genre} href={`/?genre=${encodeURIComponent(genre)}`}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer bg-background/50 backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      {genre}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* 描述 */}
            {manga.description && (
              <p className="mt-4 line-clamp-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:line-clamp-4">
                {manga.description}
              </p>
            )}

            {/* 操作按鈕 */}
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              {/* 開始/繼續閱讀 */}
              {historyLoaded && currentMangaHistory ? (
                <Button asChild size="lg" className="gap-2">
                  <Link
                    href={`/read/${id}/${currentMangaHistory.chapterId}`}
                  >
                    <BookOpen className="h-5 w-5" />
                    繼續閱讀 {currentMangaHistory.chapterName}
                  </Link>
                </Button>
              ) : firstChapter ? (
                <Button asChild size="lg" className="gap-2">
                  <Link href={`/read/${id}/${firstChapter.id}`}>
                    <Play className="h-5 w-5" />
                    開始閱讀
                  </Link>
                </Button>
              ) : null}

              {/* 收藏按鈕 */}
              {favLoaded && (
                <FavoriteButton
                  isFavorited={isFavorite(manga.id)}
                  onClick={() =>
                    toggleFavorite({
                      mangaId: manga.id,
                      mangaName: manga.name,
                      mangaCover: manga.cover,
                    })
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 章節列表 */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="text-xl font-bold">章節列表</h2>

        {manga.chapters.length === 0 ? (
          <p className="mt-4 text-muted-foreground">沒有章節</p>
        ) : (
          manga.chapters.map((group, groupIndex) => (
            <ChapterGroupDisplay
              key={groupIndex}
              group={group}
              mangaId={id}
              readChapterIds={readChapterIds}
              defaultOpen={groupIndex === 0}
            />
          ))
        )}
      </main>

      {/* 心跳動畫 CSS */}
      <style jsx global>{`
        @keyframes heartbeat {
          0% {
            transform: scale(1);
          }
          14% {
            transform: scale(1.3);
          }
          28% {
            transform: scale(1);
          }
          42% {
            transform: scale(1.3);
          }
          70% {
            transform: scale(1);
          }
        }
        .animate-heartbeat {
          animation: heartbeat 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}
