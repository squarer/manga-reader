/**
 * manhuagui MangaProvider 實作
 */

import type { MangaInfo, MangaListItem, RankItem } from '@/lib/scraper/types';
import { RankTypeEnum } from '@/lib/scraper/types';
import {
  fetchMangaList,
  fetchMangaListWithFilters,
  fetchMangaDetail,
  fetchChapterPage,
  fetchRankList,
  fetchUpdateList,
  searchManga,
} from './fetcher';
import {
  parseMangaList,
  parseMangaDetail,
  parseRankList,
  parseUpdateList,
} from './parser';
import { decryptChapterPage, buildImageUrl } from './decrypt';
import { computePrevNextCid } from '@/lib/chapter-utils';
import type {
  MangaProvider,
  MangaListParams,
  ListResult,
  ChapterImages,
  ImageProxyConfig,
} from '../types';

const imageProxy: ImageProxyConfig = {
  allowedDomains: [
    'i.hamreus.com',
    'us.hamreus.com',
    'eu.hamreus.com',
    'cf.mhgui.com',
    'cf2.mhgui.com',
  ],
  referer: 'https://www.manhuagui.com/',
};

export const manhuaguiProvider: MangaProvider = {
  id: 'manhuagui',

  imageProxy,

  async getMangaList(params: MangaListParams): Promise<ListResult<MangaListItem>> {
    const { keyword, category, region, genre, year, letter, status, sort, page = 1 } = params;

    let html: string;
    if (keyword) {
      html = await searchManga(keyword, page);
    } else if (region || genre || year || letter || status || sort) {
      html = await fetchMangaListWithFilters({ region, genre, year, letter, status, sort, page });
    } else {
      html = await fetchMangaList(category || 'japan', page);
    }

    const result = parseMangaList(html);
    return {
      ...result,
      items: result.items.map((item) => ({ ...item, source: 'manhuagui' as const })),
    };
  },

  async getMangaDetail(mangaId: string): Promise<MangaInfo | null> {
    const html = await fetchMangaDetail(Number(mangaId));
    const parsed = parseMangaDetail(html, mangaId);
    if (!parsed) return null;

    const manga: MangaInfo = { ...parsed, source: 'manhuagui' };

    // 如果 HTML 解析沒取得評分，嘗試從 vote API 計算
    if (!manga.score) {
      try {
        const voteUrl = `https://www.manhuagui.com/tools/vote.ashx?act=get&bid=${mangaId}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        try {
          const res = await fetch(voteUrl, {
            headers: { Referer: 'https://www.manhuagui.com/' },
            signal: controller.signal,
          });

          // vote API 回傳 { success: true, data: { s1, s2, s3, s4, s5 } }
          // s1-s5 代表各星級的投票數（1-5星），網站顯示10分制
          if (res.ok) {
            const json = await res.json();
            if (json?.success && json?.data) {
              const { s1, s2, s3, s4, s5 } = json.data;
              const totalVotes = s1 + s2 + s3 + s4 + s5;

              if (totalVotes > 0) {
                // 加權平均（轉換為10分制：1星=2分, 2星=4分, ..., 5星=10分）
                const weightedSum = s1 * 2 + s2 * 4 + s3 * 6 + s4 * 8 + s5 * 10;
                manga.score = Math.round((weightedSum / totalVotes) * 10) / 10;
              }
            }
          }
        } finally {
          clearTimeout(timer);
        }
      } catch {
        // 評分取得失敗不影響主要功能
      }
    }

    return manga;
  },

  async getChapterImages(mangaId: string, chapterId: string): Promise<ChapterImages | null> {
    const mangaIdNum = Number(mangaId);
    const chapterIdNum = Number(chapterId);

    // 並行獲取章節頁面和漫畫詳情
    const [chapterHtml, mangaHtml] = await Promise.all([
      fetchChapterPage(mangaIdNum, chapterIdNum),
      fetchMangaDetail(mangaIdNum),
    ]);

    const imageData = decryptChapterPage(chapterHtml);
    if (!imageData) return null;

    // 構建完整的圖片 URL 列表
    const images = imageData.files.map((filename) =>
      buildImageUrl(imageData.path, filename, imageData.sl)
    );

    // 計算上下章 ID（string 邊界；ImageData 內部用 number）
    let prevCid: string | null = imageData.prevcid != null ? String(imageData.prevcid) : null;
    let nextCid: string | null = imageData.nextcid != null ? String(imageData.nextcid) : null;

    // 如果解密數據沒有 prev/next，從漫畫詳情計算
    if (prevCid === null || nextCid === null) {
      const mangaInfo = parseMangaDetail(mangaHtml, mangaId);
      if (mangaInfo) {
        const allChapters = mangaInfo.chapters.flatMap((g) => g.chapters);
        const computed = computePrevNextCid(allChapters, chapterId);
        if (prevCid === null) prevCid = computed.prevCid;
        if (nextCid === null) nextCid = computed.nextCid;
      }
    }

    return {
      bid: String(imageData.bid),
      cid: String(imageData.cid),
      bname: imageData.bname,
      cname: imageData.cname,
      images,
      prevCid: prevCid ?? undefined,
      nextCid: nextCid ?? undefined,
      total: images.length,
      source: 'manhuagui',
      mangaCover: `/cpic/b/${imageData.bid}.jpg`,
    };
  },

  async getRankList(type: RankTypeEnum): Promise<ListResult<RankItem>> {
    const html = await fetchRankList(type);
    const items = parseRankList(html, type);
    return {
      items: items.map((item) => ({ ...item, source: 'manhuagui' as const })),
      pagination: { current: 1, total: 1, totalItems: items.length },
    };
  },

  async getUpdateList(page: number): Promise<ListResult<MangaListItem>> {
    const html = await fetchUpdateList(page);
    const result = parseUpdateList(html);
    return {
      ...result,
      items: result.items.map((item) => ({ ...item, source: 'manhuagui' as const })),
    };
  },
};
