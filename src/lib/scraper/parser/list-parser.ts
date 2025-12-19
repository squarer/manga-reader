/**
 * 漫畫列表解析
 */

import * as cheerio from 'cheerio';
import type { MangaListItem, PaginationInfo } from '../types';

/**
 * 解析漫畫列表頁
 */
export function parseMangaList(html: string): {
  items: MangaListItem[];
  pagination: PaginationInfo;
} {
  const $ = cheerio.load(html);
  const items: MangaListItem[] = [];

  // 判斷是搜尋結果頁還是列表頁
  const isSearchResult = $('.book-result').length > 0;

  if (isSearchResult) {
    parseSearchResultItems($, items);
  } else {
    parseListItems($, items);
  }

  // 解析分頁資訊
  const pagination = parsePagination($, items.length);

  return { items, pagination };
}

/**
 * 解析搜尋結果頁項目
 */
function parseSearchResultItems(
  $: ReturnType<typeof cheerio.load>,
  items: MangaListItem[]
): void {
  $('.book-result li.cf').each((_, el) => {
    const $el = $(el);
    const $link = $el.find('.book-cover a.bcover');
    const href = $link.attr('href') || '';
    const idMatch = href.match(/\/comic\/(\d+)\//);

    if (!idMatch) return;

    const $img = $el.find('.book-cover img');
    let cover = $img.attr('src') || '';
    if (cover.startsWith('//')) {
      cover = 'https:' + cover;
    }

    const name =
      $link.attr('title') || $el.find('.book-detail dt a').attr('title') || '';
    const latestChapter = $el.find('.book-cover .tt').text().trim();
    const scoreText = $el.find('.book-cover em').text().trim();
    const score = scoreText ? parseFloat(scoreText) : undefined;

    items.push({
      id: parseInt(idMatch[1], 10),
      name,
      cover,
      latestChapter,
      updateTime: '',
      score,
    });
  });
}

/**
 * 解析列表頁項目
 */
function parseListItems(
  $: ReturnType<typeof cheerio.load>,
  items: MangaListItem[]
): void {
  $('#contList li, .book-list li').each((_, el) => {
    const $el = $(el);
    const $link = $el.find('a').first();
    const href = $link.attr('href') || '';
    const idMatch = href.match(/\/comic\/(\d+)\//);

    if (!idMatch) return;

    const $img = $el.find('img');
    let cover = $img.attr('src') || $img.attr('data-src') || '';
    if (cover.startsWith('//')) {
      cover = 'https:' + cover;
    }

    // 標題：優先使用 a[title]，其次 p.ell
    const name =
      $el.find('a').attr('title') ||
      $el.find('p.ell a').text().trim() ||
      $el.find('p.ell').text().trim();

    // 最新章節：只取 .tt 的文字
    const latestChapter = $el.find('.tt').text().trim();

    // 更新時間
    const updateText = $el.find('.updateon').text();
    const updateMatch = updateText.match(/更新于[：:]\s*([\d-]+)/);
    const updateTime = updateMatch ? updateMatch[1] : '';

    // 評分：取 em 標籤內的數字
    const scoreText = $el.find('.updateon em, em.score').text().trim();
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
}

/**
 * 解析分頁資訊
 */
function parsePagination(
  $: ReturnType<typeof cheerio.load>,
  itemCount: number
): PaginationInfo {
  let currentPage = 1;
  let totalPages = 1;
  let totalItems = itemCount;

  // 方法 1：按鈕式分頁（.pager 包含數字連結）
  const $pager = $('.pager');
  if ($pager.length) {
    // 找當前頁
    const $current = $pager.find('.current, span:not(:has(*))').first();
    if ($current.length) {
      const currentText = $current.text().trim();
      const currentNum = parseInt(currentText, 10);
      if (!isNaN(currentNum)) {
        currentPage = currentNum;
      }
    }

    // 找總頁數（從所有數字連結中取最大值）
    const pageNumbers: number[] = [];
    $pager.find('a').each((_, el) => {
      const text = $(el).text().trim();
      const num = parseInt(text, 10);
      if (!isNaN(num)) {
        pageNumbers.push(num);
      }
    });
    if (pageNumbers.length > 0) {
      totalPages = Math.max(...pageNumbers);
    }

    // 找總項目數
    const totalText = $pager.text();
    const totalMatch = totalText.match(/共有?\s*(\d+)\s*部|共\s*(\d+)\s*部/);
    if (totalMatch) {
      totalItems = parseInt(totalMatch[1] || totalMatch[2], 10);
    }
  }

  // 方法 2：文字式分頁（如 "第 1 / 10 頁"）
  const pageText = $('.pager, .page-box').text();
  const pageMatch = pageText.match(
    /第\s*(\d+)\s*\/\s*(\d+)\s*頁|(\d+)\s*\/\s*(\d+)/
  );
  if (pageMatch) {
    currentPage = parseInt(pageMatch[1] || pageMatch[3], 10);
    totalPages = parseInt(pageMatch[2] || pageMatch[4], 10);
  }

  return {
    current: currentPage,
    total: totalPages,
    totalItems,
  };
}
