'use client';

import { use } from 'react';
import Reader from '@/components/Reader';

export default function ReadPage({
  params,
}: {
  params: Promise<{ bid: string; cid: string }>;
}) {
  const { bid, cid } = use(params);
  const mangaId = parseInt(bid, 10);
  const chapterId = parseInt(cid, 10);

  if (isNaN(mangaId) || isNaN(chapterId)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-xl text-red-500">Invalid ID</div>
      </div>
    );
  }

  return <Reader mangaId={mangaId} chapterId={chapterId} />;
}
