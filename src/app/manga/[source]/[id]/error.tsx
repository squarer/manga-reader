'use client';

import { ErrorFallback, type ErrorBoundaryProps } from '@/components/ErrorFallback';

export default function MangaDetailError(props: ErrorBoundaryProps) {
  return <ErrorFallback {...props} title="載入漫畫詳情失敗" backHref="/" backLabel="返回首頁" />;
}
