'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useHistory } from '@/lib/hooks/useHistory';
import {
  ArrowLeft,
  Settings,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Scroll,
  Keyboard,
  X,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface ReaderProps {
  mangaId: number;
  chapterId: number;
}

interface ChapterData {
  bid: number;
  cid: number;
  bname: string;
  cname: string;
  images: string[];
  prevCid?: number;
  nextCid?: number;
  total: number;
}

type ViewMode = 'single' | 'scroll';

interface ReaderSettings {
  viewMode: ViewMode;
  imageWidth: number;
}

// ============================================================
// Constants
// ============================================================

const TOOLBAR_HIDE_DELAY = 3000;
const DEFAULT_SETTINGS: ReaderSettings = {
  viewMode: 'scroll',
  imageWidth: 100,
};

const SHORTCUTS = [
  { key: '← / A', description: '上一頁' },
  { key: '→ / D', description: '下一頁' },
  { key: '[ / ,', description: '上一章' },
  { key: '] / .', description: '下一章' },
  { key: 'F', description: '全螢幕' },
  { key: 'M', description: '切換模式' },
  { key: 'Esc', description: '退出全螢幕' },
  { key: '?', description: '快捷鍵說明' },
];

// ============================================================
// Hooks
// ============================================================

function useToolbarVisibility() {
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToolbar = useCallback(() => {
    setIsVisible(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, TOOLBAR_HIDE_DELAY);
  }, []);

  const hideToolbar = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  // 初始化時設定隱藏計時器
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, TOOLBAR_HIDE_DELAY);
    return () => clearTimeout(timer);
  }, []);

  return { isVisible, showToolbar, hideToolbar };
}

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}

function getInitialSettings(): ReaderSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }
  const saved = localStorage.getItem('reader-settings');
  if (saved) {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  }
  return DEFAULT_SETTINGS;
}

function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(getInitialSettings);

  const updateSettings = useCallback((updates: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('reader-settings', JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, updateSettings };
}

// ============================================================
// Components
// ============================================================

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

function ShortcutsPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80"
      onClick={onClose}
    >
      <div
        className="w-80 rounded-lg border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">快捷鍵</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map(({ key, description }) => (
            <div
              key={key}
              className="flex items-center justify-between text-sm"
            >
              <kbd className="rounded bg-muted px-2 py-1 font-mono text-muted-foreground">
                {key}
              </kbd>
              <span className="text-muted-foreground">{description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({
  settings,
  onUpdate,
}: {
  settings: ReaderSettings;
  onUpdate: (updates: Partial<ReaderSettings>) => void;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>閱讀設定</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* 閱讀模式 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">閱讀模式</label>
            <div className="flex gap-2">
              <Button
                variant={settings.viewMode === 'single' ? 'secondary' : 'ghost'}
                className="flex-1"
                onClick={() => onUpdate({ viewMode: 'single' })}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                單頁
              </Button>
              <Button
                variant={settings.viewMode === 'scroll' ? 'secondary' : 'ghost'}
                className="flex-1"
                onClick={() => onUpdate({ viewMode: 'scroll' })}
              >
                <Scroll className="mr-2 h-4 w-4" />
                滾動
              </Button>
            </div>
          </div>

          {/* 圖片寬度 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">圖片寬度</label>
              <span className="text-sm text-muted-foreground">
                {settings.imageWidth}%
              </span>
            </div>
            <Slider
              value={[settings.imageWidth]}
              onValueChange={([value]) => onUpdate({ imageWidth: value })}
              min={50}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TopToolbar({
  mangaId,
  data,
  settings,
  onSettingsUpdate,
  isVisible,
}: {
  mangaId: number;
  data: ChapterData;
  settings: ReaderSettings;
  onSettingsUpdate: (updates: Partial<ReaderSettings>) => void;
  isVisible: boolean;
}) {
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

function BottomToolbar({
  mangaId,
  data,
  currentPage,
  onPageChange,
  settings,
  onSettingsUpdate,
  isVisible,
  onShowShortcuts,
}: {
  mangaId: number;
  data: ChapterData;
  currentPage: number;
  onPageChange: (page: number) => void;
  settings: ReaderSettings;
  onSettingsUpdate: (updates: Partial<ReaderSettings>) => void;
  isVisible: boolean;
  onShowShortcuts: () => void;
}) {
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

function ScrollReader({
  data,
  imageWidth,
  onPageChange,
}: {
  data: ChapterData;
  imageWidth: number;
  onPageChange: (page: number) => void;
}) {
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
      className="mx-auto max-w-4xl py-16"
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

function SinglePageReader({
  data,
  currentPage,
  imageWidth,
  onPageChange,
  onTap,
}: {
  data: ChapterData;
  currentPage: number;
  imageWidth: number;
  onPageChange: (page: number) => void;
  onTap: () => void;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const zone = x / width;

      if (zone < 0.3) {
        // 左側區域 - 上一頁
        if (currentPage > 0) {
          onPageChange(currentPage - 1);
        }
      } else if (zone > 0.7) {
        // 右側區域 - 下一頁
        if (currentPage < data.total - 1) {
          onPageChange(currentPage + 1);
        }
      } else {
        // 中間區域 - 顯示工具列
        onTap();
      }
    },
    [currentPage, data.total, onPageChange, onTap]
  );

  return (
    <div
      className="flex min-h-screen cursor-pointer items-center justify-center py-16"
      onClick={handleClick}
    >
      <div
        className="relative flex max-w-4xl items-center justify-center"
        style={{ width: `${imageWidth}%` }}
      >
        <Image
          src={`/api/image?url=${encodeURIComponent(data.images[currentPage])}`}
          alt={`Page ${currentPage + 1}`}
          width={1200}
          height={1800}
          className="h-auto max-h-[90vh] w-auto"
          unoptimized
          priority
        />
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function Reader({ mangaId, chapterId }: ReaderProps) {
  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const { addHistory } = useHistory();
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
          setCurrentPage(0);

          addHistory({
            mangaId: json.data.bid,
            mangaName: json.data.bname,
            mangaCover: `https://cf.mhgui.com/cpic/b/${json.data.bid}.jpg`,
            chapterId: json.data.cid,
            chapterName: json.data.cname,
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

  // 頁面切換
  const goToPage = useCallback(
    (page: number) => {
      if (data && page >= 0 && page < data.total) {
        setCurrentPage(page);
        if (settings.viewMode === 'single') {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      }
    },
    [data, settings.viewMode]
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
          onPageChange={setCurrentPage}
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
