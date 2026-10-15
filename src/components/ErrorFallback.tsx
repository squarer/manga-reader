'use client';

import { useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Next.js error.tsx 接收的 props */
export interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface ErrorFallbackProps extends ErrorBoundaryProps {
  title: string;
  backHref: string;
  backLabel: string;
  /** dark：閱讀器固定深色底 */
  tone?: 'default' | 'dark';
}

const TONE_STYLES = {
  default: {
    container: '',
    icon: 'text-destructive',
    message: 'text-muted-foreground',
    retryVariant: 'default',
  },
  dark: {
    container: 'bg-zinc-950 text-white',
    icon: 'text-red-500',
    message: 'text-zinc-400',
    retryVariant: 'secondary',
  },
} as const;

export function ErrorFallback({ error, reset, title, backHref, backLabel, tone = 'default' }: ErrorFallbackProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const styles = TONE_STYLES[tone];

  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleRetry = () => {
    // 錯誤來自 Server Component 取資料失敗；單獨 reset() 只會用同一份 RSC payload 在 client 重繪，
    // 錯誤必然重現。需先 router.refresh() 向伺服器重新請求，再於同一 transition 內 reset() 重繪邊界。
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div
      className={cn('flex min-h-screen flex-col items-center justify-center gap-4 px-4', styles.container)}
      role="alert"
    >
      <AlertCircle className={cn('h-12 w-12', styles.icon)} />
      <h2 className="text-xl font-serif font-medium">{title}</h2>
      <p className={cn('max-w-md text-center text-sm', styles.message)}>{error.message}</p>
      <div className="flex gap-3">
        <Button onClick={handleRetry} variant={styles.retryVariant} disabled={isPending}>
          {isPending ? '重試中…' : '重試'}
        </Button>
        <Button variant="outline" asChild>
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
