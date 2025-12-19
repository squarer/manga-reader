'use client';

import { useMemo } from 'react';
import { useHistory } from '@/lib/hooks/useHistory';
import StackedCardList, { type StackedCardItem } from './StackedCardList';

/** 最多顯示幾張卡片 */
const MAX_CARDS = 10;

export default function HistorySection() {
  const { history, isLoaded, clearHistory } = useHistory();

  const items: StackedCardItem[] = useMemo(
    () =>
      history.slice(0, MAX_CARDS).map((item) => ({
        id: `${item.mangaId}-${item.chapterId}`,
        href: `/read/${item.mangaId}/${item.chapterId}${item.page > 0 ? `?page=${item.page + 1}` : ''}`,
        cover: `/api/image?url=${encodeURIComponent(item.mangaCover)}`,
        title: item.mangaName,
        subtitle: item.chapterName,
      })),
    [history]
  );

  if (!isLoaded || items.length === 0) {
    return null;
  }

  return (
    <StackedCardList
      items={items}
      title="最近閱讀"
      titleExtra={
        <button
          onClick={clearHistory}
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground"
        >
          清除歷史
        </button>
      }
    />
  );
}
