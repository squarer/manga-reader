'use client';

/**
 * Reader 工具列元件
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Scroll,
  Keyboard,
} from 'lucide-react';
import { SettingsPanel } from './ReaderSettings';
import type { ChapterData, ReaderSettings } from './types';

/** TopToolbar props */
interface TopToolbarProps {
  mangaId: number;
  data: ChapterData;
  settings: ReaderSettings;
  onSettingsUpdate: (updates: Partial<ReaderSettings>) => void;
  isVisible: boolean;
}

/**
 * 頂部工具列
 *
 * 顯示漫畫名稱、章節名稱和設定按鈕
 */
export function TopToolbar({
  mangaId,
  data,
  settings,
  onSettingsUpdate,
  isVisible,
}: TopToolbarProps) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-gradient-to-b from-background/90 to-transparent px-4 py-3 transition-all duration-300 ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0'
      }`}
    >
      <Button asChild variant="ghost" size="icon">
        <Link href={`/manga/${mangaId}`}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>

      <div className="text-center">
        <h1 className="text-sm font-medium">{data.bname}</h1>
        <p className="text-xs text-muted-foreground">{data.cname}</p>
      </div>

      <SettingsPanel settings={settings} onUpdate={onSettingsUpdate} />
    </header>
  );
}

/** BottomToolbar props */
interface BottomToolbarProps {
  mangaId: number;
  data: ChapterData;
  currentPage: number;
  onPageChange: (page: number) => void;
  settings: ReaderSettings;
  onSettingsUpdate: (updates: Partial<ReaderSettings>) => void;
  isVisible: boolean;
  onShowShortcuts: () => void;
}

/**
 * 底部工具列
 *
 * 顯示進度條、章節導航和閱讀模式切換
 */
export function BottomToolbar({
  mangaId,
  data,
  currentPage,
  onPageChange,
  settings,
  onSettingsUpdate,
  isVisible,
  onShowShortcuts,
}: BottomToolbarProps) {
  const progressPercent = ((currentPage + 1) / data.total) * 100;

  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background/90 to-transparent transition-all duration-300 ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0'
      }`}
    >
      {/* 進度條 */}
      <div className="px-4 pb-2">
        <div
          className="group relative h-1 cursor-pointer rounded-full bg-muted"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const page = Math.floor(percent * data.total);
            onPageChange(Math.max(0, Math.min(data.total - 1, page)));
          }}
        >
          <div
            className="h-full rounded-full bg-foreground transition-all group-hover:bg-muted-foreground"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-foreground opacity-0 transition-opacity group-hover:opacity-100"
            style={{ left: `${progressPercent}%`, marginLeft: '-6px' }}
          />
        </div>
      </div>

      {/* 控制列 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {data.prevCid ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/read/${mangaId}/${data.prevCid}`}>
                      <ChevronLeft className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>上一章</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="h-10 w-10" />
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="min-w-[80px] text-center text-sm text-muted-foreground">
            {currentPage + 1} / {data.total}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onSettingsUpdate({
                viewMode: settings.viewMode === 'single' ? 'scroll' : 'single',
              })
            }
          >
            {settings.viewMode === 'single' ? (
              <>
                <Scroll className="mr-1 h-4 w-4" />
                滾動
              </>
            ) : (
              <>
                <BookOpen className="mr-1 h-4 w-4" />
                單頁
              </>
            )}
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onShowShortcuts}
                >
                  <Keyboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>快捷鍵 (?)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          {data.nextCid ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/read/${mangaId}/${data.nextCid}`}>
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>下一章</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="h-10 w-10" />
          )}
        </div>
      </div>
    </footer>
  );
}
