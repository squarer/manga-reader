'use client';

import { usePathname } from 'next/navigation';
import { ErrorFallback, type ErrorBoundaryProps } from '@/components/ErrorFallback';

export default function ReaderError(props: ErrorBoundaryProps) {
  const pathname = usePathname();
  // pathname: /read/[source]/[bid]/[cid] → segments [0]='', [1]='read', [2]=source, [3]=bid
  const segments = pathname?.split('/') ?? [];
  const source = segments[2];
  const bid = segments[3];

  return (
    <ErrorFallback
      {...props}
      title="載入章節失敗"
      backHref={bid ? `/manga/${source}/${bid}` : '/'}
      backLabel="返回漫畫"
      tone="dark"
    />
  );
}
