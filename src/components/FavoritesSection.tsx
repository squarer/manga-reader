'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useFavorites } from '@/lib/hooks/useFavorites';

export default function FavoritesSection() {
  const { favorites, isLoaded } = useFavorites();

  if (!isLoaded || favorites.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-bold">我的收藏</h2>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {favorites.map((item) => (
            <Link
              key={item.mangaId}
              href={`/manga/${item.mangaId}`}
              className="group flex-shrink-0"
            >
              <Card className="overflow-hidden border-0 bg-transparent">
                <CardContent className="p-0">
                  <div className="relative h-32 w-24 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={`/api/image?url=${encodeURIComponent(item.mangaCover)}`}
                      alt={item.mangaName}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                  <p className="mt-1 w-24 truncate text-xs text-muted-foreground group-hover:text-primary">
                    {item.mangaName}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
