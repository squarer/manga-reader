/**
 * dm5 章節圖片取得模組
 * 流程：fetch /m{cid}/ → 抓 JS 變數 → 並行請求 chapterfun.ashx(page 1..imageCount) → unpack → 去重組圖
 */

import { unpack } from '../../unpack';
import { fetchChapterPage, fetchChapterFun, IMAGE_REFERER_BASE } from './fetcher';

export interface ChapterPageVars {
  cid: string;
  mid: string;
  imageCount: number;
  viewSign: string;
  viewSignDt: string;
  title: string;
  prevCid?: string;
  nextCid?: string;
}

/** 從章節頁 HTML 提取 JS 變數與 prev/next 連結 */
export function parseChapterPageVars(html: string): ChapterPageVars | null {
  const cidMatch = html.match(/DM5_CID\s*=\s*(\d+)/);
  const midMatch = html.match(/DM5_MID\s*=\s*(\d+)/);
  const countMatch = html.match(/DM5_IMAGE_COUNT\s*=\s*(\d+)/);
  const signMatch = html.match(/DM5_VIEWSIGN\s*=\s*"([^"]+)"/);
  const dtMatch = html.match(/DM5_VIEWSIGN_DT\s*=\s*"([^"]+)"/);
  const titleMatch = html.match(/DM5_CTITLE\s*=\s*"([^"]+)"/);

  if (!cidMatch || !midMatch || !countMatch || !signMatch || !dtMatch) return null;

  // 上一話/下一話連結：<a href="/m{cid}/" class="block" title="...">下一章</a>
  // 第一話無上一章連結；最後話無下一章連結
  const prevMatch = html.match(/href="\/m(\d+)\/"[^>]*>上一章</);
  const nextMatch = html.match(/href="\/m(\d+)\/"[^>]*>下一章</);

  return {
    cid: cidMatch[1],
    mid: midMatch[1],
    imageCount: parseInt(countMatch[1], 10),
    viewSign: signMatch[1],
    viewSignDt: dtMatch[1],
    title: titleMatch ? titleMatch[1] : '',
    prevCid: prevMatch ? prevMatch[1] : undefined,
    nextCid: nextMatch ? nextMatch[1] : undefined,
  };
}

interface ChapterFunResult {
  pix: string;
  pvalue: string[];
  key: string;
}

/**
 * 解析 chapterfun.ashx 回傳的 packed JS，提取 pix/pvalue/key。
 * 解析失敗直接拋錯（由呼叫側的重試迴圈處理）。
 */
function parseChapterFunPacked(packed: string): ChapterFunResult {
  // unpack 失敗直接拋出（由 unpack 本身拋錯）
  const unpacked = unpack(packed);

  // unpacked 形如（key 可能是 \'xxx\' 或 'xxx'，視 packed 格式而定）：
  // var key=\'b468da...\'; var pix="https://..."; var pvalue=["/a.jpg","/b.jpg"];
  const pixMatch = unpacked.match(/var pix\s*=\s*"([^"]+)"/);
  // 匹配 var key= 後的 hex string（容許前後有 ' 或 \'）
  const keyMatch = unpacked.match(/var key\s*=\s*\\?'([a-f0-9]*)\\?'/);
  const pvalueMatch = unpacked.match(/var pvalue\s*=\s*(\[[^\]]*\])/);

  if (!pixMatch) throw new Error('chapterfun: pix not found in unpacked JS');
  if (!pvalueMatch) throw new Error('chapterfun: pvalue not found in unpacked JS');

  const pvalue = JSON.parse(pvalueMatch[1]) as string[];

  return {
    pix: pixMatch[1],
    pvalue,
    key: keyMatch ? keyMatch[1] : '',
  };
}

/** 並行度上限：避免 dm5 伺服器限流 */
const CONCURRENCY = 5;
/** 單頁最多重試次數 */
const PAGE_MAX_RETRIES = 3;
/** 重試間隔（ms）*/
const RETRY_DELAY_MS = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 限制並行度的 Promise 佇列執行器。
 * 維持最多 concurrency 個 Promise 同時在執行，每完成一個即補入下一個。
 * 使用 .then(onFulfilled, onRejected) 捕獲各任務結果，不以 catch 吞錯。
 */
async function throttledAllSettled<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let nextIdx = 0;

  async function worker(): Promise<void> {
    while (nextIdx < tasks.length) {
      const i = nextIdx++;
      await tasks[i]().then(
        (value) => { results[i] = { status: 'fulfilled', value }; },
        (reason: unknown) => { results[i] = { status: 'rejected', reason }; }
      );
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

/**
 * 取得章節完整圖片列表。
 * 滑窗語意：page=N 回傳 image[N] 和 image[N+1]（除最後一頁只回 1 張）。
 * 策略：限速並行（CONCURRENCY=5）請求 page 1..imageCount；
 *       失敗頁個別重試最多 PAGE_MAX_RETRIES 次（帶退避）；全部失敗則拋錯。
 */
export async function getChapterImages(cid: string): Promise<{
  vars: ChapterPageVars;
  images: string[];
} | null> {
  const html = await fetchChapterPage(cid);
  const vars = parseChapterPageVars(html);
  if (!vars) return null;

  const { imageCount, mid, viewSign, viewSignDt } = vars;

  // 單頁取得：失敗時帶退避重試，全部嘗試失敗才讓錯誤自然傳播
  const fetchPageWithRetry = (page: number): Promise<string> => {
    const attempt = (n: number): Promise<string> =>
      fetchChapterFun({ cid, page, mid, dt: viewSignDt, sign: viewSign }).then(
        (result) => result,
        (err: unknown) => {
          if (n >= PAGE_MAX_RETRIES - 1) throw err;
          return delay(RETRY_DELAY_MS * (n + 1)).then(() => attempt(n + 1));
        }
      );
    return attempt(0);
  };

  // 每個 task = fetch + parse，parse 失敗同樣計為 rejected（觸發重試）
  const pages = Array.from({ length: imageCount }, (_, i) => i + 1);
  const settled = await throttledAllSettled(
    pages.map((page) => () => fetchPageWithRetry(page).then(parseChapterFunPacked)),
    CONCURRENCY
  );

  // 全部失敗直接拋出第一個錯誤
  const failures = settled.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failures.length === settled.length) {
    throw failures[0].reason as Error;
  }

  // 去重：依 pix+path（不含 query params）確保同張圖只出現一次
  const seen = new Set<string>();
  const images: string[] = [];

  for (const result of settled) {
    if (result.status === 'rejected') continue;
    const { pix, pvalue, key } = result.value;
    for (const path of pvalue) {
      const dedupeKey = `${pix}${path}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        images.push(`${pix}${path}?cid=${cid}&key=${key}`);
      }
    }
  }

  return { vars, images };
}

/**
 * 產生 dm5 圖片的 Referer。
 * 圖片 URL 含 ?cid=xxx — 以此構建 chapter-specific referer（dm5.com 而非 dm5.cn）。
 */
export function buildImageReferer(imageUrl: string): string {
  const cidMatch = imageUrl.match(/[?&]cid=(\d+)/);
  if (cidMatch) {
    return `${IMAGE_REFERER_BASE}/m${cidMatch[1]}/`;
  }
  // 封面圖（mhfm* subdomain）無 cid 參數，bare domain 即可
  return `${IMAGE_REFERER_BASE}/`;
}
