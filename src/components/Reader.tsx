'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

          // 記錄閱讀歷史
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

  // 鍵盤導航
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="text-xl text-red-500">{error || '載入失敗'}</div>
        <Link
          href={`/manga/${mangaId}`}
          className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-700"
        >
          返回漫畫詳情
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* 頂部導航 */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-gray-900/95 px-4 py-3 backdrop-blur">
        <Link
          href={`/manga/${mangaId}`}
          className="text-gray-400 hover:text-white"
        >
          ← 返回
        </Link>
        <div className="text-center">
          <h1 className="text-sm font-medium">{data.bname}</h1>
          <p className="text-xs text-gray-400">{data.cname}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'single' ? 'scroll' : 'single')}
            className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600"
          >
            {viewMode === 'single' ? '滾動' : '單頁'}
          </button>
        </div>
      </header>

      {/* 閱讀區域 */}
      {viewMode === 'scroll' ? (
        // 滾動模式
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
        // 單頁模式
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
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="rounded bg-gray-700 px-4 py-2 disabled:opacity-50"
            >
              上一頁
            </button>
            <span className="text-sm">
              {currentPage + 1} / {data.total}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === data.total - 1}
              className="rounded bg-gray-700 px-4 py-2 disabled:opacity-50"
            >
              下一頁
            </button>
          </div>
        </div>
      )}

      {/* 底部導航 */}
      <footer className="sticky bottom-0 flex items-center justify-between bg-gray-900/95 px-4 py-3 backdrop-blur">
        {data.prevCid ? (
          <Link
            href={`/read/${mangaId}/${data.prevCid}`}
            className="rounded bg-gray-700 px-4 py-2 hover:bg-gray-600"
          >
            上一章
          </Link>
        ) : (
          <div />
        )}
        <span className="text-sm text-gray-400">
          共 {data.total} 頁
        </span>
        {data.nextCid ? (
          <Link
            href={`/read/${mangaId}/${data.nextCid}`}
            className="rounded bg-gray-700 px-4 py-2 hover:bg-gray-600"
          >
            下一章
          </Link>
        ) : (
          <div />
        )}
      </footer>
    </div>
  );
}
