'use client';

import { ErrorFallback, type ErrorBoundaryProps } from '@/components/ErrorFallback';

export default function RankError(props: ErrorBoundaryProps) {
  return <ErrorFallback {...props} title="載入排行榜失敗" backHref="/" backLabel="返回首頁" />;
}
