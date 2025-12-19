'use client';

import { useMemo } from 'react';
import { useFavorites } from '@/lib/hooks/useFavorites';
import StackedCardList, { type StackedCardItem } from './StackedCardList';

/** 最多顯示幾張卡片 */
const MAX_CARDS = 10;

export default function FavoritesSection() {
  const { favorites, isLoaded } = useFavorites();

  const items: StackedCardItem[] = useMemo(
    () =>
      favorites.slice(0, MAX_CARDS).map((item) => ({
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

  return <StackedCardList items={items} title="我的收藏" />;
}
