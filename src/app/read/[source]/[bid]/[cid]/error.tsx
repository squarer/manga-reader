'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ReaderError({ error, reset }: ErrorProps) {
  const pathname = usePathname();
  // pathname: /read/[source]/[bid]/[cid] → segments [0]='', [1]='read', [2]=source, [3]=bid
  const segments = pathname?.split('/') ?? [];
  const source = segments[2];
  const bid = segments[3];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-white" role="alert">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h2 className="text-xl font-serif font-medium">載入章節失敗</h2>
      <p className="max-w-md text-center text-sm text-zinc-400">{error.message}</p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="secondary">
          重試
        </Button>
        <Button variant="outline" asChild>
          <Link href={bid ? `/manga/${source}/${bid}` : '/'}>返回漫畫</Link>
        </Button>
      </div>
    </div>
  );
}
