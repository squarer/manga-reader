'use client';

import { ErrorFallback, type ErrorBoundaryProps } from '@/components/ErrorFallback';

export default function HistoryError(props: ErrorBoundaryProps) {
  return <ErrorFallback {...props} title="載入閱讀紀錄失敗" backHref="/" backLabel="返回首頁" />;
}
