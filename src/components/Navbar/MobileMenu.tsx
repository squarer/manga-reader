'use client';

/**
 * 手機版選單元件
 */

import Link from 'next/link';
import { Search, Clock, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, type NavItem } from './types';

interface MobileMenuProps {
  isOpen: boolean;
  pathname: string;
  searchValue: string;
  historyCount: number;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isActiveNavItem: (item: NavItem) => boolean;
}

export function MobileMenu({
  isOpen,
  pathname,
  searchValue,
  historyCount,
  onSearchChange,
  onSearchSubmit,
  onClose,
  isActiveNavItem,
}: MobileMenuProps) {
  return (
    <div
      className={cn(
        'mt-2 overflow-hidden transition-all duration-300 ease-out md:hidden',
        'rounded-2xl',
        'border border-border/50',
        'bg-background/95 backdrop-blur-xl',
        'shadow-lg shadow-black/5',
        isOpen ? 'max-h-96 p-4' : 'max-h-0 p-0 border-transparent'
      )}
    >
      {/* 手機版搜尋框 */}
      <form onSubmit={onSearchSubmit} className="mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜尋漫畫..."
            className="h-10 rounded-full pl-10 bg-muted/50 border-transparent"
          />
        </div>
      </form>

      {/* 手機版導航連結 */}
      <div className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = isActiveNavItem(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5',
                'rounded-full text-sm font-medium',
                'transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {/* 分隔線 */}
        <div className="my-2 h-px bg-border/50" />

        {/* 閱讀歷史 */}
        <Link
          href="/history"
          onClick={onClose}
          className={cn(
            'flex items-center gap-3 px-4 py-2.5',
            'rounded-full text-sm font-medium',
            'transition-all duration-200',
            pathname === '/history'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <Clock className="h-4 w-4" />
          閱讀歷史
          {historyCount > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {historyCount}
            </Badge>
          )}
        </Link>

        {/* 我的收藏 */}
        <Link
          href="/favorites"
          onClick={onClose}
          className={cn(
            'flex items-center gap-3 px-4 py-2.5',
            'rounded-full text-sm font-medium',
            'transition-all duration-200',
            pathname === '/favorites'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <Heart className="h-4 w-4" />
          我的收藏
        </Link>
      </div>
    </div>
  );
}
