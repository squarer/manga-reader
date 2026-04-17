import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchMangaList,
  fetchMangaDetail,
  fetchChapterPage,
  fetchImage,
  fetchUpdateList,
  fetchMangaListWithFilters,
} from '../fetcher';
import type { FilterOptions } from '../types';
import { RegionType, GenreType, SortType, MangaStatus } from '../types';

const BASE_URL = 'https://www.manhuagui.com';

// Minimal valid HTML snippets that pass page validation checks
const VALID_DETAIL_HTML = `
  <div class="detail-list">
    <div class="chapter">第1話</div>
    <div class="hcover"><img src="/cpic/h/12345.jpg"></div>
    <a href="/author/test">作者</a>
  </div>
`;

const VALID_CHAPTER_HTML = `
  <script>
    function(p,a,c,k,e,d) { /* packed JS */ }
  </script>
`;

function makeResponse(
  body: string | ArrayBuffer,
  options: { status?: number; contentType?: string } = {}
): Response {
  const { status = 200, contentType = 'text/html' } = options;
  const headers = new Headers({ 'content-type': contentType });
  return {
    ok: status >= 200 && status < 300,
    status,
    headers,
    text: async () => (typeof body === 'string' ? body : ''),
    arrayBuffer: async () => (body instanceof ArrayBuffer ? body : new ArrayBuffer(0)),
  } as unknown as Response;
}

describe('fetcher', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // fetchMangaList
  // ---------------------------------------------------------------------------
  describe('fetchMangaList', () => {
    it('page=1 請求 /list/{category}/', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html>list</html>'));

      const result = await fetchMangaList('japan', 1);

      expect(fetch).toHaveBeenCalledOnce();
      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/list/japan/`);
      expect(result).toBe('<html>list</html>');
    });

    it('page>1 請求 /list/{category}/index_p{page}.html', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html>page2</html>'));

      await fetchMangaList('korea', 3);

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/list/korea/index_p3.html`);
    });

    it('預設 category=japan page=1', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html></html>'));

      await fetchMangaList();

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/list/japan/`);
    });
  });

  // ---------------------------------------------------------------------------
  // User-Agent header
  // ---------------------------------------------------------------------------
  describe('User-Agent header', () => {
    it('每次請求都帶 User-Agent', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html></html>'));

      await fetchMangaList('japan', 1);

      const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const headers = init?.headers as Record<string, string>;
      expect(headers['User-Agent']).toBeTruthy();
      expect(typeof headers['User-Agent']).toBe('string');
      expect(headers['User-Agent'].length).toBeGreaterThan(0);
    });

    it('不同請求可能使用不同 User-Agent（從輪換清單取樣）', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(makeResponse('<html></html>'))
        .mockResolvedValueOnce(makeResponse('<html></html>'));

      await fetchMangaList('japan', 1);
      await fetchMangaList('japan', 2);

      const calls = vi.mocked(fetch).mock.calls as [string, RequestInit][];
      const ua1 = (calls[0][1].headers as Record<string, string>)['User-Agent'];
      const ua2 = (calls[1][1].headers as Record<string, string>)['User-Agent'];
      // Both must be non-empty strings from the known UA pool
      expect(ua1).toMatch(/Mozilla\/5\.0/);
      expect(ua2).toMatch(/Mozilla\/5\.0/);
    });
  });

  // ---------------------------------------------------------------------------
  // fetchMangaDetail — retry logic
  // ---------------------------------------------------------------------------
  describe('fetchMangaDetail', () => {
    it('第一次失敗後重試成功', async () => {
      vi.mocked(fetch)
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce(makeResponse(VALID_DETAIL_HTML));

      const result = await fetchMangaDetail(12345);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toContain('detail-list');
    });

    it('第一次回傳無效頁面、第二次回傳有效頁面', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(makeResponse('<html>not a detail page</html>'))
        .mockResolvedValueOnce(makeResponse(VALID_DETAIL_HTML));

      const result = await fetchMangaDetail(12345);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toContain('detail-list');
    });

    it('三次全部失敗則拋出錯誤', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('network error'));

      await expect(fetchMangaDetail(12345)).rejects.toThrow('network error');
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('構建正確的詳情頁 URL /comic/{id}/', async () => {
      vi.mocked(fetch).mockResolvedValue(makeResponse(VALID_DETAIL_HTML));

      await fetchMangaDetail(99999);

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/comic/99999/`);
    });
  });

  // ---------------------------------------------------------------------------
  // fetchMangaDetail — HTML structure validation
  // ---------------------------------------------------------------------------
  describe('fetchMangaDetail 頁面結構驗證', () => {
    it('缺少 detail-list class → 三次重試後拋錯', async () => {
      const invalidHtml = `
        <div class="chapter">
          <div class="hcover"></div>
          <a href="/author/x">作者</a>
        </div>
      `;
      vi.mocked(fetch).mockResolvedValue(makeResponse(invalidHtml));

      await expect(fetchMangaDetail(1)).rejects.toThrow(
        'Invalid detail page structure for manga 1'
      );
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('缺少 chapter class → 判定為無效頁面', async () => {
      const invalidHtml = `
        <div class="detail-list">
          <div class="hcover"></div>
          <a href="/author/x">漫画作者</a>
        </div>
      `;
      vi.mocked(fetch).mockResolvedValue(makeResponse(invalidHtml));

      await expect(fetchMangaDetail(2)).rejects.toThrow(
        'Invalid detail page structure for manga 2'
      );
    });

    it('缺少封面資訊（hcover 和 cpic/h）→ 判定為無效頁面', async () => {
      const invalidHtml = `
        <div class="detail-list">
          <div class="chapter">第1話</div>
          <a href="/author/test">作者</a>
        </div>
      `;
      vi.mocked(fetch).mockResolvedValue(makeResponse(invalidHtml));

      await expect(fetchMangaDetail(3)).rejects.toThrow(
        'Invalid detail page structure for manga 3'
      );
    });

    it('缺少作者資訊 → 判定為無效頁面', async () => {
      const invalidHtml = `
        <div class="detail-list">
          <div class="chapter">第1話</div>
          <div class="hcover"></div>
        </div>
      `;
      vi.mocked(fetch).mockResolvedValue(makeResponse(invalidHtml));

      await expect(fetchMangaDetail(4)).rejects.toThrow(
        'Invalid detail page structure for manga 4'
      );
    });

    it('HTTP 4xx 拋出含狀態碼的錯誤', async () => {
      vi.mocked(fetch).mockResolvedValue(makeResponse('Not Found', { status: 404 }));

      await expect(fetchMangaDetail(5)).rejects.toThrow('HTTP 404');
    });
  });

  // ---------------------------------------------------------------------------
  // fetchChapterPage
  // ---------------------------------------------------------------------------
  describe('fetchChapterPage', () => {
    it('構建正確的章節 URL /comic/{bid}/{cid}.html', async () => {
      vi.mocked(fetch).mockResolvedValue(makeResponse(VALID_CHAPTER_HTML));

      await fetchChapterPage(12345, 678);

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/comic/12345/678.html`);
    });

    it('回傳包含解密函數特徵的 HTML', async () => {
      vi.mocked(fetch).mockResolvedValue(makeResponse(VALID_CHAPTER_HTML));

      const result = await fetchChapterPage(1, 1);

      expect(result).toContain('function(p,a,c,k,e,d)');
    });

    it('缺少加密腳本 → 三次重試後拋錯', async () => {
      vi.mocked(fetch).mockResolvedValue(makeResponse('<html>invalid chapter</html>'));

      await expect(fetchChapterPage(1, 1)).rejects.toThrow(
        'Invalid chapter page structure for manga 1, chapter 1'
      );
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('首次請求失敗後重試成功', async () => {
      vi.mocked(fetch)
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce(makeResponse(VALID_CHAPTER_HTML));

      const result = await fetchChapterPage(10, 20);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toContain('function(p,a,c,k,e,d)');
    });

    it('三次全部失敗則拋出最後一個錯誤', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('connection refused'));

      await expect(fetchChapterPage(1, 1)).rejects.toThrow('connection refused');
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  // ---------------------------------------------------------------------------
  // fetchImage
  // ---------------------------------------------------------------------------
  describe('fetchImage', () => {
    it('回傳二進位資料和 content-type', async () => {
      const imageData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer; // JPEG magic bytes
      vi.mocked(fetch).mockResolvedValueOnce(
        makeResponse(imageData, { contentType: 'image/jpeg' })
      );

      const result = await fetchImage('https://img.manhuagui.com/test.jpg');

      expect(result.contentType).toBe('image/jpeg');
      expect(result.data).toBeInstanceOf(Buffer);
    });

    it('帶 Referer header', async () => {
      const buf = new ArrayBuffer(4);
      vi.mocked(fetch).mockResolvedValueOnce(
        makeResponse(buf, { contentType: 'image/webp' })
      );

      await fetchImage('https://img.manhuagui.com/test.webp');

      const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const headers = init?.headers as Record<string, string>;
      expect(headers['Referer']).toBe('https://www.manhuagui.com/');
    });

    it('帶 User-Agent header', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        makeResponse(new ArrayBuffer(0), { contentType: 'image/png' })
      );

      await fetchImage('https://img.manhuagui.com/test.png');

      const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const headers = init?.headers as Record<string, string>;
      expect(headers['User-Agent']).toMatch(/Mozilla\/5\.0/);
    });

    it('使用請求中帶入的完整圖片 URL', async () => {
      const imageUrl = 'https://img.manhuagui.com/comic/12345/v1/001.jpg';
      vi.mocked(fetch).mockResolvedValueOnce(
        makeResponse(new ArrayBuffer(0), { contentType: 'image/jpeg' })
      );

      await fetchImage(imageUrl);

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(imageUrl);
    });

    it('伺服器回傳 403 拋出含狀態碼的錯誤', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('', { status: 403 }));

      await expect(fetchImage('https://img.manhuagui.com/blocked.jpg')).rejects.toThrow(
        'HTTP 403'
      );
    });

    it('content-type 缺失時預設 image/jpeg', async () => {
      const buf = new ArrayBuffer(4);
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null },
        arrayBuffer: async () => buf,
      } as unknown as Response);

      const result = await fetchImage('https://img.manhuagui.com/test.jpg');

      expect(result.contentType).toBe('image/jpeg');
    });
  });

  // ---------------------------------------------------------------------------
  // fetchUpdateList
  // ---------------------------------------------------------------------------
  describe('fetchUpdateList', () => {
    it('page=1 請求 /update/', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html>updates</html>'));

      await fetchUpdateList(1);

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/update/`);
    });

    it('page=2 請求 /update/d2.html', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html>page2</html>'));

      await fetchUpdateList(2);

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/update/d2.html`);
    });

    it('page=10 請求 /update/d10.html', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html></html>'));

      await fetchUpdateList(10);

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/update/d10.html`);
    });

    it('預設 page=1', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html></html>'));

      await fetchUpdateList();

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/update/`);
    });
  });

  // ---------------------------------------------------------------------------
  // Timeout handling
  // ---------------------------------------------------------------------------
  describe('timeout handling', () => {
    it('請求超時時 AbortController 中斷並拋出錯誤', async () => {
      vi.mocked(fetch).mockImplementationOnce((_url, init) => {
        // Simulate the request being aborted
        const signal = (init as RequestInit).signal;
        return new Promise((_resolve, reject) => {
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }
          // Never resolve – caller's timeout will abort it
        });
      });

      vi.useFakeTimers();
      const promise = fetchMangaList('japan', 1);
      // Advance past the DEFAULT_TIMEOUT (15000ms)
      vi.advanceTimersByTime(16000);
      vi.useRealTimers();

      await expect(promise).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // fetchMangaListWithFilters
  // ---------------------------------------------------------------------------
  describe('fetchMangaListWithFilters', () => {
    it('所有篩選條件 → 正確拼接 URL（region_genre_year_letter_status）', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html></html>'));

      const options: FilterOptions = {
        region: RegionType.Japan,
        genre: GenreType.Rexue,
        year: '2024',
        letter: 'a',
        status: MangaStatus.Ongoing,
      };
      await fetchMangaListWithFilters(options);

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/list/japan_rexue_2024_a_lianzai/`);
    });

    it('只有 region → /list/{region}/', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html></html>'));

      await fetchMangaListWithFilters({ region: RegionType.Korea });

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/list/korea/`);
    });

    it('只有 genre → /list/{genre}/', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html></html>'));

      await fetchMangaListWithFilters({ genre: GenreType.Mohuan });

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/list/mohuan/`);
    });

    it('帶排序 sort=update 無分頁 → {filters}/update.html', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html></html>'));

      await fetchMangaListWithFilters({
        region: RegionType.Japan,
        sort: SortType.Update,
      });

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/list/japan/update.html`);
    });

    it('帶排序和分頁 → {filters}/{sort}_p{page}.html', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html></html>'));

      await fetchMangaListWithFilters({
        region: RegionType.Japan,
        sort: SortType.View,
        page: 3,
      });

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/list/japan/view_p3.html`);
    });

    it('無篩選條件僅分頁 → /list/index_p{page}.html', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html></html>'));

      await fetchMangaListWithFilters({ page: 5 });

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/list/index_p5.html`);
    });

    it('空物件 → /list/', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html></html>'));

      await fetchMangaListWithFilters({});

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/list/`);
    });

    it('status=Completed → URL 包含 wanjie', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html></html>'));

      await fetchMangaListWithFilters({ status: MangaStatus.Completed });

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('wanjie');
    });

    it('year 和 letter 存在時按正確順序插入（region_genre_year_letter_status）', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeResponse('<html></html>'));

      await fetchMangaListWithFilters({
        year: '2023',
        letter: 'b',
      });

      const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      // year comes before letter
      expect(url).toBe(`${BASE_URL}/list/2023_b/`);
    });
  });
});
