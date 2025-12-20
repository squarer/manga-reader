/**
 * Navbar 型別定義與常數
 */

import { TrendingUp, Sparkles } from 'lucide-react';

/** 導航項目定義 */
export interface NavItem {
  /** 顯示名稱 */
  label: string;
  /** 連結路徑 */
  href: string;
  /** 圖標元件 */
  icon: React.ComponentType<{ className?: string }>;
}

/** 導航選單項目 */
export const NAV_ITEMS: NavItem[] = [
  { label: '排行榜', href: '/rank', icon: TrendingUp },
  { label: '最新更新', href: '/update', icon: Sparkles },
];
