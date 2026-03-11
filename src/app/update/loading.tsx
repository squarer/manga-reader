import { Skeleton } from '@/components/ui/skeleton';

export default function UpdateLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* 標題骨架 */}
        <Skeleton className="mb-6 h-8 w-32" />

        {/* 日期分組骨架 */}
        {Array.from({ length: 2 }).map((_, groupIdx) => (
          <div key={groupIdx} className="mb-8">
            <Skeleton className="mb-4 h-6 w-24" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
