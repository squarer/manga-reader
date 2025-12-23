'use client';

/**
 * Mobile 專用底部工具列
 *
 * 精簡版控制面板，僅保留核心導航功能
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  List,
  BookOpen,
  Scroll,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewMode, type ChapterData } from './types';

/** MobileBottomToolbar props */
interface MobileBottomToolbarProps {
  mangaId: number;
  data: ChapterData;
  currentPage: number;
  onPageChange: (page: number) => void;
  isVisible: boolean;
  /** 當前閱讀模式 */
  viewMode: ViewMode;
  /** 切換閱讀模式 */
  onViewModeChange: (mode: ViewMode) => void;
  /** 是否顯示下一章確認對話框 */
  showNextChapterDialog?: boolean;
  /** 設定下一章對話框狀態 */
  onNextChapterDialogChange?: (open: boolean) => void;
}

/**
 * Mobile 底部工具列
 *
 * 精簡導航：章節列表、上/下一話、上/下一頁、頁碼
 */
export function MobileBottomToolbar({
  mangaId,
  data,
  currentPage,
  onPageChange,
  isVisible,
  viewMode,
  onViewModeChange,
  showNextChapterDialog = false,
  onNextChapterDialogChange,
}: MobileBottomToolbarProps) {
  const router = useRouter();
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);

  const progressPercent = ((currentPage + 1) / data.total) * 100;
  const isLastPage = currentPage === data.total - 1;

  const dialogOpen = showNextChapterDialog || internalDialogOpen;
  const setDialogOpen = onNextChapterDialogChange || setInternalDialogOpen;

  /** 前往下一章 */
  const goToNextChapter = () => {
    if (data.nextCid) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      router.push(`/read/${mangaId}/${data.nextCid}`);
    }
  };

  return (
    <>
      <footer
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 pb-4 transition-all duration-300',
          isVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0'
        )}
      >
        <div className="mx-auto flex justify-center px-4">
          <div
            className={cn(
              'flex flex-col gap-2 px-3 py-2',
              'rounded-2xl',
              'border border-border/50',
              'bg-background/80 backdrop-blur-xl',
              'supports-[backdrop-filter]:bg-background/60',
              'shadow-lg shadow-black/5'
            )}
          >
            {/* 進度條 */}
            <div
              className="relative h-1 min-w-[200px] cursor-pointer rounded-full bg-muted"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const page = Math.floor(percent * data.total);
                onPageChange(Math.max(0, Math.min(data.total - 1, page)));
              }}
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* 控制列 */}
            <div className="flex items-center justify-center gap-1">
              {/* 章節列表 */}
              <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                <Link href={`/manga/${mangaId}`}>
                  <List className="h-4 w-4" />
                </Link>
              </Button>

              {/* 上一話 */}
              <Button
                asChild={!!data.prevCid}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!data.prevCid}
              >
                {data.prevCid ? (
                  <Link
                    href={`/read/${mangaId}/${data.prevCid}`}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Link>
                ) : (
                  <SkipBack className="h-4 w-4" />
                )}
              </Button>

              {/* 上一頁 */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              {/* 頁碼顯示 */}
              <span className="min-w-[60px] text-center text-sm tabular-nums text-muted-foreground">
                {currentPage + 1} / {data.total}
              </span>

              {/* 下一頁 */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
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

              {/* 下一話 */}
              <Button
                asChild={!!data.nextCid}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!data.nextCid}
              >
                {data.nextCid ? (
                  <Link
                    href={`/read/${mangaId}/${data.nextCid}`}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Link>
                ) : (
                  <SkipForward className="h-4 w-4" />
                )}
              </Button>

              {/* 閱讀模式切換 */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  onViewModeChange(
                    viewMode === ViewMode.Single ? ViewMode.Scroll : ViewMode.Single
                  )
                }
              >
                {viewMode === ViewMode.Single ? (
                  <Scroll className="h-4 w-4" />
                ) : (
                  <BookOpen className="h-4 w-4" />
                )}
              </Button>
            </div>
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
