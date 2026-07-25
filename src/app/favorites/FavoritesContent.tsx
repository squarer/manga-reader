'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
const TiltCard = dynamic(() => import('@/components/TiltCard'), { ssr: false });
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useHistory } from '@/lib/hooks/useHistory';
import { useFavoritesUpdateCheck } from '@/lib/hooks/useFavoritesUpdateCheck';
import { getProxiedImageUrl } from '@/lib/image-utils';
import { STAGGER_DELAY, DENSE_GRID_CLASS } from '@/lib/constants';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';

export default function FavoritesContent() {
  const [editMode, setEditMode] = useState(false);
  const { favorites, isLoaded, removeFavorite } = useFavorites();
  const { history } = useHistory();
  const { newChapterIds } = useFavoritesUpdateCheck(favorites, history, isLoaded);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-8">
        <PageHeader
          icon={Heart}
          title="我的收藏"
          count={isLoaded ? favorites.length : undefined}
          actions={
            isLoaded && favorites.length > 0 ? (
              <Button
                variant={editMode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? '完成' : '管理'}
              </Button>
            ) : undefined
          }
        />

        {!isLoaded ? (
          <Spinner />
        ) : favorites.length === 0 ? (
          <EmptyState icon={Heart} message="尚無收藏" actionLabel="探索漫畫" actionHref="/" />
        ) : (
          <div className={DENSE_GRID_CLASS}>
            {favorites.map((item, index) => (
              <div key={item.mangaId} className="group relative">
                <Link href={`/manga/${item.source}/${item.mangaId}`}>
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
                      {newChapterIds.has(`${item.source}:${item.mangaId}`) && (
                        <div className="absolute left-1 top-1 z-30 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          NEW
                        </div>
                      )}
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
                    removeFavorite(item.source, item.mangaId);
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
