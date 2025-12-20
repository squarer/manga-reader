/**
 * 漫畫詳情頁解析
 */

import * as cheerio from 'cheerio';
import type { MangaInfo, ChapterGroup, ChapterInfo } from '../types';

/**
 * 解析漫畫詳情頁
 */
export function parseMangaDetail(html: string, mangaId: number): MangaInfo | null {
  const $ = cheerio.load(html);

  // 基本資訊 - 標題
  const name = $('.book-title h1').text().trim() || $('h1').first().text().trim();
  if (!name) return null;

  // 封面
  let cover = $('.hcover img, .book-cover img, p.hcover img').attr('src') || '';
  if (cover.startsWith('//')) {
    cover = 'https:' + cover;
  }

  // 解析詳情列表中的各項資訊
  const { author, status, genres, lastUpdate } = parseDetailList($);

  // 解析評分
  // 網站結構：<p class="score-avg"><b><i></i></b><em>6.0</em></p>
  const scoreText = $('p.score-avg em').first().text().trim();
  const score = scoreText ? parseFloat(scoreText) : undefined;

  // 描述
  const description = parseDescription($);

  // 章節列表
  const chapters = parseChapterList($);

  return {
    id: mangaId,
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

/**
 * 解析詳情列表（作者、狀態、分類等）
 */
function parseDetailList($: ReturnType<typeof cheerio.load>): {
  author: string;
  status: string;
  genres: string[];
  lastUpdate: string;
} {
  const detailItems = $('.detail-list li');
  let author = '未知';
  let status = '連載中';
  const genres: string[] = [];
  let lastUpdate = '';

  // 排除的類型（地區、年份、字母索引）
  const excludedGenrePatterns = [
    /^\/list\/\d{4}\/$/,
    /^\/list\/japan\/$/,
    /^\/list\/hongkong\/$/,
    /^\/list\/europe\/$/,
    /^\/list\/korea\/$/,
    /^\/list\/[a-z]\//,
  ];

  detailItems.each((_, el) => {
    const $li = $(el);
    const text = $li.text();

    // 遍歷所有連結，根據 href 判斷類型
    $li.find('a').each((_, a) => {
      const $a = $(a);
      const href = $a.attr('href') || '';
      const linkText = $a.text().trim();

      if (href.includes('/author/')) {
        // 作者連結
        author = linkText;
      } else if (href.startsWith('/list/')) {
        // 檢查是否是排除的類型
        const isExcluded = excludedGenrePatterns.some((pattern) =>
          pattern.test(href)
        );
        if (!isExcluded && linkText && !genres.includes(linkText)) {
          genres.push(linkText);
        }
      }
    });

    // 解析狀態
    if (text.includes('漫画状态')) {
      if (text.includes('连载')) {
        status = '連載中';
      } else if (text.includes('完结')) {
        status = '已完結';
      }
      // 提取更新日期
      const dateMatch = text.match(/\[(\d{4}-\d{2}-\d{2})\]/);
      if (dateMatch) {
        lastUpdate = dateMatch[1];
      }
    }
  });

  return { author, status, genres, lastUpdate };
}

/**
 * 解析描述
 */
function parseDescription($: ReturnType<typeof cheerio.load>): string {
  const introAll = $('#intro-all');
  if (introAll.length) {
    return introAll.text().replace(/收起>>\s*$/, '').trim();
  }
  return $('#intro-cut').text().trim();
}

/**
 * 解析章節列表
 */
function parseChapterList($: ReturnType<typeof cheerio.load>): ChapterGroup[] {
  const groups: ChapterGroup[] = [];
  const seenChapterIds = new Set<number>();

  // manhuagui 的章節分組在 .chapter 區塊內
  const chapterContainer = $('.chapter');

  if (chapterContainer.length) {
    // 遍歷每個 h4 + 對應的 chapter-list
    chapterContainer.find('h4').each((_, h4El) => {
      const $h4 = $(h4El);
      const title = $h4.find('span').text().trim() || $h4.text().trim() || '章節';

      // 找到 h4 後面的 .chapter-list
      const $chapterList = $h4.nextAll('.chapter-list').first();
      const chapters: ChapterInfo[] = [];

      // 遍歷所有 ul 內的章節連結
      $chapterList.find('ul').each((_, ulEl) => {
        $(ulEl)
          .find('li a')
          .each((_, chapterEl) => {
            const $chapter = $(chapterEl);
            const href = $chapter.attr('href') || '';
            const cidMatch = href.match(/\/(\d+)\.html/);

            if (cidMatch) {
              const chapterId = parseInt(cidMatch[1], 10);
              // 避免重複
              if (!seenChapterIds.has(chapterId)) {
                seenChapterIds.add(chapterId);
                chapters.push({
                  id: chapterId,
                  name:
                    $chapter.attr('title') ||
                    $chapter.find('span').first().text().trim() ||
                    $chapter.text().trim(),
                  url: href,
                });
              }
            }
          });
      });

      // 自然排序章節（降序：從大到小）
      chapters.sort((a, b) => naturalSort(b.name, a.name));

      if (chapters.length > 0) {
        groups.push({ title, chapters });
      }
    });
  }

  // 如果沒有找到分組，嘗試直接提取所有章節連結
  if (groups.length === 0) {
    const allChapters: ChapterInfo[] = [];
    $('a[href*=".html"]').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';
      const cidMatch = href.match(/\/comic\/\d+\/(\d+)\.html/);

      if (cidMatch) {
        const chapterId = parseInt(cidMatch[1], 10);
        if (!seenChapterIds.has(chapterId)) {
          seenChapterIds.add(chapterId);
          allChapters.push({
            id: chapterId,
            name: $el.attr('title') || $el.text().trim(),
            url: href,
          });
        }
      }
    });

    if (allChapters.length > 0) {
      groups.push({ title: '章節', chapters: allChapters });
    }
  }

  return groups;
}

/**
 * 自然排序比較函數（處理章節名稱中的數字）
 */
function naturalSort(a: string, b: string): number {
  const regex = /(\d+)|(\D+)/g;
  const aParts = a.match(regex) || [];
  const bParts = b.match(regex) || [];

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || '';
    const bPart = bParts[i] || '';

    // 兩者都是數字
    const aNum = parseInt(aPart, 10);
    const bNum = parseInt(bPart, 10);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum !== bNum) {
        return aNum - bNum;
      }
    } else {
      // 字串比較
      if (aPart !== bPart) {
        return aPart.localeCompare(bPart);
      }
    }
  }

  return 0;
}
