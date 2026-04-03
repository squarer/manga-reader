'use client';

import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DESIGN_THEMES } from '@/lib/design-theme';
import { useDesignTheme } from '@/lib/hooks/useDesignTheme';

export function DesignThemeToggle() {
  const { designTheme, setDesignTheme } = useDesignTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          title="切換設計主題"
          suppressHydrationWarning
        >
          <Palette className="h-4 w-4" />
          <span className="sr-only">切換設計主題</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end" sideOffset={8}>
        <div className="space-y-1">
          {DESIGN_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setDesignTheme(theme.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm',
                'transition-colors duration-150',
                designTheme === theme.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <div className="flex -space-x-1">
                <div
                  className="h-4 w-4 rounded-full border border-border/50"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="h-4 w-4 rounded-full border border-border/50"
                  style={{ backgroundColor: theme.colors.background }}
                />
              </div>
              <span className="font-medium">{theme.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
