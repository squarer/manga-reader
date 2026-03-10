import { Skeleton } from '@/components/ui/skeleton';

export default function RankLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* 標題骨架 */}
        <Skeleton className="mb-6 h-8 w-24" />

        {/* 標籤骨架 */}
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-16 rounded-md" />
          ))}
        </div>

        {/* 排行列表骨架 */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
              <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
              <Skeleton className="h-16 w-12 flex-shrink-0 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
