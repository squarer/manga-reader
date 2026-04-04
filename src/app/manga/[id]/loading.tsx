import { Skeleton } from '@/components/ui/skeleton';

export default function MangaDetailLoading() {
  return (
    <>
      {/* Hero 骨架 */}
      <div className="relative -mt-40 min-h-[60vh] overflow-hidden pt-40">
        <div className="absolute inset-0 -top-40 bg-muted" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

        {/* 返回按鈕 */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6">
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>

        {/* 主要內容 */}
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 pb-12 pt-8 md:flex-row md:items-start md:pt-12">
          {/* 封面 */}
          <Skeleton className="h-72 w-48 flex-shrink-0 rounded-lg md:h-80 md:w-56" />

          {/* 資訊區 */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <Skeleton className="mx-auto h-10 w-3/4 md:mx-0" />
            <Skeleton className="mx-auto h-5 w-1/2 md:mx-0" />
            <div className="flex justify-center gap-2 md:justify-start">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="mx-auto h-20 w-full max-w-2xl md:mx-0" />
            <div className="flex justify-center gap-3 md:justify-start">
              <Skeleton className="h-12 w-36" />
              <Skeleton className="h-12 w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* 章節列表骨架 */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-4 h-8 w-24" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </>
  );
}
