'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

/** 卡片寬度 (px) */
const CARD_WIDTH = 96;
/** 每張卡片露出的比例 */
const VISIBLE_RATIO = 0.4;
/** 計算每張卡片的偏移量 */
const CARD_OFFSET = CARD_WIDTH * VISIBLE_RATIO;
/** 卡片旋轉角度範圍 */
const MIN_ROTATE = -2;
const MAX_ROTATE = 7;
/** hover 時左右讓開的距離 */
const SPREAD_DISTANCE = CARD_WIDTH * 0.5;

/** 根據 index 產生固定的隨機旋轉角度 */
const getRotateAngle = (index: number) => {
  const seed = (index * 7 + 3) % 10;
  return MIN_ROTATE + (seed / 10) * (MAX_ROTATE - MIN_ROTATE);
};

/** 卡片資料 */
export interface StackedCardItem {
  /** 唯一識別碼 */
  id: string;
  /** 連結網址 */
  href: string;
  /** 封面圖片網址 */
  cover: string;
  /** 主標題 */
  title: string;
  /** 副標題（可選） */
  subtitle?: string;
}

interface StackedCardListProps {
  /** 卡片資料列表 */
  items: StackedCardItem[];
  /** 標題 */
  title: string;
  /** 標題右側額外元素 */
  titleExtra?: React.ReactNode;
}

/**
 * 堆疊卡片列表
 *
 * 卡片像書本一樣堆疊，hover 時左右讓開
 */
export default function StackedCardList({ items, title, titleExtra }: StackedCardListProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return null;
  }

  /** 計算卡片的水平偏移（只讓右邊的書往右移） */
  const getTransformX = (index: number) => {
    if (hoveredIndex === null) return 0;
    if (index > hoveredIndex) return SPREAD_DISTANCE;
    return 0;
  };

  return (
    <div className="overflow-x-auto px-2 -mx-2">
      {/* 標題 */}
      <div className="mb-0.5 flex items-center gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {titleExtra}
      </div>
      <div
        className="relative flex items-end pb-1"
        style={{
          width: `${CARD_OFFSET * (items.length - 1) + CARD_WIDTH + SPREAD_DISTANCE}px`,
          height: '180px',
        }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {items.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const translateX = getTransformX(index);

          return (
            <Link
              key={item.id}
              href={item.href}
              className="group absolute origin-bottom transition-all duration-300 ease-out"
              style={{
                left: `${index * CARD_OFFSET}px`,
                zIndex: isHovered ? 50 : index,
                transform: `translateX(${translateX}px) rotate(${isHovered ? 0 : getRotateAngle(index)}deg)`,
                filter: hoveredIndex !== null && index > hoveredIndex ? 'brightness(1.2) saturate(0.6)' : undefined,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
            >
              <div className="relative h-32 w-24">
                {/* 卡片厚度陰影 */}
                <div
                  className="absolute inset-0 rounded-lg bg-black/40"
                  style={{ transform: 'translate(3px, 3px)' }}
                />
                <div
                  className="absolute inset-0 rounded-lg bg-black/20"
                  style={{ transform: 'translate(2px, 2px)' }}
                />
                <div
                  className="absolute inset-0 overflow-hidden rounded-lg bg-muted ring-1 ring-black/10 shadow-xl transition-shadow duration-300"
                  style={isHovered ? { boxShadow: '0 0 12px 2px oklch(0.62 0.14 39 / 0.5)' } : undefined}
                >
                  <Image
                    src={item.cover}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
              {/* Hover 時顯示標題（書下方） */}
              <div
                className="mt-1 w-24 transition-opacity duration-300"
                style={{ opacity: isHovered ? 1 : 0 }}
              >
                <p className="truncate text-xs text-foreground">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="truncate text-[10px] text-muted-foreground">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
