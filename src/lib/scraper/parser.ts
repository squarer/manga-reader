/**
 * HTML 解析模組
 * 解析 manhuagui.com 的漫畫列表、詳情頁等
 */

import * as cheerio from 'cheerio';
import type {
  MangaInfo,
  MangaListItem,
  ChapterGroup,
  ChapterInfo,
  PaginationInfo,
} from './types';

const BASE_URL = 'https://www.manhuagui.com';
const CDN_URL = 'https://cf.mhgui.com';

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
    // 搜尋結果頁結構
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

      const name = $link.attr('title') || $el.find('.book-detail dt a').attr('title') || '';
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
  } else {
    // 列表頁結構
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
    const name = $el.find('a').attr('title') || $el.find('p.ell a').text().trim() || $el.find('p.ell').text().trim();

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

  // 解析分頁資訊
  const pageText = $('.pager, .page-box').text();
  const pageMatch = pageText.match(/第\s*(\d+)\s*\/\s*(\d+)\s*頁|(\d+)\s*\/\s*(\d+)/);
  const totalMatch = pageText.match(/共有\s*(\d+)\s*部|共\s*(\d+)\s*部/);

  const pagination: PaginationInfo = {
    current: pageMatch ? parseInt(pageMatch[1] || pageMatch[3], 10) : 1,
    total: pageMatch ? parseInt(pageMatch[2] || pageMatch[4], 10) : 1,
    totalItems: totalMatch ? parseInt(totalMatch[1] || totalMatch[2], 10) : items.length,
  };

  return { items, pagination };
}

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
  const detailItems = $('.detail-list li');
  let author = '未知';
  let status = '連載中';
  const genres: string[] = [];
  let lastUpdate = '';

  // 排除的類型（地區、年份、字母索引）
  const excludedGenrePatterns = [/^\/list\/\d{4}\/$/, /^\/list\/japan\/$/, /^\/list\/hongkong\/$/, /^\/list\/europe\/$/, /^\/list\/korea\/$/, /^\/list\/[a-z]\//];

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
        const isExcluded = excludedGenrePatterns.some(pattern => pattern.test(href));
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

  // 描述
  let description = '';
  const introAll = $('#intro-all');
  if (introAll.length) {
    description = introAll.text().replace(/收起>>\s*$/, '').trim();
  } else {
    description = $('#intro-cut').text().trim();
  }

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
  };
}

/**
 * 解析章節列表
 */
function parseChapterList($: ReturnType<typeof cheerio.load>): ChapterGroup[] {
  const groups: ChapterGroup[] = [];
  const seenChapterIds = new Set<number>();

  // manhuagui 的章節分組在 .chapter 區塊內，用 h4 標記分組名稱
  // 結構: .chapter > h4(分組名) + .chapter-list#chapter-list-X(章節列表)
  const chapterContainer = $('.chapter');

  if (chapterContainer.length) {
    // 遍歷每個 h4 + 對應的 chapter-list
    chapterContainer.find('h4').each((_, h4El) => {
      const $h4 = $(h4El);
      const title = $h4.find('span').text().trim() || $h4.text().trim() || '章節';

      // 找到緊接在 h4 後面的 .chapter-list
      const $chapterList = $h4.next('.chapter-list');
      const chapters: ChapterInfo[] = [];

      $chapterList.find('li a').each((_, chapterEl) => {
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
              name: $chapter.attr('title') || $chapter.find('span').first().text().trim() || $chapter.text().trim(),
              url: href,
            });
          }
        }
      });

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
 * 構建完整 URL
 */
export function buildUrl(path: string): string {
  if (path.startsWith('http')) return path;
  if (path.startsWith('//')) return 'https:' + path;
  return BASE_URL + path;
}

/**
 * 構建封面 URL
 */
export function buildCoverUrl(mangaId: number): string {
  return `${CDN_URL}/cpic/h/${mangaId}.jpg`;
}
