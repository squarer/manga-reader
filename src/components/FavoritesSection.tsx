'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useFavorites } from '@/lib/hooks/useFavorites';

export default function FavoritesSection() {
  const { favorites, isLoaded } = useFavorites();

  if (!isLoaded || favorites.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-bold">我的收藏</h2>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {favorites.map((item) => (
          <Link
            key={item.mangaId}
            href={`/manga/${item.mangaId}`}
            className="group flex-shrink-0"
          >
            <div className="relative h-32 w-24 overflow-hidden rounded-lg bg-gray-800">
              <Image
                src={`/api/image?url=${encodeURIComponent(item.mangaCover)}`}
                alt={item.mangaName}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized
              />
            </div>
            <p className="mt-1 w-24 truncate text-xs text-gray-300 group-hover:text-blue-400">
              {item.mangaName}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
