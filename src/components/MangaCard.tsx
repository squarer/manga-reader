'use client';

import { useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MangaListItem } from '@/lib/scraper/types';

interface MangaCardProps {
  /** 漫畫資料 */
  manga: MangaListItem;
  /** 動畫延遲（毫秒），用於交錯進場 */
  animationDelay?: number;
}

/**
 * 漫畫卡片元件
 * 支援 3D 傾斜效果、光暈和交錯進場動畫
 */
export default function MangaCard({ manga, animationDelay = 0 }: MangaCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  const [shineStyle, setShineStyle] = useState({ backgroundPosition: '0% 0%', opacity: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const coverUrl = manga.cover
    ? `/api/image?url=${encodeURIComponent(manga.cover)}`
    : '/placeholder.jpg';

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 計算傾斜角度（最大 12 度）
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`);

    // 計算反光位置（根據滑鼠位置移動）
    const shineX = (x / rect.width) * 100;
    const shineY = (y / rect.height) * 100;
    setShineStyle({
      backgroundPosition: `${shineX}% ${shineY}%`,
      opacity: 1,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)');
    setShineStyle({ backgroundPosition: '50% 50%', opacity: 0 });
  }, []);

  return (
    <Link
      href={`/manga/${manga.id}`}
      className="group block"
      style={{
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500"
        style={{
          transform,
          transition: isHovering ? 'none' : 'transform 0.3s ease-out',
          transformStyle: 'preserve-3d',
          animationDelay: `${animationDelay}ms`,
        }}
      >
        <Card className="overflow-hidden border-0 bg-transparent">
          <CardContent className="p-0">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
              {/* 3D 傾斜反光效果 - 類似光澤掃過 */}
              <div
                className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-200"
                style={{
                  background: 'radial-gradient(circle at var(--shine-x, 50%) var(--shine-y, 50%), rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 20%, transparent 50%)',
                  backgroundSize: '150% 150%',
                  backgroundPosition: shineStyle.backgroundPosition,
                  opacity: shineStyle.opacity,
                }}
              />

              <Image
                src={coverUrl}
                alt={manga.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                unoptimized
              />

              {manga.score && (
                <Badge className="absolute right-1 top-1 z-30 bg-yellow-500 text-black shadow-lg hover:bg-yellow-500">
                  {manga.score}
                </Badge>
              )}

              <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="truncate text-xs text-white/80">
                  {manga.latestChapter}
                </p>
              </div>
            </div>

            <h3 className="mt-2 truncate text-sm font-medium text-foreground transition-colors duration-200 group-hover:text-primary">
              {manga.name}
            </h3>
          </CardContent>
        </Card>
      </div>
    </Link>
  );
}
