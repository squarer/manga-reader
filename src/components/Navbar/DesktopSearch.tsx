'use client';

/**
 * 桌面版搜尋框元件
 */

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DesktopSearchProps {
  onSearch: (keyword: string) => void;
}

export function DesktopSearch({ onSearch }: DesktopSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  /** 展開時自動聚焦 */
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  /** 處理搜尋提交 */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
      setIsExpanded(false);
      setSearchValue('');
    }
  };

  /** 處理失去焦點 */
  const handleBlur = () => {
    if (!searchValue) {
      setIsExpanded(false);
    }
  };

  return (
    <div className="hidden items-center md:flex">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        {/* 搜尋按鈕 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 rounded-full transition-all duration-300',
            isExpanded && 'opacity-0 scale-75 pointer-events-none absolute'
          )}
          onClick={() => setIsExpanded(true)}
          title="搜尋"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* 展開的搜尋框 */}
        <div
          className={cn(
            'flex items-center gap-1 overflow-hidden transition-all duration-300 ease-out',
            isExpanded ? 'w-52 opacity-100' : 'w-0 opacity-0 pointer-events-none'
          )}
        >
          <Input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onBlur={handleBlur}
            placeholder="搜尋漫畫..."
            className={cn(
              'h-8 w-40 rounded-full transition-all duration-200',
              'bg-muted border-transparent',
              'focus-visible:ring-0 focus-visible:border-transparent',
              'focus:w-44'
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 rounded-full"
            onClick={() => {
              setIsExpanded(false);
              setSearchValue('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
