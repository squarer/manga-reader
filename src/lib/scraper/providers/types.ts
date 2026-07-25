import type {
  MangaInfo, MangaListItem, RankItem, PaginationInfo, FilterOptions, RankTypeEnum, SourceId,
} from '../types';

// SourceId 定義已移至 ../types（核心 domain 型別）；此處 re-export 保持既有 import 路徑不壞
export type { SourceId } from '../types';

export interface ListResult<T> {
  items: T[];
  pagination: PaginationInfo;
}

/** 解密後統一的章節圖片資料(跨 provider 邊界一律 string id) */
export interface ChapterImages {
  bid: string;
  cid: string;
  bname: string;
  cname: string;
  images: string[];      // 完整、可經 /api/image 代理的圖片 URL
  prevCid?: string;
  nextCid?: string;
  total: number;
  /** 資料來源 */
  source: SourceId;
  /** 封面圖 URL（用於 Reader 寫入閱讀歷史；各 provider 封面路徑不同） */
  mangaCover?: string;
}

export interface MangaListParams extends FilterOptions {
  /** 有值時為搜尋模式 */
  keyword?: string;
  /** 舊版分類列表相容(預設 japan) */
  category?: string;
}

/** 圖片代理設定:允許網域 + 防盜鏈 Referer */
export interface ImageProxyConfig {
  allowedDomains: string[];
  /** 靜態 Referer；若圖片需要動態 Referer，改用 refererBuilder */
  referer: string;
  /**
   * 動態 Referer 產生器。存在時優先於 referer。
   * 用於 dm5 等需要 chapter-specific Referer 的 provider。
   */
  refererBuilder?: (imageUrl: string) => string;
}

export interface MangaProvider {
  readonly id: SourceId;
  getMangaList(params: MangaListParams): Promise<ListResult<MangaListItem>>;
  getMangaDetail(mangaId: string): Promise<MangaInfo | null>;
  getChapterImages(mangaId: string, chapterId: string): Promise<ChapterImages | null>;
  getRankList(type: RankTypeEnum): Promise<ListResult<RankItem>>;
  getUpdateList(page: number): Promise<ListResult<MangaListItem>>;
  readonly imageProxy: ImageProxyConfig;
}
