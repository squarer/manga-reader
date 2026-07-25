'use client';

/**
 * 手機版選單元件
 * 導航項目已在 navbar 本體顯示，此處提供搜尋功能與來源切換
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SourceToggle } from '@/components/SourceToggle';

interface MobileMenuProps {
  isOpen: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function MobileMenu({
  isOpen,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onClose,
}: MobileMenuProps) {
  return (
    <div
      className={cn(
        'mt-2 overflow-hidden transition-all duration-300 ease-out md:hidden',
        'rounded-2xl',
        'bg-background/95 backdrop-blur-xl',
        'shadow-lg shadow-black/5',
        isOpen
          ? 'max-h-96 border border-border/50 p-4'
          : 'max-h-0 border-0 p-0'
      )}
    >
      {/* 來源切換 */}
      <div className="mb-3 flex justify-center">
        <SourceToggle />
      </div>

      {/* 手機版搜尋框 */}
      <form
        onSubmit={(e) => {
          onSearchSubmit(e);
          onClose();
        }}
      >
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
    </div>
  );
}
