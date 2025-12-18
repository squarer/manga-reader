'use client';

import { useRef, useState, useCallback, type ReactNode } from 'react';

/** 最大傾斜角度（度） */
const MAX_TILT_ANGLE = 12;
/** Hover 時的縮放比例 */
const HOVER_SCALE = 1.02;

interface TiltCardProps {
  /** 子元素 */
  children: ReactNode;
  /** 動畫延遲（毫秒），用於交錯進場 */
  animationDelay?: number;
  /** 是否啟用進場動畫 */
  enableEntrance?: boolean;
  /** 自訂 className */
  className?: string;
}

/**
 * 3D 傾斜卡片元件
 * 支援滑鼠跟隨傾斜、反光效果和交錯進場動畫
 */
export default function TiltCard({
  children,
  animationDelay = 0,
  enableEntrance = true,
  className = '',
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  const [shineStyle, setShineStyle] = useState({ backgroundPosition: '0% 0%', opacity: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -MAX_TILT_ANGLE;
    const rotateY = ((x - centerX) / centerX) * MAX_TILT_ANGLE;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${HOVER_SCALE})`);

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

  const entranceClass = enableEntrance
    ? 'animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500'
    : '';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${entranceClass} ${className}`}
      style={{
        transform,
        transition: isHovering ? 'none' : 'transform 0.3s ease-out',
        transformStyle: 'preserve-3d',
        animationDelay: enableEntrance ? `${animationDelay}ms` : undefined,
      }}
    >
      {/* 3D 傾斜反光效果 */}
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-lg transition-opacity duration-200"
        style={{
          background: 'radial-gradient(circle at var(--shine-x, 50%) var(--shine-y, 50%), rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 20%, transparent 50%)',
          backgroundSize: '150% 150%',
          backgroundPosition: shineStyle.backgroundPosition,
          opacity: shineStyle.opacity,
        }}
      />
      {children}
    </div>
  );
}
