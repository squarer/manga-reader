import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

const { mockFetchUpdateList, mockParseUpdateList, mockWithCache, mockNormalizeUrlCacheKey } =
  vi.hoisted(() => ({
    mockFetchUpdateList: vi.fn(),
    mockParseUpdateList: vi.fn(),
    mockWithCache: vi.fn(),
    mockNormalizeUrlCacheKey: vi.fn(),
  }));

vi.mock('@/lib/scraper', () => ({
  fetchUpdateList: mockFetchUpdateList,
  parseUpdateList: mockParseUpdateList,
}));

vi.mock('@/lib/cache', () => ({
  withCache: mockWithCache,
  CacheHeaders: { SHORT: 'public, s-maxage=300, stale-while-revalidate=3600' },
  normalizeUrlCacheKey: mockNormalizeUrlCacheKey,
}));

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return { ...actual };
});

const callGET = (params?: Record<string, string>) => {
  const url = new URL('http://localhost/api/manga/update');
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return GET(new NextRequest(url));
};

describe('GET /api/manga/update', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockNormalizeUrlCacheKey.mockImplementation((url: string) => {
      const { pathname, search } = new URL(url);
      return pathname + search;
    });

    mockWithCache.mockImplementation(async (_key: string, fetcher: () => Promise<unknown>) =>
      fetcher()
    );
  });

  describe('page parameter parsing', () => {
    it('no page param → passes page 1 to fetchUpdateList', async () => {
      const fakeData = { mangas: [], pagination: null };
      mockFetchUpdateList.mockResolvedValue('<html>');
      mockParseUpdateList.mockReturnValue(fakeData);

      await callGET();

      expect(mockFetchUpdateList).toHaveBeenCalledWith(1);
    });

    it('page=3 → passes page 3 to fetchUpdateList', async () => {
      mockFetchUpdateList.mockResolvedValue('<html>');
      mockParseUpdateList.mockReturnValue({ mangas: [], pagination: null });

      await callGET({ page: '3' });

      expect(mockFetchUpdateList).toHaveBeenCalledWith(3);
    });

    it.each([
      ['-1', 'negative integer'],
      ['0', 'zero'],
      ['-99', 'large negative'],
    ])('page=%s (%s) → clamped to 1', async (pageStr) => {
      mockFetchUpdateList.mockResolvedValue('<html>');
      mockParseUpdateList.mockReturnValue({ mangas: [], pagination: null });

      await callGET({ page: pageStr });

      expect(mockFetchUpdateList).toHaveBeenCalledWith(1);
    });

    it.each([
      ['abc', 'non-numeric string'],
      ['', 'empty string'],
    ])('page="%s" (%s) → clamped to 1', async (pageStr) => {
      mockFetchUpdateList.mockResolvedValue('<html>');
      mockParseUpdateList.mockReturnValue({ mangas: [], pagination: null });

      await callGET({ page: pageStr });

      expect(mockFetchUpdateList).toHaveBeenCalledWith(1);
    });
  });

  describe('successful response', () => {
    it('returns { success: true, data: ... } with parsed result', async () => {
      const fakeData = {
        mangas: [{ id: '1', title: 'Test Manga', cover: '/img.jpg' }],
        pagination: { current: 1, total: 10 },
      };
      mockFetchUpdateList.mockResolvedValue('<html>page content</html>');
      mockParseUpdateList.mockReturnValue(fakeData);

      const response = await callGET({ page: '1' });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, data: fakeData });
    });

    it('passes HTML from fetchUpdateList into parseUpdateList', async () => {
      const html = '<html>manga list</html>';
      mockFetchUpdateList.mockResolvedValue(html);
      mockParseUpdateList.mockReturnValue({ mangas: [], pagination: null });

      await callGET();

      expect(mockParseUpdateList).toHaveBeenCalledWith(html);
    });

    it('sets Cache-Control: SHORT header on success', async () => {
      mockFetchUpdateList.mockResolvedValue('<html>');
      mockParseUpdateList.mockReturnValue({ mangas: [] });

      const response = await callGET();

      expect(response.headers.get('Cache-Control')).toBe(
        'public, s-maxage=300, stale-while-revalidate=3600'
      );
    });
  });

  describe('cache integration', () => {
    it('calls withCache with key derived from request URL', async () => {
      mockFetchUpdateList.mockResolvedValue('<html>');
      mockParseUpdateList.mockReturnValue({ mangas: [] });

      await callGET({ page: '2' });

      expect(mockNormalizeUrlCacheKey).toHaveBeenCalledWith(
        'http://localhost/api/manga/update?page=2'
      );
      expect(mockWithCache).toHaveBeenCalledWith(
        '/api/manga/update?page=2',
        expect.any(Function)
      );
    });

    it('returns cached data without calling scraper when cache hits', async () => {
      const cachedData = { mangas: [{ id: '99', title: 'Cached' }], pagination: null };
      mockWithCache.mockResolvedValue(cachedData);

      const response = await callGET({ page: '1' });
      const body = await response.json();

      expect(mockFetchUpdateList).not.toHaveBeenCalled();
      expect(mockParseUpdateList).not.toHaveBeenCalled();
      expect(body).toEqual({ success: true, data: cachedData });
    });

    it('no-param request uses key /api/manga/update (no query string)', async () => {
      mockFetchUpdateList.mockResolvedValue('<html>');
      mockParseUpdateList.mockReturnValue({ mangas: [] });

      await callGET();

      expect(mockNormalizeUrlCacheKey).toHaveBeenCalledWith(
        'http://localhost/api/manga/update'
      );
      expect(mockWithCache).toHaveBeenCalledWith(
        '/api/manga/update',
        expect.any(Function)
      );
    });
  });

  describe('error handling', () => {
    it('fetchUpdateList throws → 500 with { success: false, error: ... }', async () => {
      mockWithCache.mockImplementation(async (_key: string, fetcher: () => Promise<unknown>) =>
        fetcher()
      );
      mockFetchUpdateList.mockRejectedValue(new Error('Network timeout'));

      const response = await callGET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ success: false, error: 'Failed to fetch update list' });
    });

    it('parseUpdateList throws → 500 with { success: false, error: ... }', async () => {
      mockFetchUpdateList.mockResolvedValue('<html>bad</html>');
      mockParseUpdateList.mockImplementation(() => {
        throw new Error('Parse error');
      });

      const response = await callGET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ success: false, error: 'Failed to fetch update list' });
    });

    it('withCache rejects → 500 with { success: false, error: ... }', async () => {
      mockWithCache.mockRejectedValue(new Error('Cache failure'));

      const response = await callGET({ page: '5' });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ success: false, error: 'Failed to fetch update list' });
    });

    it('error response has no Cache-Control header', async () => {
      mockWithCache.mockRejectedValue(new Error('boom'));

      const response = await callGET();

      expect(response.headers.get('Cache-Control')).toBeNull();
    });
  });
});
