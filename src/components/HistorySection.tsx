'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/animate-ui/components/buttons/button';
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
        <Button variant="ghost" size="sm" onClick={clearHistory}>
          清除歷史
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {history.slice(0, 10).map((item) => (
            <Link
              key={`${item.mangaId}-${item.chapterId}`}
              href={`/read/${item.mangaId}/${item.chapterId}`}
              className="group flex-shrink-0"
            >
              <Card className="overflow-hidden border-0 bg-transparent">
                <CardContent className="p-0">
                  <div className="relative h-32 w-24 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={`/api/image?url=${encodeURIComponent(item.mangaCover)}`}
                      alt={item.mangaName}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {item.chapterName}
                      </p>
                    </div>
                  </div>
                  <p className="mt-1 w-24 truncate text-xs text-muted-foreground group-hover:text-primary">
                    {item.mangaName}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
