'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { MangaInfo } from '@/lib/scraper/types';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useHistory } from '@/lib/hooks/useHistory';
import { useFetch } from '@/lib/hooks/useFetch';
import { ArrowLeft } from 'lucide-react';
import TiltCard from '@/components/TiltCard';
import { getProxiedImageUrl, toCoverRelativePath } from '@/lib/image-utils';
import ChapterGroupDisplay from './ChapterGroupDisplay';
import MangaInfoHeader from './MangaInfoHeader';
import MangaActions from './MangaActions';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
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
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}

interface MangaDetailContentProps {
  id: string;
  /** Server Component 預取資料，有值時略過 Client fetch */
  initialData?: MangaInfo | null;
}

/**
 * 漫畫詳情頁內容（Client Component）
 */
export default function MangaDetailContent({ id, initialData }: MangaDetailContentProps) {
  const { data: manga, loading, error } = useFetch<MangaInfo>(
    initialData ? null : `/api/manga/${id}`,
    [id],
    { initialData }
  );
  const { isFavorite, toggleFavorite, isLoaded: favLoaded } = useFavorites();
  const { history, isLoaded: historyLoaded } = useHistory();

  const readChapterIds = useMemo(() => {
    if (!historyLoaded || !manga) return new Set<number>();
    return new Set(history.filter((h) => h.mangaId === manga.id).map((h) => h.chapterId));
  }, [history, historyLoaded, manga]);

  const currentMangaHistory = useMemo(
    () => (historyLoaded && manga ? history.find((h) => h.mangaId === manga.id) : undefined),
    [history, historyLoaded, manga]
  );

  const firstChapter = useMemo(() => {
    if (!manga || manga.chapters.length === 0) return null;
    const firstGroup = manga.chapters[0];
    return firstGroup.chapters.length > 0 ? firstGroup.chapters[0] : null;
  }, [manga]);

  if (loading) return <LoadingSkeleton />;

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

  const coverUrl = getProxiedImageUrl(manga.cover);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero 區域 - 負 margin 讓背景延伸到 navbar 後方 */}
      <div className="relative -mt-20 min-h-[60vh] overflow-hidden pt-20">
        <div className="absolute inset-0 -top-20">
          <Image
            src={coverUrl}
            alt=""
            fill
            className="object-cover blur-2xl brightness-50 saturate-150"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              返回首頁
            </Link>
          </Button>
        </div>

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 pb-12 pt-8 md:flex-row md:items-start md:pt-12">
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

          <div className="flex-1 text-center md:text-left">
            <MangaInfoHeader manga={manga} />
            <MangaActions
              id={id}
              currentMangaHistory={currentMangaHistory}
              firstChapter={firstChapter}
              historyLoaded={historyLoaded}
              favLoaded={favLoaded}
              isFavorited={isFavorite(manga.id)}
              onToggleFavorite={() =>
                toggleFavorite({
                  mangaId: manga.id,
                  mangaName: manga.name,
                  mangaCover: toCoverRelativePath(manga.cover),
                })
              }
            />
          </div>
        </div>
      </div>

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
    </div>
  );
}
