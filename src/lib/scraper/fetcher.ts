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
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
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

/**
 * 獲取章節閱讀頁
 */
export async function fetchChapterPage(
  mangaId: number,
  chapterId: number
): Promise<string> {
  const url = `/comic/${mangaId}/${chapterId}.html`;

  const response = await client.get(url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
    },
  });

  return response.data;
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
