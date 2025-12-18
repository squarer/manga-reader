'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp, ArrowDown, Minus, Eye, Trophy, Crown, Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { RankItem } from '@/lib/scraper/types';
import { RankTrend } from '@/lib/scraper/types';

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

/** Mock 數據 - 待 API 完成後移除 */
const MOCK_RANK_DATA: RankItem[] = [
  {
    id: 1,
    rank: 1,
    name: '鬼滅之刃',
    cover: '',
    author: '吾峠呼世晴',
    score: 9.8,
    views: 1234567,
    trend: RankTrend.UP,
    latestChapter: '第205話',
    updateTime: '2024-01-15',
  },
  {
    id: 2,
    rank: 2,
    name: '咒術迴戰',
    cover: '',
    author: '芥見下下',
    score: 9.6,
    views: 987654,
    trend: RankTrend.SAME,
    latestChapter: '第250話',
    updateTime: '2024-01-14',
  },
  {
    id: 3,
    rank: 3,
    name: '海賊王',
    cover: '',
    author: '尾田榮一郎',
    score: 9.9,
    views: 876543,
    trend: RankTrend.DOWN,
    latestChapter: '第1100話',
    updateTime: '2024-01-13',
  },
  {
    id: 4,
    rank: 4,
    name: '進擊的巨人',
    cover: '',
    author: '諫山創',
    score: 9.5,
    views: 765432,
    trend: RankTrend.UP,
    latestChapter: '第139話(完)',
    updateTime: '2024-01-12',
  },
  {
    id: 5,
    rank: 5,
    name: '我的英雄學院',
    cover: '',
    author: '堀越耕平',
    score: 9.3,
    views: 654321,
    trend: RankTrend.SAME,
    latestChapter: '第400話',
    updateTime: '2024-01-11',
  },
  {
    id: 6,
    rank: 6,
    name: '間諜家家酒',
    cover: '',
    author: '遠藤達哉',
    score: 9.4,
    views: 543210,
    trend: RankTrend.UP,
    latestChapter: '第85話',
    updateTime: '2024-01-10',
  },
  {
    id: 7,
    rank: 7,
    name: '鏈鋸人',
    cover: '',
    author: '藤本樹',
    score: 9.2,
    views: 432109,
    trend: RankTrend.DOWN,
    latestChapter: '第150話',
    updateTime: '2024-01-09',
  },
  {
    id: 8,
    rank: 8,
    name: '藍色監獄',
    cover: '',
    author: '金城宗幸',
    score: 9.1,
    views: 321098,
    trend: RankTrend.UP,
    latestChapter: '第230話',
    updateTime: '2024-01-08',
  },
  {
    id: 9,
    rank: 9,
    name: '排球少年',
    cover: '',
    author: '古舘春一',
    score: 9.0,
    views: 210987,
    trend: RankTrend.SAME,
    latestChapter: '第402話(完)',
    updateTime: '2024-01-07',
  },
  {
    id: 10,
    rank: 10,
    name: '東京復仇者',
    cover: '',
    author: '和久井健',
    score: 8.9,
    views: 109876,
    trend: RankTrend.DOWN,
    latestChapter: '第278話(完)',
    updateTime: '2024-01-06',
  },
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
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-500 shadow-lg shadow-slate-400/30">
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
function RankItemCard({ item, animationDelay = 0 }: RankItemCardProps) {
  const coverUrl = item.cover
    ? `/api/image?url=${encodeURIComponent(item.cover)}`
    : '/placeholder.jpg';

  const isTopThree = item.rank <= 3;

  return (
    <Link
      href={`/manga/${item.id}`}
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
              className={`truncate font-semibold transition-colors group-hover:text-primary ${
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
}

/**
 * 排行榜頁面
 */
export default function RankPage() {
  const [rankType, setRankType] = useState<RankType>(RankType.DAY);
  const [rankList, setRankList] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab 滑動指示器
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // 載入排行榜數據
  const fetchRankList = async (type: RankType) => {
    setLoading(true);

    try {
      const res = await fetch(`/api/rank?type=${type}`);
      const json = await res.json();

      if (json.success && json.data?.items?.length > 0) {
        setRankList(json.data.items);
      } else {
        // API 回傳空資料，使用 mock 數據
        setRankList(MOCK_RANK_DATA);
      }
    } catch {
      // API 失敗，使用 mock 數據
      setRankList(MOCK_RANK_DATA);
    } finally {
      setLoading(false);
    }
  };

  // 切換榜單類型時重新載入
  useEffect(() => {
    fetchRankList(rankType);
  }, [rankType]);

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="text-lg">&larr;</span>
              </Link>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <Trophy className="h-6 w-6 text-primary" />
                排行榜
              </h1>
            </div>
            <ThemeToggle />
          </div>

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
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {type.name}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-6">
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
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <Trophy className="h-16 w-16 text-muted-foreground/50" />
            <p className="text-xl text-muted-foreground">暫無排行數據</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rankList.map((item, index) => (
              <RankItemCard
                key={item.id}
                item={item}
                animationDelay={index * 50}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
