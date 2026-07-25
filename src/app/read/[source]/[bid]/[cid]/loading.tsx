import { Skeleton } from '@/components/ui/skeleton';

export default function ReaderLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 頂部工具列骨架 */}
      <div className="flex h-14 items-center justify-between px-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-20" />
      </div>

      {/* 圖片區骨架 */}
      <div className="flex flex-1 flex-col items-center gap-2 px-4 py-4">
        <Skeleton className="aspect-[2/3] w-full max-w-2xl" />
        <Skeleton className="aspect-[2/3] w-full max-w-2xl" />
        <Skeleton className="aspect-[2/3] w-full max-w-2xl" />
      </div>

      {/* 底部導航骨架 */}
      <div className="flex h-16 items-center justify-between px-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
