'use client';

/**
 * Reader 工具列元件
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Scroll,
  Keyboard,
  SkipBack,
  SkipForward,
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
      className={`fixed top-14 left-0 right-0 z-50 flex items-center justify-between bg-gradient-to-b from-background/90 to-transparent px-4 py-3 transition-all duration-300 ${
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
  /** 是否顯示下一章確認對話框 */
  showNextChapterDialog?: boolean;
  /** 設定下一章對話框狀態 */
  onNextChapterDialogChange?: (open: boolean) => void;
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
  showNextChapterDialog = false,
  onNextChapterDialogChange,
}: BottomToolbarProps) {
  const router = useRouter();
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);

  const progressPercent = ((currentPage + 1) / data.total) * 100;
  const isLastPage = currentPage === data.total - 1;

  // 使用外部或內部狀態控制對話框
  const dialogOpen = showNextChapterDialog || internalDialogOpen;
  const setDialogOpen = onNextChapterDialogChange || setInternalDialogOpen;

  /** 產生頁碼選項 */
  const pageOptions = Array.from({ length: data.total }, (_, i) => i + 1);

  /** 處理頁碼選擇 */
  const handlePageSelect = (value: string) => {
    onPageChange(parseInt(value, 10) - 1);
  };

  /** 前往下一章 */
  const goToNextChapter = () => {
    if (data.nextCid) {
      router.push(`/read/${mangaId}/${data.nextCid}`);
    }
  };

  return (
    <>
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
          {/* 上一話按鈕 */}
          <div className="flex items-center">
            {data.prevCid ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/read/${mangaId}/${data.prevCid}`}>
                        <SkipBack className="mr-1 h-4 w-4" />
                        上一話
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>上一話 ([ 或 ,)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="h-9 w-[88px]" />
            )}
          </div>

          {/* 中間控制區 */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* 上一頁按鈕 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>上一頁</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* 頁碼選擇器 */}
            <Select
              value={String(currentPage + 1)}
              onValueChange={handlePageSelect}
            >
              <SelectTrigger className="h-8 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {pageOptions.map((page) => (
                  <SelectItem key={page} value={String(page)}>
                    {page} / {data.total}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 下一頁按鈕 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (isLastPage && data.nextCid) {
                        setDialogOpen(true);
                      } else {
                        onPageChange(currentPage + 1);
                      }
                    }}
                    disabled={isLastPage && !data.nextCid}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isLastPage && data.nextCid ? '前往下一話' : '下一頁'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* 閱讀模式切換 */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
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

            {/* 快捷鍵說明 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden sm:flex"
                    onClick={onShowShortcuts}
                  >
                    <Keyboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>快捷鍵 (?)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* 下一話按鈕 */}
          <div className="flex items-center">
            {data.nextCid ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/read/${mangaId}/${data.nextCid}`}>
                        下一話
                        <SkipForward className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>下一話 (] 或 .)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="h-9 w-[88px]" />
            )}
          </div>
        </div>
      </footer>

      {/* 下一章確認對話框 */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>已到達最後一頁</AlertDialogTitle>
            <AlertDialogDescription>
              本章節已閱讀完畢，是否前往下一話？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>繼續閱讀</AlertDialogCancel>
            <AlertDialogAction onClick={goToNextChapter}>
              前往下一話
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
