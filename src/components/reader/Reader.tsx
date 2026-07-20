'use client';

/**
 * 漫畫閱讀器主元件
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useHistory } from '@/lib/hooks/useHistory';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { TopToolbar, BottomToolbar } from './ReaderToolbar';
import { MobileBottomToolbar } from './MobileToolbar';
import { ShortcutsPanel } from './ReaderSettings';
import {
  useToolbarVisibility,
  useFullscreen,
  useReaderSettings,
  useSwipe,
} from './useReaderHooks';
import { ViewMode, type ReaderProps, type ChapterData } from './types';
import { getProxiedImageUrl } from '@/lib/image-utils';

/**
 * 載入中狀態
 */
function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center">
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="text-xl text-destructive">{error}</div>
      <Button asChild variant="secondary">
        <Link href={`/manga/${mangaId}`}>返回漫畫詳情</Link>
      </Button>
    </div>
  );
}

/** MangaImage props */
interface MangaImageProps {
  /** 圖片 URL */
  url: string;
  /** 頁碼（從 0 開始） */
  pageIndex: number;
  /** 是否優先載入 */
  priority?: boolean;
}

/**
 * 漫畫圖片元件
 *
 * 統一單頁和滾動模式的圖片渲染
 */
function MangaImage({ url, pageIndex, priority = false }: MangaImageProps) {
  return (
    <Image
      src={getProxiedImageUrl(url)}
      alt={`Page ${pageIndex + 1}`}
      width={1200}
      height={1800}
      className="pointer-events-none h-auto w-full max-w-full select-none rounded-sm shadow-[rgba(0,0,0,0.05)_0px_4px_24px] ring-1 ring-border"
      unoptimized
      priority={priority}
      draggable={false}
    />
  );
}

/** ScrollReader props */
interface ScrollReaderProps {
  data: ChapterData;
  imageWidth: number;
  targetPage: number;
  onPageChange: (page: number) => void;
}

/**
 * 滾動閱讀模式
 *
 * 垂直滾動瀏覽所有頁面
 */
function ScrollReader({ data, imageWidth, targetPage, onPageChange }: ScrollReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastScrolledPage = useRef(-1);
  const isUserScrolling = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevImageWidth = useRef(imageWidth);
  const isResizing = useRef(false);
  const onPageChangeRef = useRef(onPageChange);
  const imagesLengthRef = useRef(data.images.length);

  /**
   * 邊界仲裁：統一 scroll handler 與 IO callback 的頁碼解析。
   * 觸底 → 最後一頁；置頂 → 第一頁；否則回傳 candidate。
   */
  function resolvePageAtBoundary(candidateIndex: number): number {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1) {
      return imagesLengthRef.current - 1;
    }
    if (window.scrollY <= 1) {
      return 0;
    }
    return candidateIndex;
  }

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  useEffect(() => {
    imagesLengthRef.current = data.images.length;
  }, [data.images.length]);

  // 滾動到指定頁面（初始載入或使用者手動選擇）
  useEffect(() => {
    // 避免重複滾動到同一頁
    if (targetPage === lastScrolledPage.current) return;
    // 如果使用者正在滾動，不干擾
    if (isUserScrolling.current) return;

    const targetRef = imageRefs.current[targetPage];
    if (targetRef) {
      lastScrolledPage.current = targetPage;
      requestAnimationFrame(() => {
        targetRef.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
    }
  }, [targetPage]);

  // 圖片寬度變化時維持當前頁面位置
  useEffect(() => {
    if (prevImageWidth.current === imageWidth) return;
    prevImageWidth.current = imageWidth;
    isResizing.current = true;

    // 在 DOM 更新後滾動回當前頁
    requestAnimationFrame(() => {
      const targetRef = imageRefs.current[targetPage];
      if (targetRef) {
        targetRef.scrollIntoView({ behavior: 'instant', block: 'start' });
        lastScrolledPage.current = targetPage;
      }
      // 延遲重置 resizing 狀態，避免 IntersectionObserver 觸發頁碼變更
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        isResizing.current = false;
        resizeTimerRef.current = null;
      }, 100);
    });
  }, [imageWidth, targetPage]);

  // 監聽使用者滾動 + 最後一頁底部邊界偵測
  useEffect(() => {
    function handleScroll() {
      isUserScrolling.current = true;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrolling.current = false;
      }, 150);

      // 邊界仲裁：最後一頁矮或首頁矮時，IO 中心線可能永遠不觸發
      if (isResizing.current) return;
      const boundaryIndex = resolvePageAtBoundary(lastScrolledPage.current);
      if (boundaryIndex !== lastScrolledPage.current) {
        lastScrolledPage.current = boundaryIndex;
        onPageChangeRef.current(boundaryIndex);
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 調整圖片寬度時忽略頁碼變更
        if (isResizing.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = imageRefs.current.findIndex(
              (ref) => ref === entry.target
            );
            if (index !== -1) {
              const resolved = resolvePageAtBoundary(index);
              lastScrolledPage.current = resolved;
              onPageChangeRef.current(resolved);
            }
          }
        });
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );

    imageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [data.images.length]);

  return (
    <div
      ref={containerRef}
      className="mx-auto space-y-6 pt-24 pb-16"
      style={{ width: `${imageWidth}%` }}
    >
      {data.images.map((url, index) => (
        <div
          key={index}
          ref={(el) => {
            imageRefs.current[index] = el;
          }}
          className="relative flex w-full items-center justify-center"
        >
          <MangaImage url={url} pageIndex={index} priority={index < 3} />
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
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

/**
 * 單頁閱讀模式
 *
 * 左鍵換頁（左側上一頁、右側下一頁）、右鍵上一頁、中間點擊顯示工具列
 */
function SinglePageReader({
  data,
  currentPage,
  imageWidth,
  onPageChange,
  onTap,
  onPrevChapter,
  onNextChapter,
}: SinglePageReaderProps) {
  // 預載後續兩頁圖片
  useEffect(() => {
    [1, 2].forEach((offset) => {
      const nextIndex = currentPage + offset;
      if (nextIndex < data.total) {
        const img = new window.Image();
        img.src = getProxiedImageUrl(data.images[nextIndex]);
      }
    });
  }, [currentPage, data.images, data.total]);

  /** 上一頁或上一話 */
  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    } else {
      onPrevChapter();
    }
  }, [currentPage, onPageChange, onPrevChapter]);

  /** 下一頁或下一話 */
  const goNext = useCallback(() => {
    if (currentPage < data.total - 1) {
      onPageChange(currentPage + 1);
    } else {
      onNextChapter();
    }
  }, [currentPage, data.total, onPageChange, onNextChapter]);

  /** 右鍵點擊 - 上一頁或上一話 */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      goPrev();
    },
    [goPrev]
  );

  const { containerRef, swipeOffset } = useSwipe({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen items-center justify-center pt-24 pb-16"
      onContextMenu={handleContextMenu}
    >
      {/* 三個透明覆蓋按鈕：鍵盤/螢幕閱讀器可 Tab 到並觸發各區域動作 */}
      <button
        type="button"
        className="absolute inset-y-0 left-0 z-10 w-2/5 cursor-pointer bg-transparent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/50"
        onClick={goPrev}
        aria-label="上一頁"
      />
      <button
        type="button"
        className="absolute inset-y-0 left-[40%] z-10 w-1/5 cursor-pointer bg-transparent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/50"
        onClick={onTap}
        aria-label="顯示工具列"
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 z-10 w-2/5 cursor-pointer bg-transparent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/50"
        onClick={goNext}
        aria-label="下一頁"
      />
      <div
        className="relative flex items-center justify-center"
        style={{
          width: `${imageWidth}%`,
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        <MangaImage
          key={currentPage}
          url={data.images[currentPage]}
          pageIndex={currentPage}
          priority
        />
      </div>
    </div>
  );
}

/**
 * 從 URL ?page= 參數解析初始頁碼（0-based，夾取 [0, total-1]）。
 * 非數字或缺參數回 0。
 */
function parseInitialPage(total: number): number {
  const pageParam = new URLSearchParams(window.location.search).get('page');
  if (!pageParam) return 0;
  const parsed = parseInt(pageParam, 10);
  if (isNaN(parsed)) return 0;
  return Math.min(Math.max(0, parsed - 1), total - 1);
}

/**
 * 漫畫閱讀器
 *
 * 支援滾動和單頁兩種閱讀模式，含工具列和快捷鍵
 */
export default function Reader({ mangaId, chapterId, initialData }: ReaderProps) {
  const [data, setData] = useState<ChapterData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const router = useRouter();
  const { addHistory, updateHistoryPage } = useHistory();
  const { isVisible, showToolbar } = useToolbarVisibility();
  const { toggleFullscreen } = useFullscreen();
  const { settings, updateSettings } = useReaderSettings();
  const isMobile = useIsMobile();

  /** 圖片寬度：mobile 滿寬，桌面使用設定值 */
  const imageWidth = isMobile ? 100 : settings.imageWidth;

  // 載入章節資料（使用 AbortController 防止 Strict Mode 重複請求）
  useEffect(() => {
    setCurrentPage(0);

    // 有 initialData 且 chapterId 吻合時，略過 fetch，直接處理頁碼與 history
    if (initialData && initialData.cid === chapterId) {
      const validPage = parseInitialPage(initialData.total);
      setCurrentPage(validPage);

      addHistory({
        mangaId: initialData.bid,
        mangaName: initialData.bname,
        mangaCover: `/cpic/b/${initialData.bid}.jpg`,
        chapterId: initialData.cid,
        chapterName: initialData.cname,
        page: validPage,
      });
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    async function fetchChapter() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/chapter/${mangaId}/${chapterId}`, {
          signal: abortController.signal,
        });
        const json = await res.json();

        if (json.success) {
          setData(json.data);

          // 從 URL 讀取初始頁碼
          const validPage = parseInitialPage(json.data.total);
          setCurrentPage(validPage);

          addHistory({
            mangaId: json.data.bid,
            mangaName: json.data.bname,
            mangaCover: `/cpic/b/${json.data.bid}.jpg`,
            chapterId: json.data.cid,
            chapterName: json.data.cname,
            page: validPage,
          });
        } else {
          setError(json.error || 'Failed to load chapter');
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // 請求被取消，不處理
        }
        setError('Network error');
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchChapter();

    return () => {
      abortController.abort();
    };
  }, [mangaId, chapterId, initialData, addHistory]);

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
   * 頁面切換（單頁模式滾動到頂部，滾動模式由 ScrollReader 處理）
   */
  const goToPage = useCallback(
    (page: number) => {
      if (data && page >= 0 && page < data.total) {
        setCurrentPage(page);
        // 單頁模式滾動到頂部，滾動模式由 ScrollReader 處理
        if (settings.viewMode === ViewMode.Single) {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
        updatePageUrl(page);
      }
    },
    [data, settings.viewMode, updatePageUrl]
  );

  /** 切換上一話（SPA 導航，儲存進度） */
  const goToPrevChapter = useCallback(() => {
    if (data?.prevCid) {
      updateHistoryPage(mangaId, data.cid, currentPage);
      setCurrentPage(0);
      if (settings.viewMode === ViewMode.Single) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      router.push(`/read/${mangaId}/${data.prevCid}`);
    }
  }, [data, mangaId, currentPage, settings.viewMode, updateHistoryPage, router]);

  /** 切換下一話（SPA 導航，儲存進度） */
  const goToNextChapter = useCallback(() => {
    if (data?.nextCid) {
      updateHistoryPage(mangaId, data.cid, currentPage);
      setCurrentPage(0);
      if (settings.viewMode === ViewMode.Single) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      router.push(`/read/${mangaId}/${data.nextCid}`);
    }
  }, [data, mangaId, currentPage, settings.viewMode, updateHistoryPage, router]);

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
          if (settings.viewMode === ViewMode.Single) {
            if (currentPage > 0) {
              goToPage(currentPage - 1);
            } else {
              goToPrevChapter();
            }
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (settings.viewMode === ViewMode.Single) {
            if (data && currentPage < data.total - 1) {
              goToPage(currentPage + 1);
            } else {
              goToNextChapter();
            }
          }
          break;
        case '[':
        case ',':
          goToPrevChapter();
          break;
        case ']':
        case '.':
          goToNextChapter();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          updateSettings({
            viewMode: settings.viewMode === ViewMode.Single ? ViewMode.Scroll : ViewMode.Single,
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
    settings.viewMode,
    showShortcuts,
    goToPage,
    goToPrevChapter,
    goToNextChapter,
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
    const chapterId = data.cid;

    function handleBeforeUnload() {
      updateHistoryPage(mangaId, chapterId, currentPage);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        updateHistoryPage(mangaId, chapterId, currentPage);
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // 組件卸載時也保存
      updateHistoryPage(mangaId, chapterId, currentPage);
    };
  }, [data, currentPage, updateHistoryPage]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return <ErrorState mangaId={mangaId} error={error || '載入失敗'} />;
  }

  return (
    <>
      {/* 頂部工具列 */}
      <TopToolbar mangaId={mangaId} data={data} isVisible={isVisible} />

      {/* 閱讀區域 */}
      {settings.viewMode === ViewMode.Scroll ? (
        <ScrollReader
          data={data}
          imageWidth={imageWidth}
          targetPage={currentPage}
          onPageChange={handleScrollPageChange}
        />
      ) : (
        <SinglePageReader
          data={data}
          currentPage={currentPage}
          imageWidth={imageWidth}
          onPageChange={goToPage}
          onTap={showToolbar}
          onPrevChapter={goToPrevChapter}
          onNextChapter={goToNextChapter}
        />
      )}

      {/* 底部工具列 */}
      {isMobile ? (
        <MobileBottomToolbar
          mangaId={mangaId}
          data={data}
          currentPage={currentPage}
          onPageChange={goToPage}
          isVisible={isVisible}
          viewMode={settings.viewMode}
          onViewModeChange={(mode) => updateSettings({ viewMode: mode })}
        />
      ) : (
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
      )}

      {/* 快捷鍵說明面板 */}
      <ShortcutsPanel
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  );
}
