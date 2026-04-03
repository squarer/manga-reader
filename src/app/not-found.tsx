import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4" role="alert">
      <FileQuestion className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-serif font-medium">找不到頁面</h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        您要找的頁面不存在或已被移除
      </p>
      <Button asChild>
        <Link href="/">返回首頁</Link>
      </Button>
    </div>
  );
}
