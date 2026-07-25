'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
const TiltCard = dynamic(() => import('@/components/TiltCard'), { ssr: false });
import { useHistory } from '@/lib/hooks/useHistory';
import { getProxiedImageUrl } from '@/lib/image-utils';
import { STAGGER_DELAY, DENSE_GRID_CLASS } from '@/lib/constants';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';

export default function HistoryContent() {
  const [editMode, setEditMode] = useState(false);
  const { history, isLoaded, removeHistory, clearHistory } = useHistory();

  // 每部漫畫只顯示最新一筆（history 已按 timestamp desc 排序）
  const deduped = useMemo(() => {
    const seen = new Set<string>();
    return history.filter((item) => {
      const key = `${item.source}:${item.mangaId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [history]);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-8">
        <PageHeader
          icon={Clock}
          title="閱讀歷史"
          count={isLoaded ? deduped.length : undefined}
          actions={
            isLoaded && deduped.length > 0 ? (
              <>
                <Button
                  variant={editMode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? '完成' : '管理'}
                </Button>
                <Button variant="ghost" size="sm" onClick={clearHistory}>
                  清除全部
                </Button>
              </>
            ) : undefined
          }
        />

        {!isLoaded ? (
          <Spinner />
        ) : deduped.length === 0 ? (
          <EmptyState icon={Clock} message="尚無閱讀記錄" actionLabel="探索漫畫" actionHref="/" />
        ) : (
          <div className={DENSE_GRID_CLASS}>
            {deduped.map((item, index) => (
              <div key={`${item.mangaId}-${item.chapterId}`} className="group relative">
                <Link
                  href={`/read/${item.source}/${item.mangaId}/${item.chapterId}${item.page > 0 ? `?page=${item.page + 1}` : ''}`}
                >
                  <TiltCard
                    animationDelay={index * STAGGER_DELAY}
                    className="aspect-[3/4] w-full overflow-hidden rounded-lg"
                  >
                    <div className="relative h-full w-full bg-muted">
                      <Image
                        src={getProxiedImageUrl(item.mangaCover)}
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
                  className={cn(
                    'absolute right-1 top-1 h-7 w-7 transition-opacity',
                    editMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    removeHistory(item.source, item.mangaId);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
  );
}
