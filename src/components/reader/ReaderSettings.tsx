'use client';

/**
 * Reader 設定面板和快捷鍵說明
 */

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Settings, BookOpen, Scroll, X } from 'lucide-react';
import { SHORTCUTS } from './types';
import type { ReaderSettings as ReaderSettingsType } from './types';

/** SettingsPanel props */
interface SettingsPanelProps {
  settings: ReaderSettingsType;
  onUpdate: (updates: Partial<ReaderSettingsType>) => void;
}

/**
 * 設定面板
 *
 * 側邊滑出的設定面板，包含閱讀模式和圖片寬度調整
 */
export function SettingsPanel({ settings, onUpdate }: SettingsPanelProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>閱讀設定</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* 閱讀模式 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">閱讀模式</label>
            <div className="flex gap-2">
              <Button
                variant={settings.viewMode === 'single' ? 'secondary' : 'ghost'}
                className="flex-1"
                onClick={() => onUpdate({ viewMode: 'single' })}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                單頁
              </Button>
              <Button
                variant={settings.viewMode === 'scroll' ? 'secondary' : 'ghost'}
                className="flex-1"
                onClick={() => onUpdate({ viewMode: 'scroll' })}
              >
                <Scroll className="mr-2 h-4 w-4" />
                滾動
              </Button>
            </div>
          </div>

          {/* 圖片寬度 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">圖片寬度</label>
              <span className="text-sm text-muted-foreground">
                {settings.imageWidth}%
              </span>
            </div>
            <Slider
              value={[settings.imageWidth]}
              onValueChange={([value]) => onUpdate({ imageWidth: value })}
              min={50}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

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
