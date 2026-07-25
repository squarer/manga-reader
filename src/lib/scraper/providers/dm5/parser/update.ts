/**
 * dm5 最新更新頁面解析
 * /manhua-new/  —  server-rendered，單頁約 38 項，無 pager
 */

import * as cheerio from 'cheerio';
import type { MangaListItem, PaginationInfo } from '@/lib/scraper/types';

export function parseUpdateList(html: string): {
  items: Omit<MangaListItem, 'source'>[];
  pagination: PaginationInfo;
} {
  const $ = cheerio.load(html);
  const items: Omit<MangaListItem, 'source'>[] = [];

  $('.manga-info').each((_, el) => {
    const $info = $(el);
    const uk = $info.attr('uk') ?? '';
    const slug = uk.replace(/^manhua-/, '');
    if (!slug) return;

    const cover = $info.attr('tc') ?? '';
    const name = $info.closest('.mh-item').find('h2.title a').text().trim();
    if (!name) return;

    const latestChapter = $info.attr('tn')?.trim() ?? '';
    const lastUpdate = $info.attr('lt')?.trim() ?? '';

    items.push({
      id: slug,
      name,
      cover,
      latestChapter,
      updateTime: lastUpdate,
      score: undefined,
    });
  });

  // 最新更新頁無分頁；total=1
  const pagination: PaginationInfo = {
    current: 1,
    total: 1,
    totalItems: items.length,
  };

  return { items, pagination };
}
