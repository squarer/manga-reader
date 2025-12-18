'use client';

/**
 * 漫畫閱讀器主元件
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useHistory } from '@/lib/hooks/useHistory';
import { TopToolbar, BottomToolbar } from './ReaderToolbar';
import { ShortcutsPanel } from './ReaderSettings';
import {
  useToolbarVisibility,
  useFullscreen,
  useReaderSettings,
} from './useReaderHooks';
import type { ReaderProps, ChapterData } from './types';

/**
 * 載入中狀態
 */
function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">載入中...</p>
      </div>
    </div>
  );
}

/**
 * 錯誤狀態
 */
function ErrorState({ mangaId, error }: { mangaId: number; error: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="text-xl text-destructive">{error}</div>
      <Button asChild variant="secondary">
        <Link href={`/manga/${mangaId}`}>返回漫畫詳情</Link>
      </Button>
    </div>
  );
}

/** ScrollReader props */
interface ScrollReaderProps {
  data: ChapterData;
  imageWidth: number;
  onPageChange: (page: number) => void;
}

/**
 * 滾動閱讀模式
 *
 * 垂直滾動瀏覽所有頁面
 */
function ScrollReader({ data, imageWidth, onPageChange }: ScrollReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = imageRefs.current.findIndex(
              (ref) => ref === entry.target
            );
            if (index !== -1) {
              onPageChange(index);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    imageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [data.images.length, onPageChange]);

  return (
    <div
      ref={containerRef}
      className="mx-auto max-w-4xl space-y-2 py-16"
      style={{ width: `${imageWidth}%` }}
    >
      {data.images.map((url, index) => (
        <div
          key={index}
          ref={(el) => {
            imageRefs.current[index] = el;
          }}
          className="relative w-full"
        >
          <Image
            src={`/api/image?url=${encodeURIComponent(url)}`}
            alt={`Page ${index + 1}`}
            width={1200}
            height={1800}
            className="h-auto w-full"
            unoptimized
            priority={index < 3}
          />
        </div>
      ))}
    </div>
  );
}

/** SinglePageReader props */
interface SinglePageReaderProps {
  data: ChapterData;
  currentPage: number;
  imageWidth: number;
  onPageChange: (page: number) => void;
  onTap: () => void;
}

/**
 * 單頁閱讀模式
 *
 * 左鍵下一頁、右鍵上一頁、中間點擊顯示工具列
 */
function SinglePageReader({
  data,
  currentPage,
  imageWidth,
  onPageChange,
  onTap,
}: SinglePageReaderProps) {
  /** 左鍵點擊 - 下一頁或顯示工具列 */
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const zone = x / width;

      // 中間區域 (30%-70%) - 顯示工具列
      if (zone >= 0.3 && zone <= 0.7) {
        onTap();
        return;
      }

      // 其他區域 - 下一頁
      if (currentPage < data.total - 1) {
        onPageChange(currentPage + 1);
      }
    },
    [currentPage, data.total, onPageChange, onTap]
  );

  /** 右鍵點擊 - 上一頁 */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (currentPage > 0) {
        onPageChange(currentPage - 1);
      }
    },
    [currentPage, onPageChange]
  );

  return (
    <div
      className="flex min-h-screen cursor-pointer items-center justify-center py-16"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: `${imageWidth}%`, maxWidth: '100vw' }}
      >
        <Image
          src={`/api/image?url=${encodeURIComponent(data.images[currentPage])}`}
          alt={`Page ${currentPage + 1}`}
          width={1200}
          height={1800}
          className="h-auto w-full max-w-full"
          unoptimized
          priority
        />
      </div>
    </div>
  );
}

/**
 * 漫畫閱讀器
 *
 * 支援滾動和單頁兩種閱讀模式，含工具列和快捷鍵
 */
export default function Reader({ mangaId, chapterId }: ReaderProps) {
  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const { addHistory, updateHistoryPage } = useHistory();
  const { isVisible, showToolbar } = useToolbarVisibility();
  const { toggleFullscreen } = useFullscreen();
  const { settings, updateSettings } = useReaderSettings();

  // 載入章節資料
  useEffect(() => {
    async function fetchChapter() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/chapter/${mangaId}/${chapterId}`);
        const json = await res.json();

        if (json.success) {
          setData(json.data);

          // 從 URL 讀取初始頁碼
          const urlParams = new URLSearchParams(window.location.search);
          const pageParam = urlParams.get('page');
          const initialPage = pageParam ? Math.max(0, parseInt(pageParam, 10) - 1) : 0;
          const validPage = Math.min(initialPage, json.data.total - 1);
          setCurrentPage(validPage);

          addHistory({
            mangaId: json.data.bid,
            mangaName: json.data.bname,
            mangaCover: `https://cf.mhgui.com/cpic/b/${json.data.bid}.jpg`,
            chapterId: json.data.cid,
            chapterName: json.data.cname,
            page: validPage,
          });
        } else {
          setError(json.error || 'Failed to load chapter');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }

    fetchChapter();
  }, [mangaId, chapterId, addHistory]);

  /**
   * 更新 URL 頁碼參數
   */
  const updatePageUrl = useCallback((page: number) => {
    const url = new URL(window.location.href);
    if (page === 0) {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', String(page + 1));
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  /**
   * 單頁模式頁面切換
   */
  const goToPage = useCallback(
    (page: number) => {
      if (data && page >= 0 && page < data.total) {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'instant' });
        updatePageUrl(page);
      }
    },
    [data, updatePageUrl]
  );

  /**
   * 滾動模式頁面切換（由 IntersectionObserver 觸發）
   */
  const handleScrollPageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      updatePageUrl(page);
    },
    [updatePageUrl]
  );

  // 鍵盤快捷鍵
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // 忽略輸入框內的按鍵
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (settings.viewMode === 'single') {
            goToPage(currentPage - 1);
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (settings.viewMode === 'single') {
            goToPage(currentPage + 1);
          }
          break;
        case '[':
        case ',':
          if (data?.prevCid) {
            window.location.href = `/read/${mangaId}/${data.prevCid}`;
          }
          break;
        case ']':
        case '.':
          if (data?.nextCid) {
            window.location.href = `/read/${mangaId}/${data.nextCid}`;
          }
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          updateSettings({
            viewMode: settings.viewMode === 'single' ? 'scroll' : 'single',
          });
          break;
        case '?':
          setShowShortcuts((prev) => !prev);
          break;
        case 'Escape':
          if (showShortcuts) {
            setShowShortcuts(false);
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentPage,
    data,
    mangaId,
    settings.viewMode,
    showShortcuts,
    goToPage,
    toggleFullscreen,
    updateSettings,
  ]);

  // 滑鼠移動顯示工具列
  useEffect(() => {
    function handleMouseMove() {
      showToolbar();
    }

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showToolbar]);

  // 頁面離開時更新閱讀記錄
  useEffect(() => {
    if (!data) return;

    const mangaId = data.bid;

    function handleBeforeUnload() {
      updateHistoryPage(mangaId, currentPage);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        updateHistoryPage(mangaId, currentPage);
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // 組件卸載時也保存
      updateHistoryPage(mangaId, currentPage);
    };
  }, [data, currentPage, updateHistoryPage]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return <ErrorState mangaId={mangaId} error={error || '載入失敗'} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 頂部工具列 */}
      <TopToolbar
        mangaId={mangaId}
        data={data}
        settings={settings}
        onSettingsUpdate={updateSettings}
        isVisible={isVisible}
      />

      {/* 閱讀區域 */}
      {settings.viewMode === 'scroll' ? (
        <ScrollReader
          data={data}
          imageWidth={settings.imageWidth}
          onPageChange={handleScrollPageChange}
        />
      ) : (
        <SinglePageReader
          data={data}
          currentPage={currentPage}
          imageWidth={settings.imageWidth}
          onPageChange={goToPage}
          onTap={showToolbar}
        />
      )}

      {/* 底部工具列 */}
      <BottomToolbar
        mangaId={mangaId}
        data={data}
        currentPage={currentPage}
        onPageChange={goToPage}
        settings={settings}
        onSettingsUpdate={updateSettings}
        isVisible={isVisible}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      {/* 快捷鍵說明面板 */}
      <ShortcutsPanel
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
