'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TiltCard from '@/components/TiltCard';
import { useFavorites } from '@/lib/hooks/useFavorites';

/** 交錯動畫延遲（毫秒） */
const STAGGER_DELAY = 30;

export default function FavoritesPage() {
  const { favorites, isLoaded, removeFavorite } = useFavorites();

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Heart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">我的收藏</h1>
          {isLoaded && favorites.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({favorites.length} 部)
            </span>
          )}
        </div>

        {!isLoaded ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <Heart className="h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground">尚無收藏</p>
            <Button asChild variant="outline">
              <Link href="/">探索漫畫</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {favorites.map((item, index) => (
              <div key={item.mangaId} className="group relative">
                <Link href={`/manga/${item.mangaId}`}>
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
                    removeFavorite(item.mangaId);
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
