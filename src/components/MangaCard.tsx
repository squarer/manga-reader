'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock } from 'lucide-react';
import TiltCard from '@/components/TiltCard';
import type { MangaListItem } from '@/lib/scraper/types';
import { getProxiedImageUrl } from '@/lib/image-utils';

interface MangaCardProps {
  /** 漫畫資料 */
  manga: MangaListItem;
  /** 動畫延遲（毫秒），用於交錯進場 */
  animationDelay?: number;
}

/**
 * 漫畫卡片元件
 * 精緻暗色風格，支援 3D 傾斜效果、微光邊框和滑入動畫
 */
export default function MangaCard({ manga, animationDelay = 0 }: MangaCardProps) {
  const coverUrl = getProxiedImageUrl(manga.cover);

  return (
    <Link
      href={`/manga/${manga.id}`}
      className="group block outline-none"
      aria-label={`閱讀 ${manga.name}，最新章節：${manga.latestChapter}`}
    >
      {/* 卡片容器：微光邊框效果 */}
      <div className="relative rounded-xl p-[1px] transition-all duration-300 bg-gradient-to-br from-border/50 via-border/20 to-border/50 group-hover:from-primary/60 group-hover:via-primary/30 group-hover:to-primary/60 group-focus-visible:from-primary/60 group-focus-visible:via-primary/30 group-focus-visible:to-primary/60 group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background">
        {/* 3D 傾斜效果 */}
        <TiltCard animationDelay={animationDelay} className="aspect-[3/4] overflow-hidden rounded-[11px]">
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

            {/* 評分標籤 */}
            {manga.score && (
              <div className="absolute right-2 top-2 z-30 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 backdrop-blur-sm">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400">
                  {manga.score}
                </span>
              </div>
            )}

            {/* 底部漸層遮罩 + 資訊區 */}
            <div className="absolute inset-x-0 bottom-0 z-20 translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
              {/* 漸層背景 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

              {/* 資訊內容 */}
              <div className="relative space-y-1.5 p-3 pt-8">
                {/* 最新章節 */}
                <p className="truncate text-sm font-medium text-white">
                  {manga.latestChapter}
                </p>

                {/* 更新時間 */}
                {manga.updateTime && (
                  <div className="flex items-center gap-1 text-white/60">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">{manga.updateTime}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 預設顯示的漸層（hover 前） */}
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-3 transition-opacity duration-300 group-hover:opacity-0">
              <p className="truncate text-xs text-white/80">
                {manga.latestChapter}
              </p>
            </div>
          </div>
        </TiltCard>
      </div>

      {/* 標題 */}
      <h3 className="mt-3 truncate text-sm font-medium text-foreground/90 transition-colors duration-200 group-hover:text-primary group-focus-visible:text-primary">
        {manga.name}
      </h3>
    </Link>
  );
}
