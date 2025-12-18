'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TiltCard from '@/components/TiltCard';
import type { MangaListItem } from '@/lib/scraper/types';

interface MangaCardProps {
  /** 漫畫資料 */
  manga: MangaListItem;
  /** 動畫延遲（毫秒），用於交錯進場 */
  animationDelay?: number;
}

/**
 * 漫畫卡片元件
 * 支援 3D 傾斜效果、光暈和交錯進場動畫
 */
export default function MangaCard({ manga, animationDelay = 0 }: MangaCardProps) {
  const coverUrl = manga.cover
    ? `/api/image?url=${encodeURIComponent(manga.cover)}`
    : '/placeholder.jpg';

  return (
    <Link href={`/manga/${manga.id}`} className="group block">
      <TiltCard animationDelay={animationDelay}>
        <Card className="overflow-hidden border-0 bg-transparent">
          <CardContent className="p-0">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
              <Image
                src={coverUrl}
                alt={manga.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                unoptimized
              />

              {manga.score && (
                <Badge className="absolute right-1 top-1 z-30 bg-yellow-500 text-black shadow-lg hover:bg-yellow-500">
                  {manga.score}
                </Badge>
              )}

              <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="truncate text-xs text-white/80">
                  {manga.latestChapter}
                </p>
              </div>
            </div>

            <h3 className="mt-2 truncate text-sm font-medium text-foreground transition-colors duration-200 group-hover:text-primary">
              {manga.name}
            </h3>
          </CardContent>
        </Card>
      </TiltCard>
    </Link>
  );
}
