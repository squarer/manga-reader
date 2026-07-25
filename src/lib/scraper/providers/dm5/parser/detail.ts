/**
 * dm5 漫畫詳情頁解析
 * /manhua-{slug}/
 */

import * as cheerio from 'cheerio';
import type { MangaInfo, ChapterGroup, ChapterInfo } from '@/lib/scraper/types';

export function parseMangaDetail(html: string, slug: string): MangaInfo | null {
  const $ = cheerio.load(html);

  // 標題：.banner_detail .info p.title（取直接文字，排除 span 子元素）
  // 用 DM5_COMIC_MNAME JS 變數作 fallback（更可靠）
  let name = '';
  const mnameMatch = html.match(/DM5_COMIC_MNAME\s*=\s*"([^"]+)"/);
  if (mnameMatch) {
    name = mnameMatch[1].trim();
  } else {
    name = $('.banner_detail .info p.title').contents().filter((_, n) => n.type === 'text').first().text().trim();
  }
  if (!name) return null;

  // 封面：banner_detail 內的 .cover img
  const cover = $('.banner_detail .cover img').attr('src') ||
    $('.cover img').first().attr('src') || '';

  // 作者：.subtitle 內的 a
  const author = $('.banner_detail .info .subtitle a').first().text().trim() || '未知';

  // 狀態：.tip .block span（「已完结」/ 「连载中」）
  const statusText = $('.banner_detail .info .tip').text();
  const status = statusText.includes('完结') ? '已完結' : '連載中';

  // 分類：.tip a（指向 /manhua-xxx/）
  const genres: string[] = [];
  $('.banner_detail .info .tip a').each((_, el) => {
    const t = $(el).find('span').text().trim() || $(el).text().trim();
    if (t) genres.push(t);
  });

  // 描述
  const description = $('.banner_detail .info .content').first().text().trim();

  // 評分：「8.2分」格式的 .score span
  let score: number | undefined;
  const scoreText = $('.banner_detail .info .score').first().text().replace('分', '').trim();
  if (scoreText && /^\d+(\.\d+)?$/.test(scoreText)) {
    score = parseFloat(scoreText);
  } else {
    // fallback: star count × 2（4顆星=8分）
    const activeStars = $('.banner_detail .info .star.active').length;
    if (activeStars > 0) score = activeStars * 2;
  }

  // 最後更新：detail-list-title .s span 內有「07月22号」或「今天 HH:MM」格式
  // 取 span 文字中的日期部分（無 YYYY-MM-DD，僅保留月日供顯示）
  const lastUpdateText = $('.detail-list-title .s').text();
  const mdMatch = lastUpdateText.match(/(\d+月\d+[号號日])/);
  const lastUpdate = mdMatch ? mdMatch[1] : '';

  // 章節列表：#chapterlistload 內有多個 .view-detail-list（各對應一個分組）
  // 分組標題從 .detail-list-title a.block 取得
  const chapters = parseChapterGroups($);

  return {
    id: slug,
    name,
    cover,
    author,
    status,
    genres,
    description,
    lastUpdate,
    chapters,
    score,
  };
}

function parseChapterGroups($: ReturnType<typeof cheerio.load>): ChapterGroup[] {
  const groups: ChapterGroup[] = [];
  const seenIds = new Set<string>();

  // 建立 detail-list-select-N → 分組標題的映射
  // tab a.block 的 onclick 含 'detail-list-select-N'，文字即分組標題
  const tabTitleMap: Record<string, string> = {};
  $('.detail-list-title a.block').each((_, aEl) => {
    const onclick = $(aEl).attr('onclick') || '';
    const idMatch = onclick.match(/'(detail-list-select-\d+)'\s*\)/);
    if (!idMatch) return;
    // 取 a 的直接文字（排除 span 內的章節數），再去掉括號計數
    const rawTitle = $(aEl)
      .contents()
      .filter((_, n) => n.type === 'text')
      .first()
      .text()
      .replace(/[（(]\d+[）)]/g, '')
      .trim();
    tabTitleMap[idMatch[1]] = rawTitle || '章節';
  });

  // 真實結構：#chapterlistload > ul.view-win-list.detail-list-select[id="detail-list-select-N"]
  // 每個 ul 下有：直接 li > a + 折疊的 ul.chapteritem > li > a
  $('#chapterlistload ul.view-win-list.detail-list-select').each((idx, listEl) => {
    const listId = $(listEl).attr('id') || '';
    const groupTitle = tabTitleMap[listId] || `章節${idx + 1}`;
    const chapters: ChapterInfo[] = [];

    $(listEl).find('li a').each((_, aEl) => {
      const href = $(aEl).attr('href') || '';
      const cidMatch = href.match(/\/m(\d+)\//);
      if (!cidMatch) return;

      const cid = cidMatch[1];
      if (seenIds.has(cid)) return;
      seenIds.add(cid);

      // title 屬性最乾淨；若空則取 a 的直接文字 node（排除 span 頁數）
      const titleAttr = $(aEl).attr('title')?.trim() ?? '';
      const chapterName = titleAttr ||
        $(aEl)
          .contents()
          .filter((_, n) => n.type === 'text')
          .map((_, n) => $(n).text())
          .get()
          .join('')
          .replace(/[（(]\d+P[）)]/gi, '')
          .trim();

      chapters.push({ id: cid, name: chapterName, url: href });
    });

    if (chapters.length > 0) {
      groups.push({ title: groupTitle, chapters });
    }
  });

  return groups;
}
