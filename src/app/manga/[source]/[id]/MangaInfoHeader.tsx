import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { MangaInfo } from '@/lib/scraper/types';
import { GENRE_KEYS } from '@/lib/scraper';
import { Star } from 'lucide-react';

interface MangaInfoHeaderProps {
  manga: MangaInfo;
}

/**
 * 漫畫名稱、作者、評分、狀態、分類、描述
 */
export default function MangaInfoHeader({ manga }: MangaInfoHeaderProps) {
  return (
    <>
      <h1 className="text-3xl font-serif font-medium tracking-tight md:text-4xl">{manga.name}</h1>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-muted-foreground md:justify-start">
        {manga.score && (
          <span className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-yellow-400">{manga.score}</span>
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground/60">作者</span>
          <Link
            href={`/?keyword=${encodeURIComponent(manga.author)}`}
            className="text-primary hover:underline"
          >
            {manga.author}
          </Link>
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-muted-foreground md:justify-start">
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground/60">狀態</span>
          <Badge variant={manga.status.includes('完結') ? 'secondary' : 'default'}>
            {manga.status}
          </Badge>
        </span>
        {manga.lastUpdate && (
          <span className="flex items-center gap-1.5">
            <span className="text-muted-foreground/60">更新</span>
            {manga.lastUpdate}
          </span>
        )}
      </div>

      {manga.genres.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
          {manga.genres.map((genre) => {
            const genreKey = GENRE_KEYS[genre];
            return genreKey ? (
              <Link key={genre} href={`/?genre=${genreKey}`}>
                <Badge
                  variant="outline"
                  className="cursor-pointer bg-background/50 backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {genre}
                </Badge>
              </Link>
            ) : (
              <Badge key={genre} variant="outline" className="bg-background/50 backdrop-blur-sm">
                {genre}
              </Badge>
            );
          })}
        </div>
      )}

      {manga.description && (
        <p className="mt-4 line-clamp-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:line-clamp-4">
          {manga.description}
        </p>
      )}
    </>
  );
}
