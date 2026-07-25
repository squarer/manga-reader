'use client';

import dynamic from 'next/dynamic';
const Reader = dynamic(() => import('@/components/reader'), { ssr: false });
import type { ChapterData } from '@/components/reader/types';
import type { SourceId } from '@/lib/scraper/types';

interface ReaderContentProps {
  source: string;
  bid: string;
  cid: string;
  /** Server Component 預取資料，有值時略過 Client fetch */
  initialData?: ChapterData | null;
}

/**
 * 閱讀器內容（Client Component）
 */
export default function ReaderContent({ source, bid, cid, initialData }: ReaderContentProps) {
  if (!bid || !bid.trim() || !cid || !cid.trim()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xl text-destructive">Invalid ID</div>
      </div>
    );
  }

  // source 從 route param 取得（string），cast 為 SourceId；
  // getProvider 對未知 source 已 fallback 到 manhuagui，此處 cast 安全
  return (
    <Reader
      source={source as SourceId}
      mangaId={bid}
      chapterId={cid}
      initialData={initialData}
    />
  );
}
