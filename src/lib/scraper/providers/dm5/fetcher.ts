/**
 * HTTP 請求模組
 * 處理對 dm5.cn 的請求
 */

export const BASE_URL = 'https://www.dm5.cn';

/** 圖片 Referer 使用 dm5.com（dm5.cn 裸網域會 403）*/
export const IMAGE_REFERER_BASE = 'https://www.dm5.com';

const DEFAULT_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
};

const DEFAULT_TIMEOUT = 15000;

/** 重試配置 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 500,
};

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
];

function getRandomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(path: string, timeoutMs: number = DEFAULT_TIMEOUT): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { ...DEFAULT_HEADERS, 'User-Agent': getRandomUserAgent(), Referer: BASE_URL },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** 獲取漫畫詳情頁（含重試） */
export async function fetchMangaDetail(slug: string): Promise<string> {
  const url = `/manhua-${slug}/`;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const html = await fetchHtml(url);
      if (!html.includes('chapterlistload') && !html.includes('view-win-list')) {
        if (attempt < RETRY_CONFIG.maxRetries) {
          await delay(RETRY_CONFIG.baseDelay * attempt);
          continue;
        }
        throw new Error(`Invalid detail page for slug: ${slug}`);
      }
      return html;
    } catch (error) {
      lastError = error as Error;
      if (attempt < RETRY_CONFIG.maxRetries) {
        await delay(RETRY_CONFIG.baseDelay * attempt);
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch detail: ${slug}`);
}

/** 獲取章節頁（含重試），取 JS 變數與 prev/next 連結 */
export async function fetchChapterPage(cid: string): Promise<string> {
  const url = `/m${cid}/`;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const html = await fetchHtml(url);
      if (!html.includes('DM5_IMAGE_COUNT')) {
        if (attempt < RETRY_CONFIG.maxRetries) {
          await delay(RETRY_CONFIG.baseDelay * attempt);
          continue;
        }
        throw new Error(`Invalid chapter page for cid: ${cid}`);
      }
      return html;
    } catch (error) {
      lastError = error as Error;
      if (attempt < RETRY_CONFIG.maxRetries) {
        await delay(RETRY_CONFIG.baseDelay * attempt);
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch chapter: ${cid}`);
}

/** 打 chapterfun.ashx 取得 packed 字串（單次） */
export async function fetchChapterFun(params: {
  cid: string;
  page: number;
  mid: string;
  dt: string;
  sign: string;
}): Promise<string> {
  const { cid, page, mid, dt, sign } = params;
  const qs = new URLSearchParams({
    cid,
    page: String(page),
    key: '',
    language: '1',
    gtk: '6',
    _cid: cid,
    _mid: mid,
    _dt: dt,
    _sign: sign,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const res = await fetch(`${BASE_URL}/chapterfun.ashx?${qs}`, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        Referer: `${BASE_URL}/m${cid}/`,
        Accept: 'text/javascript, application/javascript, */*',
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`chapterfun.ashx HTTP ${res.status} page=${page}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** 獲取漫畫列表頁 */
export async function fetchMangaList(page: number = 1): Promise<string> {
  const url = page === 1 ? '/manhua-list/' : `/manhua-list-p${page}/`;
  return fetchHtml(url);
}

/** 搜尋漫畫 */
export async function fetchSearch(keyword: string, page: number = 1): Promise<string> {
  const qs = new URLSearchParams({ title: keyword, language: '1', f: '2' });
  if (page > 1) qs.set('page', String(page));
  return fetchHtml(`/search?${qs}`);
}

/** 排行榜頁面
 * t = dm5 榜單分類參數（無 t = 全部榜單；1/2/3 為地區/類型分榜）。
 * dm5 排行本質是地區/類型榜、非時間榜;RankTypeEnum→t 的對映見
 * dm5Provider 的 RANK_T_MAP（單一來源），此處僅依傳入 t 組 URL。
 */
export async function fetchRankList(t?: number): Promise<string> {
  const url = t != null ? `/manhua-rank/?t=${t}` : '/manhua-rank/';
  return fetchHtml(url);
}

/** 最新更新頁面（server-rendered，單頁約 38 項） */
export async function fetchUpdateList(): Promise<string> {
  return fetchHtml('/manhua-new/');
}
