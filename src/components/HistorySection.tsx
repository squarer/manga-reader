'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useHistory } from '@/lib/hooks/useHistory';

export default function HistorySection() {
  const { history, isLoaded, clearHistory } = useHistory();

  if (!isLoaded || history.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">最近閱讀</h2>
        <button
          onClick={clearHistory}
          className="text-sm text-gray-400 hover:text-red-400"
        >
          清除歷史
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {history.slice(0, 10).map((item) => (
          <Link
            key={`${item.mangaId}-${item.chapterId}`}
            href={`/read/${item.mangaId}/${item.chapterId}`}
            className="group flex-shrink-0"
          >
            <div className="relative h-32 w-24 overflow-hidden rounded-lg bg-gray-800">
              <Image
                src={`/api/image?url=${encodeURIComponent(item.mangaCover)}`}
                alt={item.mangaName}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="truncate text-xs text-gray-300">{item.chapterName}</p>
              </div>
            </div>
            <p className="mt-1 w-24 truncate text-xs text-gray-300 group-hover:text-blue-400">
              {item.mangaName}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
