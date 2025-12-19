'use client';

/**
 * 閱讀歷史 Popover 元件
 */

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
}

export function HistoryPopover({
  isOpen,
  onOpenChange,
  history,
  isLoaded,
}: HistoryPopoverProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative h-8 w-8 rounded-full',
            isLoaded && history.length > 0 && 'text-primary'
          )}
          title="閱讀歷史"
        >
          <Clock className="h-4 w-4" />
          {isLoaded && history.length > 0 && (
            <Badge
              variant="default"
              className="absolute -right-1 -top-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
            >
              {history.length > 9 ? '9+' : history.length}
            </Badge>
          )}
        </Button>
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
