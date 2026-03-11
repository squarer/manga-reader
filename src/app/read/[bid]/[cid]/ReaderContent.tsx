'use client';

import Reader from '@/components/reader';
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
  const mangaId = parseInt(bid, 10);
  const chapterId = parseInt(cid, 10);

  if (isNaN(mangaId) || isNaN(chapterId)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xl text-destructive">Invalid ID</div>
      </div>
    );
  }

  return <Reader mangaId={mangaId} chapterId={chapterId} initialData={initialData} />;
}
