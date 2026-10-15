'use client';

import { ErrorFallback, type ErrorBoundaryProps } from '@/components/ErrorFallback';

export default function FavoritesError(props: ErrorBoundaryProps) {
  return <ErrorFallback {...props} title="載入收藏失敗" backHref="/" backLabel="返回首頁" />;
}
