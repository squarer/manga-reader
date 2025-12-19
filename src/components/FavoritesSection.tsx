'use client';

import { useMemo } from 'react';
import { useFavorites } from '@/lib/hooks/useFavorites';
import StackedCardList, { type StackedCardItem } from './StackedCardList';

export default function FavoritesSection() {
  const { favorites, isLoaded } = useFavorites();

  const items: StackedCardItem[] = useMemo(
    () =>
      favorites.map((item) => ({
        id: String(item.mangaId),
        href: `/manga/${item.mangaId}`,
        cover: `/api/image?url=${encodeURIComponent(item.mangaCover)}`,
        title: item.mangaName,
      })),
    [favorites]
  );

  if (!isLoaded || items.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-bold">我的收藏</h2>
      <StackedCardList items={items} />
    </section>
  );
}
