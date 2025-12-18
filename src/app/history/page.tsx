'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import TiltCard from '@/components/TiltCard';
import { useHistory } from '@/lib/hooks/useHistory';

/** 交錯動畫延遲（毫秒） */
const STAGGER_DELAY = 30;

export default function HistoryPage() {
  const { history, isLoaded, removeHistory, clearHistory } = useHistory();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">閱讀歷史</h1>
            {isLoaded && history.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({history.length} 部)
              </span>
            )}
          </div>
          {isLoaded && history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearHistory}>
              清除全部
            </Button>
          )}
        </div>

        {!isLoaded ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <Clock className="h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground">尚無閱讀記錄</p>
            <Button asChild variant="outline">
              <Link href="/">探索漫畫</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {history.map((item, index) => (
              <div key={`${item.mangaId}-${item.chapterId}`} className="group relative">
                <Link
                  href={`/read/${item.mangaId}/${item.chapterId}${item.page > 0 ? `?page=${item.page + 1}` : ''}`}
                >
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
                  <p className="mt-1 truncate text-xs text-muted-foreground transition-colors group-hover:text-primary">
                    {item.mangaName}
                  </p>
                </Link>

                {/* 移除按鈕 */}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    removeHistory(item.mangaId);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
