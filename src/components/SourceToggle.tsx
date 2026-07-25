'use client';

/**
 * 來源多選切換控制
 * 供 Navbar 桌機版操作區與手機版選單共用
 * 兩站可獨立勾選，至少保留一站（唯一選中者點擊 no-op）
 */

import { useSource, SOURCE_LABELS, SOURCE_IDS, SOURCE_COLORS } from '@/components/SourceProvider';
import { cn } from '@/lib/utils';

export function SourceToggle() {
  const { sources, toggleSource } = useSource();

  return (
    <div className="flex items-center rounded-full bg-muted/60 p-0.5 gap-0.5">
      {SOURCE_IDS.map((s) => {
        const selected = sources.includes(s);
        // 唯一選中者不可再取消
        const isOnlySelected = selected && sources.length === 1;
        return (
          <button
            key={s}
            type="button"
            onClick={() => toggleSource(s)}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 whitespace-nowrap',
              selected
                ? cn(SOURCE_COLORS[s], 'bg-background shadow-sm ring-1')
                : 'text-muted-foreground hover:text-foreground',
              isOnlySelected && 'cursor-default'
            )}
            aria-pressed={selected}
          >
            {SOURCE_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}
