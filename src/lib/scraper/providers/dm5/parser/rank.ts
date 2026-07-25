/**
 * dm5 排行榜解析
 * /manhua-rank/?t={1|2|3|...}
 * 結構：ul.mh-list.top-cat > li > .mh-item.horizontal
 *       封面從 .mh-cover style="background-image: url(...)" 取
 *       排名從 items 陣列 index（頁面 span.num 全顯示 "1"，僅裝飾用）
 */

import * as cheerio from 'cheerio';
import type { RankItem } from '@/lib/scraper/types';
import { RankTrend } from '@/lib/scraper/types';

function extractBgImageUrl(style: string): string {
  const m = style.match(/url\(([^)]+)\)/);
  if (!m) return '';
  return m[1].replace(/['"]/g, '').trim();
}

export function parseRankList(html: string): RankItem[] {
  const $ = cheerio.load(html);
  const items: RankItem[] = [];

  // 排行榜項目在 ul.mh-list.top-cat > li > .mh-item.horizontal
  $('ul.top-cat li').each((idx, li) => {
    const $li = $(li);
    const $item = $li.find('.mh-item.horizontal').first();
    if (!$item.length) return;

    // 漫畫 slug：從 h2.title a href 取 /manhua-{slug}（不帶尾 /）
    const $titleLink = $item.find('h2.title a').first();
    const href = $titleLink.attr('href') ?? '';
    const slugMatch = href.match(/\/manhua-([^/]+)/);
    if (!slugMatch) return;
    const slug = slugMatch[1];

    const name = $titleLink.text().trim() || $titleLink.attr('title') || '';
    if (!name) return;

    // 封面：.mh-cover（非 .tip）的 style background-image
    const coverStyle = $item.find('.mh-cover:not(.tip)').first().attr('style') ?? '';
    const cover = extractBgImageUrl(coverStyle);

    // 最新章節
    const latestChapter = $item.find('.chapter a').first().text().trim();

    // 作者：.zl span a（排行榜的 .zl 可能只有評分，取 a 若有）
    const author = $item.find('.zl a').first().text().trim() || undefined;

    items.push({
      rank: idx + 1,
      id: slug,
      name,
      cover,
      latestChapter,
      updateTime: '',
      trend: RankTrend.SAME,
      author: author || undefined,
    });
  });

  return items;
}
