'use client';

import React, { useState, useRef, useEffect, useLayoutEffect, memo } from 'react';
import Image from 'next/image';
import { ArrowUp, ArrowDown, Minus, Eye, Trophy, Crown, Medal } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import type { RankItem } from '@/lib/scraper/types';
import { RankTrend } from '@/lib/scraper/types';
import { getProxiedImageUrl } from '@/lib/image-utils';
import { EmptyState } from '@/components/EmptyState';
import { useSource } from '@/components/SourceProvider';
import { interleave } from '@/lib/utils';

/** 榜單類型 */
enum RankType {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  TOTAL = 'total',
}

/** 榜單類型配置 */
const RANK_TYPES = [
  { id: RankType.DAY, name: '日榜' },
  { id: RankType.WEEK, name: '週榜' },
  { id: RankType.MONTH, name: '月榜' },
  { id: RankType.TOTAL, name: '總榜' },
];


interface RankItemCardProps {
  /** 排行榜項目 */
  item: RankItem;
  /** 動畫延遲（毫秒） */
  animationDelay?: number;
}

/**
 * 格式化瀏覽數
 */
function formatViews(views: number): string {
  if (views >= 10000) {
    return `${(views / 10000).toFixed(1)}萬`;
  }
  return views.toLocaleString();
}

/**
 * 排名徽章元件 - 前三名特殊樣式
 */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg shadow-amber-500/30">
        <Crown className="h-6 w-6 text-white" />
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#b0aea5] to-[#87867f] shadow-lg shadow-[#87867f]/30">
        <Medal className="h-6 w-6 text-white" />
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg shadow-amber-700/30">
        <Trophy className="h-5 w-5 text-white" />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <span className="text-xl font-bold text-muted-foreground">{rank}</span>
    </div>
  );
}

/**
 * 趨勢指示器元件
 */
function TrendIndicator({ trend }: { trend?: RankTrend }) {
  if (!trend) return null;

  const config = {
    [RankTrend.UP]: {
      icon: ArrowUp,
      className: 'text-green-500',
    },
    [RankTrend.DOWN]: {
      icon: ArrowDown,
      className: 'text-red-500',
    },
    [RankTrend.SAME]: {
      icon: Minus,
      className: 'text-muted-foreground',
    },
  };

  const { icon: Icon, className } = config[trend];

  return <Icon className={`h-4 w-4 ${className}`} />;
}

/**
 * 排行榜項目卡片元件
 */
const RankItemCard = memo(function RankItemCard({ item, animationDelay = 0 }: RankItemCardProps) {
  const coverUrl = getProxiedImageUrl(item.cover);

  const isTopThree = item.rank <= 3;

  return (
    <Link
      href={`/manga/${item.source}/${item.id}`}
      className="group block animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div
        className={`flex items-center gap-4 rounded-xl p-4 transition-all duration-300 hover:bg-accent/50 ${
          isTopThree
            ? 'bg-gradient-to-r from-accent/30 to-transparent'
            : 'bg-card/50'
        }`}
      >
        {/* 排名徽章 */}
        <RankBadge rank={item.rank} />

        {/* 封面 */}
        <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image
            src={coverUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="56px"
            unoptimized
          />
        </div>

        {/* 資訊區 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className={`truncate font-serif font-medium transition-colors group-hover:text-primary ${
                isTopThree ? 'text-lg' : 'text-base'
              }`}
            >
              {item.name}
            </h3>
            <TrendIndicator trend={item.trend} />
          </div>

          {item.author && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {item.author}
            </p>
          )}

          <div className="mt-2 flex items-center gap-4 text-sm">
            {item.score && (
              <span className="font-medium text-yellow-500">
                {item.score} 分
              </span>
            )}
            {item.views && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
                {formatViews(item.views)}
              </span>
            )}
          </div>
        </div>

        {/* 最新章節 */}
        <div className="hidden flex-shrink-0 text-right sm:block">
          <p className="text-sm text-muted-foreground">{item.latestChapter}</p>
          <p className="text-xs text-muted-foreground/70">{item.updateTime}</p>
        </div>
      </div>
    </Link>
  );
});

/**
 * 排行榜互動內容
 */
export default function RankContent() {
  const [rankType, setRankType] = useState<RankType>(RankType.DAY);
  const { sources } = useSource();
  const sourcesKey = sources.join(',');
  const isMultiSource = sources.length > 1;

  const [rankList, setRankList] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab 滑動指示器
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // 載入排行榜數據：單站直取；多站各取後交錯合併（無跨站分頁）
  useEffect(() => {
    const abortController = new AbortController();
    setLoading(true);

    (async () => {
      try {
        const results = await Promise.allSettled(
          sources.map((src) =>
            fetch(`/api/rank?type=${rankType}&source=${src}`, { signal: abortController.signal }).then((r) => r.json())
          )
        );
        const lists: RankItem[][] = [];
        results.forEach((res) => {
          if (res.status === 'fulfilled' && res.value.success) {
            lists.push(res.value.data.items as RankItem[]);
          }
        });
        setRankList(interleave(lists));
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Failed to fetch rank:', error);
      } finally {
        if (!abortController.signal.aborted) setLoading(false);
      }
    })();

    return () => abortController.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankType, sourcesKey]);

  // 更新滑動指示器位置
  useLayoutEffect(() => {
    const currentIndex = RANK_TYPES.findIndex((type) => type.id === rankType);
    const currentButton = tabRefs.current[currentIndex];

    if (currentButton) {
      const containerRect = currentButton.parentElement?.getBoundingClientRect();
      const buttonRect = currentButton.getBoundingClientRect();

      if (containerRect) {
        setIndicatorStyle({
          left: buttonRect.left - containerRect.left,
          width: buttonRect.width,
        });
      }
    }
  }, [rankType]);

  return (
    <>
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <PageHeader icon={Trophy} title="排行榜" />
          {/* 榜單類型切換 */}
          <div className="relative mt-4 flex gap-1">
            {/* 滑動指示器 */}
            <div
              className="absolute bottom-0 h-0.5 rounded-full bg-primary transition-all duration-300 ease-out"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
            />

            {RANK_TYPES.map((type, index) => (
              <Button
                key={type.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                onClick={() => setRankType(type.id)}
                variant="ghost"
                size="sm"
                className={`flex-1 rounded-lg transition-all duration-200 sm:flex-none sm:px-6 ${
                  rankType === type.id
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {type.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div aria-live="polite">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl p-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-20 w-14 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : rankList.length === 0 ? (
            <EmptyState icon={Trophy} message="暫無排行數據" />
          ) : (
            <div className="space-y-2">
              {rankList.map((item, index) => (
                <React.Fragment key={`${item.source}-${item.id}`}>
                  {item.rank === 4 && !isMultiSource && (
                    <div className="my-4 border-t border-border/50" />
                  )}
                  <RankItemCard
                    item={item}
                    animationDelay={index * 50}
                  />
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
