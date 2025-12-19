/**
 * 排行榜解析
 */

import * as cheerio from 'cheerio';
import type { RankItem, RankTypeEnum } from '../types';
import { RankTrend } from '../types';
import { buildCoverUrl } from './constants';

/**
 * 解析排行榜頁面
 * 排行榜頁面使用表格結構 table.rank-detail
 * 每個頁面只有一種排行榜類型（日/週/月/總），由 URL 決定
 *
 * @param html - HTML 內容
 * @param type - 排行榜類型（保留供未來日誌使用）
 */
export function parseRankList(html: string, type?: RankTypeEnum): RankItem[] {
  void type; // 保留參數供未來日誌使用
  const $ = cheerio.load(html);

  // 解析表格中的排行榜項目
  const $table = $('table.rank-detail');
  if ($table.length) {
    return parseRankTableItems($, $table);
  }

  return [];
}

/**
 * 解析排行榜表格項目
 * 表格結構：table.rank-detail > tr（排除表頭和分隔行）
 */
function parseRankTableItems(
  $: ReturnType<typeof cheerio.load>,
  $table: ReturnType<ReturnType<typeof cheerio.load>>
): RankItem[] {
  const items: RankItem[] = [];

  // 遍歷表格行（排除表頭 th 行和分隔行 .rank-split）
  $table.find('tr').each((_, el) => {
    const $row = $(el);

    // 跳過表頭行和分隔行
    if (
      $row.find('th').length > 0 ||
      $row.hasClass('rank-split') ||
      $row.hasClass('rank-split-first')
    ) {
      return;
    }

    // 提取排名
    const $rankNo = $row.find('.rank-no span');
    const rankText = $rankNo.text().trim();
    const rank = parseInt(rankText, 10);
    if (isNaN(rank)) return;

    // 提取漫畫 ID 和名稱
    const $titleLink = $row.find('.rank-title h5 a');
    const href = $titleLink.attr('href') || '';
    const idMatch = href.match(/\/comic\/(\d+)/);
    if (!idMatch) return;

    const id = parseInt(idMatch[1], 10);
    const name = $titleLink.text().trim();

    // 提取作者（可能有多個作者，用逗號分隔）
    const authors: string[] = [];
    $row.find('.rank-author a').each((_, authorEl) => {
      const authorName = $(authorEl).text().trim();
      if (authorName) {
        authors.push(authorName);
      }
    });
    const author = authors.length > 0 ? authors.join(', ') : undefined;

    // 提取最新章節
    const latestChapter = $row.find('.rank-update a').text().trim();

    // 提取更新時間
    const updateTime = $row.find('.rank-time').text().trim();

    // 提取評分
    const scoreText = $row.find('.rank-score').text().trim();
    const score = scoreText ? parseFloat(scoreText) : undefined;

    // 提取趨勢
    let trend: RankTrend = RankTrend.SAME;
    const $trendSpan = $row.find('.rank-trend span');
    if ($trendSpan.hasClass('trend-up')) {
      trend = RankTrend.UP;
    } else if ($trendSpan.hasClass('trend-down')) {
      trend = RankTrend.DOWN;
    } else if ($trendSpan.hasClass('trend-no')) {
      trend = RankTrend.SAME;
    }

    // 封面使用 CDN URL 構建
    const cover = buildCoverUrl(id);

    items.push({
      rank,
      id,
      name,
      cover,
      latestChapter,
      updateTime,
      score,
      trend,
      author,
    });
  });

  return items;
}
