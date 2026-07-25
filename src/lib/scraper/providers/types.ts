import type {
  MangaInfo, MangaListItem, RankItem, PaginationInfo, FilterOptions, RankTypeEnum,
} from '../types';

export type SourceId = 'manhuagui'; // dm5 於 Phase 2 加入

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
  referer: string;
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
