'use client';

import { ErrorFallback, type ErrorBoundaryProps } from '@/components/ErrorFallback';

export default function RootError(props: ErrorBoundaryProps) {
  return <ErrorFallback {...props} title="發生錯誤" backHref="/" backLabel="返回首頁" />;
}
