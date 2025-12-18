'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import TiltCard from '@/components/TiltCard';
import { useHistory } from '@/lib/hooks/useHistory';

/** 交錯動畫延遲（毫秒） */
const STAGGER_DELAY = 30;

export default function HistorySection() {
  const { history, isLoaded, clearHistory } = useHistory();

  if (!isLoaded || history.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">最近閱讀</h2>
        <Button variant="ghost" size="sm" onClick={clearHistory}>
          清除歷史
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {history.slice(0, 10).map((item, index) => (
            <Link
              key={`${item.mangaId}-${item.chapterId}`}
              href={`/read/${item.mangaId}/${item.chapterId}${item.page > 0 ? `?page=${item.page + 1}` : ''}`}
              className="group w-24 flex-shrink-0"
            >
              {/* 3D 傾斜效果只作用於圖片區域 */}
              <TiltCard
                animationDelay={index * STAGGER_DELAY}
                className="aspect-[3/4] w-full overflow-hidden rounded-lg"
              >
                <div className="relative h-full w-full bg-muted">
                  <Image
                    src={`/api/image?url=${encodeURIComponent(item.mangaCover)}`}
                    alt={item.mangaName}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="truncate text-xs text-white/80">
                      {item.chapterName}
                    </p>
                  </div>
                </div>
              </TiltCard>

              {/* 標題：背景透明，hover 時變色 */}
              <p className="mt-1 truncate text-xs text-muted-foreground transition-colors group-hover:text-primary">
                {item.mangaName}
              </p>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
