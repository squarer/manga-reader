'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock } from 'lucide-react';
import TiltCard from '@/components/TiltCard';
import type { MangaListItem } from '@/lib/scraper/types';
import { getProxiedImageUrl } from '@/lib/image-utils';
import { SOURCE_LABELS } from '@/components/SourceProvider';

interface MangaCardProps {
  /** 漫畫資料 */
  manga: MangaListItem;
  /** 動畫延遲（毫秒），用於交錯進場 */
  animationDelay?: number;
  /**
   * 是否顯示來源徽章（預設 false）
   * 聚合搜尋結果傳 true，單一來源瀏覽不傳（徽章冗餘）
   */
  showSourceBadge?: boolean;
}

/**
 * 漫畫卡片元件
 * 精緻暗色風格，支援 3D 傾斜效果、微光邊框和滑入動畫
 */
const MangaCard = memo(function MangaCard({ manga, animationDelay = 0, showSourceBadge = false }: MangaCardProps) {
  const coverUrl = getProxiedImageUrl(manga.cover);

  return (
    <Link
      href={`/manga/${manga.source}/${manga.id}`}
      className="group block outline-none"
      aria-label={`閱讀 ${manga.name}，最新章節：${manga.latestChapter}`}
    >
      {/* 卡片容器：ring 邊框效果 */}
      <div className="relative rounded-xl transition-all duration-300 ring-1 ring-border/30 group-hover:ring-primary/50 group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background">
        {/* 3D 傾斜效果 */}
        <TiltCard animationDelay={animationDelay} className="aspect-[3/4] overflow-hidden rounded-xl">
          <div className="relative h-full w-full overflow-hidden">
            {/* 封面圖片 */}
            <Image
              src={coverUrl}
              alt={`${manga.name} 封面`}
              fill
              className="object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              loading="lazy"
              unoptimized
            />

            {/* 來源徽章（聚合搜尋模式） */}
            {showSourceBadge && (
              <div className="absolute left-2 top-2 z-30 rounded-full bg-black/70 px-2 py-0.5 backdrop-blur-sm">
                <span className="text-[10px] font-medium text-white/90">
                  {SOURCE_LABELS[manga.source]}
                </span>
              </div>
            )}

            {/* 評分標籤 */}
            {manga.score && (
              <div className="absolute right-2 top-2 z-30 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 backdrop-blur-sm">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400">
                  {manga.score}
                </span>
              </div>
            )}

            {/* 底部資訊 — 章節名永遠可見，更新時間 hover 展開 */}
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3 pt-8">
              <p className="truncate text-sm font-medium text-white">
                {manga.latestChapter}
              </p>
              {manga.updateTime && (
                <div className="flex items-center gap-1 text-white/60 max-h-0 overflow-hidden transition-all duration-300 group-hover:max-h-8 group-hover:mt-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">{manga.updateTime}</span>
                </div>
              )}
            </div>
          </div>
        </TiltCard>
      </div>

      {/* 標題 */}
      <h3 className="mt-3 truncate text-sm font-serif font-medium text-foreground/90 transition-colors duration-200 group-hover:text-primary group-focus-visible:text-primary">
        {manga.name}
      </h3>
    </Link>
  );
});

export default MangaCard;
