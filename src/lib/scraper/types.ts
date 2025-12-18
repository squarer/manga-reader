// 漫畫基本資訊
export interface MangaInfo {
  id: number;
  name: string;
  cover: string;
  author: string;
  status: string; // 連載中 / 已完結
  genres: string[];
  description: string;
  lastUpdate: string;
  chapters: ChapterGroup[];
}

// 章節分組 (單話、番外篇等)
export interface ChapterGroup {
  title: string;
  chapters: ChapterInfo[];
}

// 章節資訊
export interface ChapterInfo {
  id: number;
  name: string;
  url: string;
}

// 閱讀器圖片資料 (從加密 JS 解出)
export interface ImageData {
  bid: number;      // 漫畫 ID
  cid: number;      // 章節 ID
  bname: string;    // 漫畫名
  cname: string;    // 章節名
  files: string[];  // 圖片檔名列表
  path: string;     // 圖片路徑
  sl: {             // 簽名參數
    e: number;
    m: string;
  };
  prevcid?: number; // 上一章節 ID
  nextcid?: number; // 下一章節 ID
}

// 漫畫列表項目
export interface MangaListItem {
  id: number;
  name: string;
  cover: string;
  latestChapter: string;
  updateTime: string;
  score?: number;
}

// 列表頁分頁資訊
export interface PaginationInfo {
  current: number;
  total: number;
  totalItems: number;
}

// API 回應格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
