/**
 * 最新更新頁面解析
 */

import * as cheerio from 'cheerio';
import type { MangaListItem, PaginationInfo } from '../types';

/**
 * 解析最新更新頁面
 * 頁面結構：.latest-list > ul > li
 */
export function parseUpdateList(html: string): {
  items: MangaListItem[];
  pagination: PaginationInfo;
} {
  const $ = cheerio.load(html);
  const items: MangaListItem[] = [];

  // 更新頁面結構：.latest-list > ul > li
  $('.latest-list ul li').each((_, el) => {
    const $el = $(el);
    const $link = $el.find('a.cover');
    const href = $link.attr('href') || '';
    const idMatch = href.match(/\/comic\/(\d+)\//);

    if (!idMatch) return;

    const $img = $el.find('img');
    let cover = $img.attr('src') || $img.attr('data-src') || '';
    if (cover.startsWith('//')) {
      cover = 'https:' + cover;
    }

    const name = $link.attr('title') || '';
    const latestChapter = $el.find('.tt').text().trim();
    const updateTimeText = $el.find('.dt').text().trim();
    const updateTime = parseUpdateTimeText(updateTimeText);

    const scoreText = $el.find('em').text().trim();
    const score = scoreText ? parseFloat(scoreText) : undefined;

    items.push({
      id: parseInt(idMatch[1], 10),
      name,
      cover,
      latestChapter,
      updateTime,
      score,
    });
  });

  // 解析分頁
  const pagination = parseUpdatePagination($);

  return { items, pagination };
}

/**
 * 解析更新時間文字為日期字串
 * 處理 "今天 12:30"、"昨天 12:30"、"前天 12:30"、"12-18" 等格式
 */
function parseUpdateTimeText(text: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (text.includes('今天')) {
    return formatDate(today);
  }
  if (text.includes('昨天')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
  }
  if (text.includes('前天')) {
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);
    return formatDate(dayBefore);
  }

  // 處理 "MM-DD" 格式
  const dateMatch = text.match(/(\d{1,2})-(\d{1,2})/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1], 10) - 1;
    const day = parseInt(dateMatch[2], 10);
    const date = new Date(now.getFullYear(), month, day);
    // 如果日期在未來，說明是去年的
    if (date > now) {
      date.setFullYear(date.getFullYear() - 1);
    }
    return formatDate(date);
  }

  return '';
}

/**
 * 格式化日期為 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 解析更新頁面分頁
 */
function parseUpdatePagination($: ReturnType<typeof cheerio.load>): PaginationInfo {
  let currentPage = 1;
  let totalPages = 1;

  const $pager = $('.pager');
  if ($pager.length) {
    const $current = $pager.find('.current').first();
    if ($current.length) {
      currentPage = parseInt($current.text().trim(), 10) || 1;
    }

    const pageNumbers: number[] = [];
    $pager.find('a').each((_, el) => {
      const num = parseInt($(el).text().trim(), 10);
      if (!isNaN(num)) {
        pageNumbers.push(num);
      }
    });
    if (pageNumbers.length > 0) {
      totalPages = Math.max(...pageNumbers, currentPage);
    }
  }

  return {
    current: currentPage,
    total: totalPages,
    totalItems: 0,
  };
}
