'use client';

/**
 * Reader 快捷鍵說明
 */

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { SHORTCUTS } from './types';

/** ShortcutsPanel props */
interface ShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 快捷鍵說明面板
 *
 * 全螢幕覆蓋的快捷鍵說明
 */
export function ShortcutsPanel({ isOpen, onClose }: ShortcutsPanelProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80"
      onClick={onClose}
    >
      <div
        className="w-80 rounded-lg border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">快捷鍵</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map(({ key, description }) => (
            <div
              key={key}
              className="flex items-center justify-between text-sm"
            >
              <kbd className="rounded bg-muted px-2 py-1 font-mono text-muted-foreground">
                {key}
              </kbd>
              <span className="text-muted-foreground">{description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
