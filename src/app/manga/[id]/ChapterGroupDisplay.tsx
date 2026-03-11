'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { ChapterGroup } from '@/lib/scraper/types';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const THRESHOLD = 100;
const TAB_COUNT = 5;

/**
 * 章節分組顯示元件（支援分 tab、可折疊、已讀標記）
 */
export default function ChapterGroupDisplay({
  group,
  mangaId,
  readChapterIds,
  defaultOpen = true,
}: {
  group: ChapterGroup;
  mangaId: string;
  readChapterIds: Set<number>;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState(0);

  const needTabs = group.chapters.length > THRESHOLD;
  const chapterPerTab = Math.ceil(group.chapters.length / TAB_COUNT);

  const displayChapters = needTabs
    ? group.chapters.slice(activeTab * chapterPerTab, (activeTab + 1) * chapterPerTab)
    : group.chapters;

  const tabs = needTabs
    ? Array.from({ length: TAB_COUNT }, (_, i) => {
        const start = i * chapterPerTab;
        const end = Math.min((i + 1) * chapterPerTab, group.chapters.length);
        return {
          label: `${group.chapters[start].name} - ${group.chapters[end - 1].name}`,
          count: end - start,
        };
      })
    : [];

  const readCount = group.chapters.filter((ch) => readChapterIds.has(ch.id)).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium">{group.title}</h3>
            <span className="text-sm text-muted-foreground">
              {readCount > 0 && <span className="text-primary">{readCount} / </span>}
              {group.chapters.length} 章
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-4">
        {needTabs && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab, i) => (
              <Button
                key={i}
                onClick={() => setActiveTab(i)}
                variant={activeTab === i ? 'default' : 'outline'}
                size="sm"
                className="flex-shrink-0"
              >
                <div>{tab.label}</div>
                <div className="text-xs opacity-75">({tab.count} 章)</div>
              </Button>
            ))}
          </div>
        )}

        <div role="list" className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {displayChapters.map((chapter) => {
            const isRead = readChapterIds.has(chapter.id);
            return (
              <div key={chapter.id} role="listitem">
                <Button
                  asChild
                  variant={isRead ? 'outline' : 'secondary'}
                  size="sm"
                  className={cn('relative w-full', isRead && 'border-primary/30 text-muted-foreground')}
                >
                  <Link href={`/read/${mangaId}/${chapter.id}`}>
                    {isRead && (
                      <Check className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-primary p-0.5 text-primary-foreground" />
                    )}
                    {chapter.name}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
