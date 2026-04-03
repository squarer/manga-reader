'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  count?: number;
  actions?: React.ReactNode;
}

export function PageHeader({ icon: Icon, title, subtitle, count, actions }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Icon className="h-6 w-6 text-foreground" />
        <div>
          <h1 className="text-2xl font-serif font-medium">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {count !== undefined && count > 0 && (
          <span className="text-sm text-muted-foreground">({count} 部)</span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
