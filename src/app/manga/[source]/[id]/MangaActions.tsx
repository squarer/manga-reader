'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { ChapterInfo, SourceId } from '@/lib/scraper/types';
import type { HistoryItem } from '@/lib/hooks/useHistory';
import { Heart, Play, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      setTimeout(() => setIsAnimating(false), 1000);
    }
    onClick();
  };

  return (
    <Button
      onClick={handleClick}
      variant={isFavorited ? 'default' : 'outline'}
      size="lg"
      className={cn('gap-2 transition-all', isFavorited && 'bg-red-500 hover:bg-red-600')}
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

interface MangaActionsProps {
  source: SourceId;
  id: string;
  currentMangaHistory: HistoryItem | undefined;
  firstChapter: ChapterInfo | null;
  historyLoaded: boolean;
  favLoaded: boolean;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

/**
 * 漫畫詳情頁操作按鈕（繼續閱讀、開始閱讀、收藏）
 */
export default function MangaActions({
  source,
  id,
  currentMangaHistory,
  firstChapter,
  historyLoaded,
  favLoaded,
  isFavorited,
  onToggleFavorite,
}: MangaActionsProps) {
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
      {historyLoaded && currentMangaHistory ? (
        <Button asChild size="lg" className="gap-2">
          <Link
            href={`/read/${source}/${id}/${currentMangaHistory.chapterId}${currentMangaHistory.page > 0 ? `?page=${currentMangaHistory.page + 1}` : ''}`}
          >
            <BookOpen className="h-5 w-5" />
            繼續閱讀 {currentMangaHistory.chapterName}
          </Link>
        </Button>
      ) : firstChapter ? (
        <Button asChild size="lg" className="gap-2">
          <Link href={`/read/${source}/${id}/${firstChapter.id}`}>
            <Play className="h-5 w-5" />
            開始閱讀
          </Link>
        </Button>
      ) : null}

      {favLoaded && <FavoriteButton isFavorited={isFavorited} onClick={onToggleFavorite} />}
    </div>
  );
}
