'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { MangaListItem } from '@/lib/scraper/types';

interface MangaCardProps {
  manga: MangaListItem;
}

export default function MangaCard({ manga }: MangaCardProps) {
  // 使用代理獲取封面
  const coverUrl = manga.cover
    ? `/api/image?url=${encodeURIComponent(manga.cover)}`
    : '/placeholder.jpg';

  return (
    <Link href={`/manga/${manga.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-800">
        <Image
          src={coverUrl}
          alt={manga.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          unoptimized
        />
        {manga.score && (
          <div className="absolute right-1 top-1 rounded bg-yellow-500 px-1.5 py-0.5 text-xs font-bold text-black">
            {manga.score}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <p className="truncate text-xs text-gray-300">{manga.latestChapter}</p>
        </div>
      </div>
      <h3 className="mt-2 truncate text-sm font-medium text-white group-hover:text-blue-400">
        {manga.name}
      </h3>
    </Link>
  );
}
