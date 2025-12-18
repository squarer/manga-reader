'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MangaListItem } from '@/lib/scraper/types';

interface MangaCardProps {
  manga: MangaListItem;
}

export default function MangaCard({ manga }: MangaCardProps) {
  const coverUrl = manga.cover
    ? `/api/image?url=${encodeURIComponent(manga.cover)}`
    : '/placeholder.jpg';

  return (
    <Link href={`/manga/${manga.id}`} className="group block">
      <Card className="overflow-hidden border-0 bg-transparent">
        <CardContent className="p-0">
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
            <Image
              src={coverUrl}
              alt={manga.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              unoptimized
            />
            {manga.score && (
              <Badge className="absolute right-1 top-1 bg-yellow-500 text-black hover:bg-yellow-500">
                {manga.score}
              </Badge>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="truncate text-xs text-muted-foreground">
                {manga.latestChapter}
              </p>
            </div>
          </div>
          <h3 className="mt-2 truncate text-sm font-medium text-foreground group-hover:text-primary">
            {manga.name}
          </h3>
        </CardContent>
      </Card>
    </Link>
  );
}
