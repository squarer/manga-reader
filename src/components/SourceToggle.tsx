'use client';

/**
 * 來源分段切換控制
 * 供 Navbar 桌機版操作區與手機版選單共用
 */

import type { SourceId } from '@/lib/scraper/types';
import { useSource, SOURCE_LABELS } from '@/components/SourceProvider';
import { cn } from '@/lib/utils';

const SOURCES: SourceId[] = ['manhuagui', 'dm5'];

export function SourceToggle() {
  const { source, setSource } = useSource();

  return (
    <div className="flex items-center rounded-full bg-muted/60 p-0.5 gap-0.5">
      {SOURCES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setSource(s)}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 whitespace-nowrap',
            source === s
              ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-pressed={source === s}
        >
          {SOURCE_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
