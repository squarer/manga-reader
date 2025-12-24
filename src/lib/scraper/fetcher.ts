/**
 * HTTP 請求模組
 * 處理對 manhuagui.com 的請求
 */

import axios, { type AxiosInstance } from 'axios';

const BASE_URL = 'https://www.manhuagui.com';

// 代理配置（從環境變數讀取）
const proxyConfig = process.env.PROXY_HOST && process.env.PROXY_PORT
  ? {
      host: process.env.PROXY_HOST,
      port: parseInt(process.env.PROXY_PORT, 10),
    }
  : undefined;

// 建立 axios 實例
const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  proxy: proxyConfig,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    Referer: BASE_URL,
  },
});

// User-Agent 輪換列表
const userAgents = [
  // Chrome (Windows/Mac/Linux)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  // Firefox (Windows/Mac/Linux)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  // Safari (Mac/iOS)
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
  // Edge (Windows/Mac)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  // Opera
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 OPR/116.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 OPR/116.0.0.0',
  // Android (Chrome/Samsung/Firefox)
  'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Android 14; Mobile; rv:133.0) Gecko/133.0 Firefox/133.0',
  'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  // iOS (Safari/Chrome)
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
];

function getRandomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * 獲取漫畫列表頁
 */
export async function fetchMangaList(
  category: string = 'japan',
  page: number = 1
): Promise<string> {
  const url = page === 1
    ? `/list/${category}/`
    : `/list/${category}/index_p${page}.html`;

  const response = await client.get(url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
    },
  });

  return response.data;
}

/**
 * 獲取漫畫詳情頁
 */
export async function fetchMangaDetail(mangaId: number): Promise<string> {
  const url = `/comic/${mangaId}/`;

  const response = await client.get(url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
    },
  });

  return response.data;
}

/** 重試配置 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 500,
};

/**
 * 獲取章節閱讀頁（含重試機制）
 */
export async function fetchChapterPage(
  mangaId: number,
  chapterId: number
): Promise<string> {
  const url = `/comic/${mangaId}/${chapterId}.html`;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await client.get(url, {
        headers: {
          'User-Agent': getRandomUserAgent(),
        },
      });

      const html = response.data as string;

      // 驗證是否為有效的章節頁面（包含加密腳本）
      if (!html.includes('function(p,a,c,k,e,d)')) {
        if (attempt < RETRY_CONFIG.maxRetries) {
          await delay(RETRY_CONFIG.baseDelay * attempt);
          continue;
        }
      }

      return html;
    } catch (error) {
      lastError = error as Error;
      if (attempt < RETRY_CONFIG.maxRetries) {
        await delay(RETRY_CONFIG.baseDelay * attempt);
      }
    }
  }

  throw lastError || new Error('Failed to fetch chapter page');
}

/**
 * 獲取圖片 (用於代理)
 */
export async function fetchImage(
  imageUrl: string
): Promise<{ data: Buffer; contentType: string }> {
  const response = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 30000,
    headers: {
      'User-Agent': getRandomUserAgent(),
      Referer: 'https://www.manhuagui.com/',
      Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
    },
  });

  return {
    data: Buffer.from(response.data),
    contentType: response.headers['content-type'] || 'image/jpeg',
  };
}

/**
 * 搜尋漫畫
 */
export async function searchManga(keyword: string, page: number = 1): Promise<string> {
  const url = `/s/${encodeURIComponent(keyword)}_p${page}.html`;

  const response = await client.get(url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
    },
  });

  return response.data;
}

/**
 * 延遲函數 (避免請求過快)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 構建篩選 URL 路徑
 * URL 結構：/list/{filters}/{sort}.html
 * - filters: region_genre_year_letter_status（底線連接，空值省略）
 * - sort: update.html / view.html / rate.html（預設無需加）
 */
function buildFilterPath(options: import('./types').FilterOptions): string {
  const { region, genre, status, year, letter, sort, page } = options;

  // 組合篩選條件（底線連接，順序必須是 region_genre_year_letter_status）
  const filters: string[] = [];
  if (region) filters.push(region);
  if (genre) filters.push(genre);
  if (year) filters.push(year);
  if (letter) filters.push(letter);
  if (status) filters.push(status);

  const filterPart = filters.length > 0 ? filters.join('_') : '';

  // 構建路徑
  let path = '/list/';
  if (filterPart) {
    path += `${filterPart}/`;
  }

  // 分頁和排序
  if (page && page > 1) {
    if (sort) {
      path += `${sort}_p${page}.html`;
    } else {
      path += `index_p${page}.html`;
    }
  } else if (sort) {
    path += `${sort}.html`;
  }

  return path;
}

/**
 * 獲取帶篩選的漫畫列表
 */
export async function fetchMangaListWithFilters(
  options: import('./types').FilterOptions
): Promise<string> {
  const url = buildFilterPath(options);

  const response = await client.get(url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
    },
  });

  return response.data;
}

/**
 * 獲取排行榜頁面
 * URL 結構：
 * - 日榜：/rank/
 * - 週榜：/rank/week.html
 * - 月榜：/rank/month.html
 * - 總榜：/rank/total.html
 */
export async function fetchRankList(
  type: import('./types').RankTypeEnum = 'day' as import('./types').RankTypeEnum
): Promise<string> {
  const urlMap: Record<string, string> = {
    day: '/rank/',
    week: '/rank/week.html',
    month: '/rank/month.html',
    total: '/rank/total.html',
  };
  const url = urlMap[type] || '/rank/';

  const response = await client.get(url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
    },
  });

  return response.data;
}

/**
 * 獲取最新更新頁面
 * URL 結構：/update/（第一頁）或 /update/d{page}.html（其他頁）
 */
export async function fetchUpdateList(page: number = 1): Promise<string> {
  const url = page === 1
    ? '/update/'
    : `/update/d${page}.html`;

  const response = await client.get(url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
    },
  });

  return response.data;
}
