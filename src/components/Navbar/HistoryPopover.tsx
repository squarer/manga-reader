'use client';

/**
 * 閱讀歷史 Popover 元件
 */

import { useState } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { HistoryItem } from '@/lib/hooks/useHistory';

interface HistoryPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  history: HistoryItem[];
  isLoaded: boolean;
  isActive?: boolean;
}

export function HistoryPopover({
  isOpen,
  onOpenChange,
  history,
  isLoaded,
  isActive = false,
}: HistoryPopoverProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center h-8 px-2 rounded-full',
            'transition-all duration-200',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Clock className="h-4 w-4 shrink-0" />
          <span
            className={cn(
              'text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-200',
              isHovered ? 'w-16 ml-1.5' : 'w-0'
            )}
          >
            閱讀歷史
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end" sideOffset={8}>
        <div className="p-3 border-b">
          <h3 className="font-medium text-sm">最近閱讀</h3>
        </div>
        {isLoaded && history.length > 0 ? (
          <>
            <div className="max-h-80 overflow-y-auto">
              {history.slice(0, 10).map((item) => (
                <Link
                  key={`${item.mangaId}-${item.chapterId}`}
                  href={`/read/${item.mangaId}/${item.chapterId}${item.page > 0 ? `?page=${item.page + 1}` : ''}`}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors"
                  onClick={() => onOpenChange(false)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.mangaName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.chapterName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="p-2 border-t">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                <Link href="/history">查看全部</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            尚無閱讀記錄
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
