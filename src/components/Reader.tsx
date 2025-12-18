'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useHistory } from '@/lib/hooks/useHistory';

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

export default function Reader({ mangaId, chapterId }: ReaderProps) {
  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'scroll'>('scroll');
  const { addHistory } = useHistory();

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

  const goToPage = useCallback(
    (page: number) => {
      if (data && page >= 0 && page < data.total) {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [data]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (viewMode !== 'single') return;

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        goToPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        goToPage(currentPage + 1);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, viewMode, goToPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 flex items-center justify-between bg-background/95 px-4 py-3 backdrop-blur">
          <Skeleton className="h-5 w-16" />
          <div className="text-center">
            <Skeleton className="mx-auto h-4 w-32" />
            <Skeleton className="mx-auto mt-1 h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-16" />
        </header>
        <div className="mx-auto max-w-4xl space-y-4 p-4">
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="aspect-[2/3] w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="text-xl text-destructive">{error || '載入失敗'}</div>
        <Button asChild>
          <Link href={`/manga/${mangaId}`}>返回漫畫詳情</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* 頂部導航 */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background/95 px-4 py-3 backdrop-blur">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/manga/${mangaId}`}>← 返回</Link>
        </Button>
        <div className="text-center">
          <h1 className="text-sm font-medium">{data.bname}</h1>
          <p className="text-xs text-muted-foreground">{data.cname}</p>
        </div>
        <Button
          onClick={() => setViewMode(viewMode === 'single' ? 'scroll' : 'single')}
          variant="secondary"
          size="sm"
        >
          {viewMode === 'single' ? '滾動' : '單頁'}
        </Button>
      </header>

      {/* 閱讀區域 */}
      {viewMode === 'scroll' ? (
        <div className="mx-auto max-w-4xl">
          {data.images.map((url, index) => (
            <div key={index} className="relative w-full">
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
      ) : (
        <div className="flex min-h-[calc(100vh-60px)] flex-col items-center justify-center">
          <div className="relative max-h-[85vh] max-w-full">
            <Image
              src={`/api/image?url=${encodeURIComponent(data.images[currentPage])}`}
              alt={`Page ${currentPage + 1}`}
              width={1200}
              height={1800}
              className="h-auto max-h-[85vh] w-auto"
              unoptimized
              priority
            />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              variant="secondary"
            >
              上一頁
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage + 1} / {data.total}
            </span>
            <Button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === data.total - 1}
              variant="secondary"
            >
              下一頁
            </Button>
          </div>
        </div>
      )}

      {/* 底部導航 */}
      <footer className="sticky bottom-0 flex items-center justify-between bg-background/95 px-4 py-3 backdrop-blur">
        {data.prevCid ? (
          <Button asChild variant="secondary">
            <Link href={`/read/${mangaId}/${data.prevCid}`}>上一章</Link>
          </Button>
        ) : (
          <div />
        )}
        <span className="text-sm text-muted-foreground">共 {data.total} 頁</span>
        {data.nextCid ? (
          <Button asChild variant="secondary">
            <Link href={`/read/${mangaId}/${data.nextCid}`}>下一章</Link>
          </Button>
        ) : (
          <div />
        )}
      </footer>
    </div>
  );
}
