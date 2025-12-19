'use client';

import { useMemo } from 'react';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { getProxiedImageUrl } from '@/lib/image-utils';
import { MAX_STACKED_CARDS } from '@/lib/constants';
import StackedCardList, { type StackedCardItem } from './StackedCardList';

export default function FavoritesSection() {
  const { favorites, isLoaded } = useFavorites();

  const items: StackedCardItem[] = useMemo(
    () =>
      favorites.slice(0, MAX_STACKED_CARDS).map((item) => ({
        id: String(item.mangaId),
        href: `/manga/${item.mangaId}`,
        cover: getProxiedImageUrl(item.mangaCover),
        title: item.mangaName,
      })),
    [favorites]
  );

  if (!isLoaded || items.length === 0) {
    return null;
  }

  return <StackedCardList items={items} title="我的收藏" />;
}
