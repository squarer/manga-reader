'use client';

import { ErrorFallback, type ErrorBoundaryProps } from '@/components/ErrorFallback';

export default function UpdateError(props: ErrorBoundaryProps) {
  return <ErrorFallback {...props} title="載入最新更新失敗" backHref="/" backLabel="返回首頁" />;
}
