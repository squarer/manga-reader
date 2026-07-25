'use client';

/**
 * 桌面版搜尋框元件
 */

import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DesktopSearchProps {
  onSearch: (keyword: string) => void;
  keyword?: string;
  /** 搜尋紀錄（MRU，最新在前） */
  history: string[];
  /** 刪除單筆紀錄 */
  onRemoveHistory: (keyword: string) => void;
  /** 清除全部紀錄 */
  onClearHistory: () => void;
}

export function DesktopSearch({
  onSearch,
  keyword = '',
  history,
  onRemoveHistory,
  onClearHistory,
}: DesktopSearchProps) {
  const [prevKeyword, setPrevKeyword] = useState(keyword);
  const [isExpanded, setIsExpanded] = useState(!!keyword);
  const [searchValue, setSearchValue] = useState(keyword);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 展開且 focus 且有紀錄時才顯示下拉（收合狀態不顯示）
  const showHistory = isExpanded && isFocused && history.length > 0;

  /** 同步 URL keyword 到輸入框（render 期間同步，避免 useEffect 觸發 lint 警告） */
  if (prevKeyword !== keyword) {
    setPrevKeyword(keyword);
    setSearchValue(keyword);
    setIsExpanded(!!keyword);
  }

  /** 展開時自動聚焦（僅無 keyword 時） */
  useEffect(() => {
    if (isExpanded && !keyword && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded, keyword]);

  /**
   * 執行搜尋並收尾（提交/點擊紀錄共用的終結路徑）。
   * 須主動 blur 釋放 DOM 焦點：下拉以 onMouseDown preventDefault 保留 input 焦點，
   * 若只設 isFocused=false 而不 blur，input 仍是 activeElement，再次點擊不觸發 onFocus，下拉出不來。
   */
  const finishSearch = (term: string) => {
    onSearch(term);
    inputRef.current?.blur();
    setIsFocused(false);
    // 直接反映搜尋詞、不依賴 URL keyword 變更後的 render 同步：
    // 點擊與當前 keyword 相同的紀錄時 keyword 不變、同步不觸發，欄位會被清空
    setPrevKeyword(term);
    setSearchValue(term);
    setIsExpanded(true);
  };

  /** 處理搜尋提交 */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchValue.trim();
    if (term) finishSearch(term);
  };

  /** 處理失去焦點（下拉內元素以 onMouseDown preventDefault 保留焦點，不會觸發此路徑） */
  const handleBlur = () => {
    setIsFocused(false);
    if (!searchValue) {
      setIsExpanded(false);
    }
  };

  return (
    <div className="hidden items-center md:flex">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        {/* 搜尋按鈕 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 rounded-full transition-all duration-300',
            isExpanded && 'opacity-0 scale-75 pointer-events-none absolute'
          )}
          onClick={() => setIsExpanded(true)}
          title="搜尋"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* 展開的搜尋框 */}
        <div
          className={cn(
            'flex items-center gap-1 overflow-hidden transition-all duration-300 ease-out',
            isExpanded ? 'w-52 opacity-100' : 'w-0 opacity-0 pointer-events-none'
          )}
        >
          <Input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder="搜尋漫畫..."
            className={cn(
              'h-8 w-40 rounded-full transition-all duration-200',
              'bg-muted border-transparent',
              'focus-visible:ring-0 focus-visible:border-transparent',
              'focus:w-44'
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 rounded-full"
            onClick={() => {
              setIsExpanded(false);
              setSearchValue('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 搜尋紀錄下拉（錨在 form 的 relative 上，避開展開容器的 overflow-hidden 裁切） */}
        {/* onMouseDown preventDefault：點擊項目/刪除時保留 input 焦點，不觸發 blur 收合 */}
        {showHistory && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className="absolute left-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border/60 bg-popover shadow-lg"
          >
            <ul className="max-h-72 overflow-y-auto py-1">
              {history.map((term) => (
                <li key={term} className="group flex items-center gap-2 px-3 py-1.5 hover:bg-accent">
                  <button
                    type="button"
                    onClick={() => finishSearch(term)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <Clock className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{term}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveHistory(term)}
                    className="flex-shrink-0 rounded-full p-0.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
                    title="刪除此紀錄"
                    aria-label={`刪除搜尋紀錄 ${term}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onClearHistory}
              className="w-full border-t border-border/60 px-3 py-2 text-center text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              全部清除
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
