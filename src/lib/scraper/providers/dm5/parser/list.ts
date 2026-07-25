/**
 * dm5 漫畫列表／搜尋結果解析
 * 共用結構：.mh-item.mh-card-wrap + .manga-info[data attributes]
 */

import * as cheerio from 'cheerio';
import type { MangaListItem, PaginationInfo } from '@/lib/scraper/types';

/**
 * 從 .manga-info div 的 data 屬性提取 MangaListItem。
 * id=numeric mid（dm5 內部），uk=slug（不含 /manhua- 前綴）。
 * 我們用 uk（去掉 manhua- 前綴）作為對外 id，與 getMangaDetail 的 slug 一致。
 */
function parseMangaInfoEl(
  $: ReturnType<typeof cheerio.load>,
  el: cheerio.Element
): MangaListItem | null {
  const $info = $(el);
  const uk = $info.attr('uk') ?? '';          // e.g. "manhua-bailianchengshen"
  const slug = uk.replace(/^manhua-/, '');    // e.g. "bailianchengshen"
  if (!slug) return null;

  const cover = $info.attr('tc') ?? '';
  const name = $info.closest('.mh-item').find('h2.title a').text().trim() ||
    $info.attr('te')?.replace(/\s+第.+$/, '').trim() || '';
  if (!name) return null;

  const latestChapter = $info.attr('tn')?.trim() ?? '';
  const lastUpdate = $info.attr('lt')?.trim() ?? '';

  return {
    id: slug,
    name,
    cover,
    latestChapter,
    updateTime: lastUpdate,
    score: undefined,
  };
}

/** 解析分頁
 * 列表頁：.page-pagination a[data-index].active 為當前頁；所有 data-index 取最大為 total
 * 搜尋頁：.page-pagination a.active text 為當前頁；href ?page=N 取最大為 total
 */
function parsePagination(
  $: ReturnType<typeof cheerio.load>,
  itemCount: number
): PaginationInfo {
  let current = 1;
  let total = 1;

  const $pager = $('.page-pagination');
  if ($pager.length) {
    // 當前頁：data-index on active a（列表），或 active a text（搜尋）
    const $active = $pager.find('a.active');
    if ($active.length) {
      const dataIdx = parseInt($active.attr('data-index') ?? '', 10);
      const textIdx = parseInt($active.text().trim(), 10);
      current = isNaN(dataIdx) ? (isNaN(textIdx) ? 1 : textIdx) : dataIdx;
    }

    const nums: number[] = [];
    $pager.find('a[data-index]').each((_, a) => {
      const n = parseInt($(a).attr('data-index') ?? '', 10);
      if (!isNaN(n)) nums.push(n);
    });
    // search pagination: href contains ?page=N or &page=N
    $pager.find('a[href]').each((_, a) => {
      const m = $(a).attr('href')?.match(/[?&]page=(\d+)/);
      if (m) nums.push(parseInt(m[1], 10));
    });
    if (nums.length) total = Math.max(...nums);
  }

  return { current, total, totalItems: itemCount };
}

export function parseMangaList(html: string): {
  items: MangaListItem[];
  pagination: PaginationInfo;
} {
  const $ = cheerio.load(html);
  const items: MangaListItem[] = [];

  $('.manga-info').each((_, el) => {
    const item = parseMangaInfoEl($, el);
    if (item) items.push(item);
  });

  const pagination = parsePagination($, items.length);
  return { items, pagination };
}
