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
  RankItem,
} from './types';
import { RankTrend } from './types';

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
  let currentPage = 1;
  let totalPages = 1;
  let totalItems = items.length;

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
  const pageMatch = pageText.match(/第\s*(\d+)\s*\/\s*(\d+)\s*頁|(\d+)\s*\/\s*(\d+)/);
  if (pageMatch) {
    currentPage = parseInt(pageMatch[1] || pageMatch[3], 10);
    totalPages = parseInt(pageMatch[2] || pageMatch[4], 10);
  }

  const pagination: PaginationInfo = {
    current: currentPage,
    total: totalPages,
    totalItems,
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

/**
 * 解析章節列表
 */
function parseChapterList($: ReturnType<typeof cheerio.load>): ChapterGroup[] {
  const groups: ChapterGroup[] = [];
  const seenChapterIds = new Set<number>();

  // manhuagui 的章節分組在 .chapter 區塊內，用 h4 標記分組名稱
  // 結構: .chapter > h4(分組名) + div.chapter-page(分頁按鈕) + .chapter-list#chapter-list-X(章節列表)
  const chapterContainer = $('.chapter');

  if (chapterContainer.length) {
    // 遍歷每個 h4 + 對應的 chapter-list
    chapterContainer.find('h4').each((_, h4El) => {
      const $h4 = $(h4El);
      const title = $h4.find('span').text().trim() || $h4.text().trim() || '章節';

      // 找到 h4 後面的 .chapter-list（可能中間有其他元素，如 .chapter-page）
      const $chapterList = $h4.nextAll('.chapter-list').first();
      const chapters: ChapterInfo[] = [];

      // 遍歷所有 ul 內的章節連結
      $chapterList.find('ul').each((_, ulEl) => {
        $(ulEl).find('li a').each((_, chapterEl) => {
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

/**
 * 解析排行榜頁面
 * 排行榜頁面使用表格結構 table.rank-detail
 * 每個頁面只有一種排行榜類型（日/週/月/總），由 URL 決定
 */
export function parseRankList(html: string): {
  day: RankItem[];
  week: RankItem[];
  month: RankItem[];
  total: RankItem[];
} {
  const $ = cheerio.load(html);
  const result = {
    day: [] as RankItem[],
    week: [] as RankItem[],
    month: [] as RankItem[],
    total: [] as RankItem[],
  };

  // 從頁面標題或 URL 判斷當前排行榜類型
  const title = $('title').text();
  const selectedTab = $('.bar-tab li.selected a').text();
  let currentType: 'day' | 'week' | 'month' | 'total' = 'day';

  if (title.includes('周排行') || selectedTab.includes('周排行')) {
    currentType = 'week';
  } else if (title.includes('月排行') || selectedTab.includes('月排行')) {
    currentType = 'month';
  } else if (title.includes('总排行') || selectedTab.includes('总排行')) {
    currentType = 'total';
  }

  // 解析表格中的排行榜項目
  const $table = $('table.rank-detail');
  if ($table.length) {
    result[currentType] = parseRankTableItems($, $table);
  }

  return result;
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
    if ($row.find('th').length > 0 || $row.hasClass('rank-split') || $row.hasClass('rank-split-first')) {
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
    items,
    pagination: {
      current: currentPage,
      total: totalPages,
      totalItems: items.length,
    },
  };
}
