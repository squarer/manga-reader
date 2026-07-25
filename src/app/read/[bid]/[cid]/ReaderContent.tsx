'use client';

import dynamic from 'next/dynamic';
const Reader = dynamic(() => import('@/components/reader'), { ssr: false });
import type { ChapterData } from '@/components/reader/types';

interface ReaderContentProps {
  bid: string;
  cid: string;
  /** Server Component 預取資料，有值時略過 Client fetch */
  initialData?: ChapterData | null;
}

/**
 * 閱讀器內容（Client Component）
 */
export default function ReaderContent({ bid, cid, initialData }: ReaderContentProps) {
  if (!bid || !bid.trim() || !cid || !cid.trim()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xl text-destructive">Invalid ID</div>
      </div>
    );
  }

  return <Reader mangaId={bid} chapterId={cid} initialData={initialData} />;
}
