import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, message, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Icon className="h-16 w-16 text-muted-foreground/30" />
      <p className="text-lg text-muted-foreground">{message}</p>
      {actionLabel && actionHref && (
        <Button asChild variant="outline">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button onClick={onAction} variant="outline">{actionLabel}</Button>
      )}
    </div>
  );
}
