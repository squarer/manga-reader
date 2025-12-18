/**
 * Reader 元件型別定義和常數
 */

/** Reader 元件 props */
export interface ReaderProps {
  mangaId: number;
  chapterId: number;
}

/** 章節資料 */
export interface ChapterData {
  bid: number;
  cid: number;
  bname: string;
  cname: string;
  images: string[];
  prevCid?: number;
  nextCid?: number;
  total: number;
}

/** 閱讀模式 */
export type ViewMode = 'single' | 'scroll';

/** 閱讀器設定 */
export interface ReaderSettings {
  viewMode: ViewMode;
  imageWidth: number;
}

/** 工具列自動隱藏延遲時間（毫秒） */
export const TOOLBAR_HIDE_DELAY = 3000;

/** 預設閱讀器設定 */
export const DEFAULT_SETTINGS: ReaderSettings = {
  viewMode: 'scroll',
  imageWidth: 100,
};

/** 快捷鍵列表 */
export const SHORTCUTS = [
  { key: '← / A', description: '上一頁' },
  { key: '→ / D', description: '下一頁' },
  { key: '[ / ,', description: '上一章' },
  { key: '] / .', description: '下一章' },
  { key: 'F', description: '全螢幕' },
  { key: 'M', description: '切換模式' },
  { key: 'Esc', description: '退出全螢幕' },
  { key: '?', description: '快捷鍵說明' },
] as const;
