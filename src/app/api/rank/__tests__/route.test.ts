import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/scraper', () => ({
  fetchRankList: vi.fn(),
  parseRankList: vi.fn(),
  RankTypeEnum: {
    Day: 'day',
    Week: 'week',
    Month: 'month',
    Total: 'total',
  },
}));

vi.mock('@/lib/cache', () => ({
  withCache: vi.fn((_key: string, fetcher: () => Promise<unknown>) => fetcher()),
  CacheHeaders: {
    SHORT: 'public, s-maxage=300, stale-while-revalidate=3600',
  },
  normalizeUrlCacheKey: vi.fn((url: string) => {
    const { pathname, search } = new URL(url);
    return pathname + search;
  }),
}));

import { fetchRankList, parseRankList } from '@/lib/scraper';

const mockFetchRankList = vi.mocked(fetchRankList);
const mockParseRankList = vi.mocked(parseRankList);

const callGET = (params?: Record<string, string>) => {
  const url = new URL('http://localhost/api/rank');
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return GET(new NextRequest(url));
};

const MOCK_HTML = '<html>rank</html>';
const MOCK_ITEMS = [
  { rank: 1, title: '龍珠', id: '1', cover: 'http://img/1.jpg', trend: 'up' },
  { rank: 2, title: '海賊王', id: '2', cover: 'http://img/2.jpg', trend: 'same' },
];

describe('GET /api/rank', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchRankList.mockResolvedValue(MOCK_HTML);
    mockParseRankList.mockReturnValue(MOCK_ITEMS as never);
  });

  describe('預設參數', () => {
    it('無 type 參數時使用 day 作為預設值', async () => {
      const response = await callGET();

      expect(response.status).toBe(200);
      expect(mockFetchRankList).toHaveBeenCalledWith('day');
    });

    it('回應包含正確的 type 欄位', async () => {
      const response = await callGET();
      const body = await response.json();

      expect(body).toEqual({ success: true, data: { type: 'day', items: MOCK_ITEMS } });
    });
  });

  describe('合法 type 參數', () => {
    it.each([
      ['day', 'day'],
      ['week', 'week'],
      ['month', 'month'],
      ['total', 'total'],
    ])('type=%s → 傳遞正確 type 給 fetcher', async (type, expected) => {
      const response = await callGET({ type });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(mockFetchRankList).toHaveBeenCalledWith(expected);
      expect(body.success).toBe(true);
      expect(body.data.type).toBe(expected);
    });

    it('回應包含 scraper 回傳的 items', async () => {
      const response = await callGET({ type: 'week' });
      const body = await response.json();

      expect(body.data.items).toEqual(MOCK_ITEMS);
      expect(mockParseRankList).toHaveBeenCalledWith(MOCK_HTML, 'week');
    });
  });

  describe('非法 type 參數', () => {
    it.each([
      ['invalid', 'unknown string'],
      ['daily', 'typo of day'],
      ['WEEK', 'uppercase'],
      ['', 'empty string uses default day'],
    ])('type="%s" (%s)', async (type, _desc) => {
      const response = await callGET({ type });

      if (type === '') {
        // 空字串 fallback 為 default 'day'，視同合法
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toMatch(/Invalid type/);
      }
    });

    it('400 錯誤訊息列出所有合法值', async () => {
      const response = await callGET({ type: 'badtype' });
      const body = await response.json();

      expect(body.error).toContain('day');
      expect(body.error).toContain('week');
      expect(body.error).toContain('month');
      expect(body.error).toContain('total');
    });

    it('非法 type 時不呼叫 scraper', async () => {
      await callGET({ type: 'yearly' });

      expect(mockFetchRankList).not.toHaveBeenCalled();
      expect(mockParseRankList).not.toHaveBeenCalled();
    });
  });

  describe('成功回應格式', () => {
    it('回應結構符合 { success: true, data: { type, items } }', async () => {
      const response = await callGET({ type: 'month' });
      const body = await response.json();

      expect(body).toMatchObject({
        success: true,
        data: {
          type: 'month',
          items: expect.any(Array),
        },
      });
    });

    it('包含 Cache-Control 回應標頭', async () => {
      const response = await callGET({ type: 'day' });

      expect(response.headers.get('Cache-Control')).toBe(
        'public, s-maxage=300, stale-while-revalidate=3600'
      );
    });
  });

  describe('Scraper 錯誤處理', () => {
    it('fetchRankList 拋錯 → 回傳 500', async () => {
      mockFetchRankList.mockRejectedValue(new Error('Network timeout'));

      const response = await callGET({ type: 'day' });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ success: false, error: 'Failed to fetch rank list' });
    });

    it('parseRankList 拋錯 → 回傳 500', async () => {
      mockParseRankList.mockImplementation(() => {
        throw new Error('Parse failed');
      });

      const response = await callGET({ type: 'week' });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });

    it('500 回應不洩漏內部錯誤訊息', async () => {
      mockFetchRankList.mockRejectedValue(new Error('Internal secret error detail'));

      const response = await callGET({ type: 'total' });
      const body = await response.json();

      expect(body.error).not.toContain('secret');
      expect(body.error).toBe('Failed to fetch rank list');
    });
  });
});
