import { Skeleton } from '@/components/ui/skeleton';
import { DENSE_GRID_CLASS } from '@/lib/constants';

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div className={DENSE_GRID_CLASS}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </main>
  );
}
