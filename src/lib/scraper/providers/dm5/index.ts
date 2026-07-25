/**
 * dm5 MangaProvider 實作
 * 來源：https://www.dm5.cn
 */

import type { MangaInfo, MangaListItem, RankItem } from '@/lib/scraper/types';
import { RankTypeEnum } from '@/lib/scraper/types';
import {
  fetchMangaDetail,
  fetchMangaList,
  fetchSearch,
  fetchRankList,
  fetchUpdateList,
} from './fetcher';
import {
  parseMangaDetail,
  parseMangaList,
  parseRankList,
  parseUpdateList,
} from './parser';
import { getChapterImages, buildImageReferer } from './chapter';
import { computePrevNextCid } from '@/lib/chapter-utils';
import type {
  MangaProvider,
  MangaListParams,
  ListResult,
  ChapterImages,
  ImageProxyConfig,
} from '../types';

/**
 * dm5 rank type → t 參數映射
 * dm5 排行是依漫畫地區/類型分榜，非時間維度。
 * Day   → t=2 日漫榜（日系為主流；最接近「熱門日排」語意）
 * Week  → t=3 綜合榜
 * Month → t=1 国漫榜
 * Total → 無 t（全部榜單）
 */
const RANK_T_MAP: Record<RankTypeEnum, number | undefined> = {
  [RankTypeEnum.Day]: 2,
  [RankTypeEnum.Week]: 3,
  [RankTypeEnum.Month]: 1,
  [RankTypeEnum.Total]: undefined,
};

const imageProxy: ImageProxyConfig = {
  allowedDomains: ['cdndm5.com'],
  // 靜態 referer 作 fallback（封面圖走此；章節圖走 refererBuilder）
  referer: 'https://www.dm5.com/',
  /**
   * 章節圖片 URL 含 ?cid=xxx，用以構建 chapter-specific Referer。
   * 封面圖（mhfm* subdomain）無 cid，回 fallback。
   */
  refererBuilder: buildImageReferer,
};

export const dm5Provider: MangaProvider = {
  id: 'dm5',

  imageProxy,

  async getMangaList(params: MangaListParams): Promise<ListResult<MangaListItem>> {
    const { keyword, page = 1 } = params;
    // Phase 2：只支援 keyword 搜尋與預設列表；per-source filter 為 Phase 4
    const html = keyword
      ? await fetchSearch(keyword, page)
      : await fetchMangaList(page);
    return parseMangaList(html);
  },

  async getMangaDetail(slug: string): Promise<MangaInfo | null> {
    const html = await fetchMangaDetail(slug);
    return parseMangaDetail(html, slug);
  },

  async getChapterImages(slug: string, cid: string): Promise<ChapterImages | null> {
    const result = await getChapterImages(cid);
    if (!result) return null;

    const { vars, images } = result;

    // prev/next 優先從章節頁 HTML 取；若無則從詳情頁章節列表計算
    let prevCid: string | undefined = vars.prevCid;
    let nextCid: string | undefined = vars.nextCid;

    if (prevCid === undefined && nextCid === undefined) {
      const detailHtml = await fetchMangaDetail(slug);
      const mangaInfo = parseMangaDetail(detailHtml, slug);
      if (mangaInfo) {
        const allChapters = mangaInfo.chapters.flatMap((g) => g.chapters);
        const computed = computePrevNextCid(allChapters, cid);
        prevCid = computed.prevCid ?? undefined;
        nextCid = computed.nextCid ?? undefined;
      }
    }

    // bname/cname：從 vars.title 解析（格式: "漫畫名 第N回"）
    const titleParts = vars.title.split(/\s+/);
    const cname = titleParts.pop() ?? vars.title;
    const bname = titleParts.join(' ') || slug;

    return {
      bid: slug,
      cid,
      bname,
      cname,
      images,
      prevCid,
      nextCid,
      total: images.length,
    };
  },

  async getRankList(type: RankTypeEnum): Promise<ListResult<RankItem>> {
    const t = RANK_T_MAP[type];
    const html = await fetchRankList(t);
    const items = parseRankList(html);
    return {
      items,
      pagination: { current: 1, total: 1, totalItems: items.length },
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUpdateList(_page: number): Promise<ListResult<MangaListItem>> {
    // dm5 更新頁無分頁，page 參數保留介面相容性
    const html = await fetchUpdateList();
    return parseUpdateList(html);
  },
};
