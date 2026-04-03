'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function UpdateError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4" role="alert">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-serif font-medium">載入最新更新失敗</h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">{error.message}</p>
      <div className="flex gap-3">
        <Button onClick={reset}>重試</Button>
        <Button variant="outline" asChild>
          <Link href="/">返回首頁</Link>
        </Button>
      </div>
    </div>
  );
}
