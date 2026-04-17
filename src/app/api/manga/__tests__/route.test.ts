import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { RegionType, GenreType, MangaStatus, SortType } from '@/lib/scraper';

vi.mock('@/lib/scraper', () => ({
  fetchMangaList: vi.fn(),
  fetchMangaListWithFilters: vi.fn(),
  parseMangaList: vi.fn(),
  searchManga: vi.fn(),
  RegionType: {
    Japan: 'japan',
    Korea: 'korea',
    HongKong: 'hongkong',
    China: 'china',
    Europe: 'europe',
    Other: 'other',
  },
  GenreType: {
    Rexue: 'rexue',
    Maoxian: 'maoxian',
    Mohuan: 'mohuan',
    Shengui: 'shengui',
    Gaoxiao: 'gaoxiao',
    Mengxi: 'mengxi',
    Aiqing: 'aiqing',
    Kehuan: 'kehuan',
    Mofa: 'mofa',
    Gedou: 'gedou',
    Wuxia: 'wuxia',
    Jizhan: 'jizhan',
    Zhanzheng: 'zhanzheng',
    Jingji: 'jingji',
    Tiyu: 'tiyu',
    Xiaoyuan: 'xiaoyuan',
    Shenghuo: 'shenghuo',
    Lizhi: 'lizhi',
    Lishi: 'lishi',
    Weiniang: 'weiniang',
    Zhainan: 'zhainan',
    Funv: 'funv',
    Danmei: 'danmei',
    Baihe: 'baihe',
    Hougong: 'hougong',
    Zhiyu: 'zhiyu',
    Meishi: 'meishi',
    Tuili: 'tuili',
    Xuanyi: 'xuanyi',
    Kongbu: 'kongbu',
    Sige: 'sige',
    Zhichang: 'zhichang',
    Zhentan: 'zhentan',
    Shehui: 'shehui',
    Jieqi: 'jieqi',
    Guzhuang: 'guzhuang',
    Weinv: 'weinv',
    Qihuan: 'qihuan',
    Chuanyue: 'chuanyue',
    Heidao: 'heidao',
    Zhenren: 'zhenren',
    Jiangshi: 'jiangshi',
    Gaozhihui: 'gaozhihui',
    Egao: 'egao',
    Qingchun: 'qingchun',
  },
  MangaStatus: {
    All: '',
    Ongoing: 'lianzai',
    Completed: 'wanjie',
  },
  SortType: {
    Default: '',
    Update: 'update',
    View: 'view',
    Rate: 'rate',
  },
}));

vi.mock('@/lib/cache', () => ({
  withCache: vi.fn((_key: string, fetcher: () => Promise<unknown>) => fetcher()),
  normalizeUrlCacheKey: vi.fn((url: string) => {
    const { pathname, search } = new URL(url);
    return pathname + search;
  }),
  CacheHeaders: {
    SHORT: 'public, s-maxage=300, stale-while-revalidate=3600',
    SEARCH: 'public, s-maxage=60, stale-while-revalidate=300',
  },
}));

import {
  fetchMangaList,
  fetchMangaListWithFilters,
  parseMangaList,
  searchManga,
} from '@/lib/scraper';

const mockFetchMangaList = vi.mocked(fetchMangaList);
const mockFetchMangaListWithFilters = vi.mocked(fetchMangaListWithFilters);
const mockParseMangaList = vi.mocked(parseMangaList);
const mockSearchManga = vi.mocked(searchManga);

const MOCK_HTML = '<html>mock</html>';
const MOCK_MANGA_LIST = [
  { id: 1, name: '鬼滅之刃', cover: '/cover.jpg', latestChapter: '第1話', updateTime: '2024-01-01' },
];

const callGET = (params?: Record<string, string>) => {
  const url = new URL('http://localhost/api/manga');
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return GET(new NextRequest(url));
};

describe('GET /api/manga', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMangaList.mockResolvedValue(MOCK_HTML);
    mockFetchMangaListWithFilters.mockResolvedValue(MOCK_HTML);
    mockSearchManga.mockResolvedValue(MOCK_HTML);
    mockParseMangaList.mockReturnValue(MOCK_MANGA_LIST as never);
  });

  describe('預設模式（無篩選參數）', () => {
    it('無任何參數 → 以 "japan" 分類、第 1 頁呼叫 fetchMangaList', async () => {
      const response = await callGET();
      const body = await response.json();

      expect(mockFetchMangaList).toHaveBeenCalledOnce();
      expect(mockFetchMangaList).toHaveBeenCalledWith('japan', 1);
      expect(mockSearchManga).not.toHaveBeenCalled();
      expect(mockFetchMangaListWithFilters).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, data: MOCK_MANGA_LIST });
    });

    it('category=korea → 以 "korea" 分類呼叫 fetchMangaList', async () => {
      await callGET({ category: 'korea' });

      expect(mockFetchMangaList).toHaveBeenCalledWith('korea', 1);
    });

    it('page=3 → 以第 3 頁呼叫 fetchMangaList', async () => {
      await callGET({ page: '3' });

      expect(mockFetchMangaList).toHaveBeenCalledWith('japan', 3);
    });
  });

  describe('搜尋模式', () => {
    it('keyword 存在 → 呼叫 searchManga，不呼叫 fetchMangaList', async () => {
      const response = await callGET({ keyword: '鬼滅之刃' });
      const body = await response.json();

      expect(mockSearchManga).toHaveBeenCalledOnce();
      expect(mockSearchManga).toHaveBeenCalledWith('鬼滅之刃', 1);
      expect(mockFetchMangaList).not.toHaveBeenCalled();
      expect(mockFetchMangaListWithFilters).not.toHaveBeenCalled();
      expect(body).toEqual({ success: true, data: MOCK_MANGA_LIST });
    });

    it('keyword 搜尋 + page=2 → 以第 2 頁搜尋', async () => {
      await callGET({ keyword: 'naruto', page: '2' });

      expect(mockSearchManga).toHaveBeenCalledWith('naruto', 2);
    });

    it('keyword 搜尋 → Cache-Control 使用 SEARCH 策略', async () => {
      const response = await callGET({ keyword: '海賊王' });

      expect(response.headers.get('Cache-Control')).toBe(
        'public, s-maxage=60, stale-while-revalidate=300'
      );
    });

    it('無 keyword → Cache-Control 使用 SHORT 策略', async () => {
      const response = await callGET();

      expect(response.headers.get('Cache-Control')).toBe(
        'public, s-maxage=300, stale-while-revalidate=3600'
      );
    });
  });

  describe('keyword 長度驗證', () => {
    it('keyword 長度剛好 100 → 正常搜尋', async () => {
      const keyword = 'a'.repeat(100);
      await callGET({ keyword });

      expect(mockSearchManga).toHaveBeenCalledWith(keyword, 1);
    });

    it('keyword 長度 101（超過上限）→ keyword 被忽略，改用 fetchMangaList', async () => {
      const keyword = 'a'.repeat(101);
      await callGET({ keyword });

      expect(mockSearchManga).not.toHaveBeenCalled();
      expect(mockFetchMangaList).toHaveBeenCalledWith('japan', 1);
    });

    it('keyword 為空字串 → 視為無 keyword，使用 fetchMangaList', async () => {
      await callGET({ keyword: '' });

      expect(mockSearchManga).not.toHaveBeenCalled();
      expect(mockFetchMangaList).toHaveBeenCalledWith('japan', 1);
    });
  });

  describe('頁碼邊界夾值（parsePage）', () => {
    it('page=0 → clamp 至 1', async () => {
      await callGET({ page: '0' });

      expect(mockFetchMangaList).toHaveBeenCalledWith('japan', 1);
    });

    it('page=-5 → clamp 至 1', async () => {
      await callGET({ page: '-5' });

      expect(mockFetchMangaList).toHaveBeenCalledWith('japan', 1);
    });

    it('page=500 → 剛好等於 MAX_PAGE，保持 500', async () => {
      await callGET({ page: '500' });

      expect(mockFetchMangaList).toHaveBeenCalledWith('japan', 500);
    });

    it('page=501 → clamp 至 MAX_PAGE(500)', async () => {
      await callGET({ page: '501' });

      expect(mockFetchMangaList).toHaveBeenCalledWith('japan', 500);
    });

    it('page=9999 → clamp 至 MAX_PAGE(500)', async () => {
      await callGET({ page: '9999' });

      expect(mockFetchMangaList).toHaveBeenCalledWith('japan', 500);
    });

    it('page=abc（非數字）→ clamp 至 1', async () => {
      await callGET({ page: 'abc' });

      expect(mockFetchMangaList).toHaveBeenCalledWith('japan', 1);
    });
  });

  describe('篩選模式（fetchMangaListWithFilters）', () => {
    it('有效 region → 進入篩選模式', async () => {
      const response = await callGET({ region: 'japan' });
      const body = await response.json();

      expect(mockFetchMangaListWithFilters).toHaveBeenCalledOnce();
      expect(mockFetchMangaListWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ region: RegionType.Japan, page: 1 })
      );
      expect(mockFetchMangaList).not.toHaveBeenCalled();
      expect(body).toEqual({ success: true, data: MOCK_MANGA_LIST });
    });

    it('有效 genre → 進入篩選模式', async () => {
      await callGET({ genre: 'rexue' });

      expect(mockFetchMangaListWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ genre: GenreType.Rexue })
      );
    });

    it('有效 status=lianzai → 進入篩選模式', async () => {
      await callGET({ status: 'lianzai' });

      expect(mockFetchMangaListWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ status: MangaStatus.Ongoing })
      );
    });

    it('有效 status=wanjie → 進入篩選模式', async () => {
      await callGET({ status: 'wanjie' });

      expect(mockFetchMangaListWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ status: MangaStatus.Completed })
      );
    });

    it('有效 sort=update → 進入篩選模式', async () => {
      await callGET({ sort: 'update' });

      expect(mockFetchMangaListWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ sort: SortType.Update })
      );
    });

    it('有效 sort=view → 進入篩選模式', async () => {
      await callGET({ sort: 'view' });

      expect(mockFetchMangaListWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ sort: SortType.View })
      );
    });

    it('有效 sort=rate → 進入篩選模式', async () => {
      await callGET({ sort: 'rate' });

      expect(mockFetchMangaListWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ sort: SortType.Rate })
      );
    });

    it('year 參數 → 進入篩選模式並傳遞 year', async () => {
      await callGET({ year: '2024' });

      expect(mockFetchMangaListWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ year: '2024' })
      );
    });

    it('letter 參數 → 進入篩選模式並轉小寫', async () => {
      await callGET({ letter: 'A' });

      expect(mockFetchMangaListWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ letter: 'a' })
      );
    });

    it('letter 已小寫 → 傳遞原值', async () => {
      await callGET({ letter: 'z' });

      expect(mockFetchMangaListWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ letter: 'z' })
      );
    });

    it('多個篩選條件 region+genre+sort+page → 全部傳入 FilterOptions', async () => {
      await callGET({ region: 'korea', genre: 'aiqing', sort: 'rate', page: '2' });

      expect(mockFetchMangaListWithFilters).toHaveBeenCalledWith({
        region: RegionType.Korea,
        genre: GenreType.Aiqing,
        sort: SortType.Rate,
        page: 2,
      });
    });

    it('FilterOptions 中無效篩選值為 null', async () => {
      await callGET({ region: 'japan' });

      const [options] = mockFetchMangaListWithFilters.mock.calls[0];
      expect(options.genre).toBeFalsy();
      expect(options.status).toBeFalsy();
      expect(options.sort).toBeFalsy();
    });
  });

  describe('無效篩選參數（驗證失敗 → 忽略）', () => {
    it.each([
      ['region', 'invalid-region'],
      ['region', 'america'],
      ['region', 'JAPAN'],
    ])('%s=%s → 忽略，退回預設 fetchMangaList', async (param, value) => {
      await callGET({ [param]: value });

      expect(mockFetchMangaList).toHaveBeenCalledWith('japan', 1);
      expect(mockFetchMangaListWithFilters).not.toHaveBeenCalled();
    });

    it.each([
      ['genre', 'invalid-genre'],
      ['genre', 'action'],
      ['genre', 'REXUE'],
    ])('%s=%s → 忽略，退回預設 fetchMangaList', async (param, value) => {
      await callGET({ [param]: value });

      expect(mockFetchMangaList).toHaveBeenCalledWith('japan', 1);
      expect(mockFetchMangaListWithFilters).not.toHaveBeenCalled();
    });

    it.each([
      ['status', 'invalid-status'],
      ['status', 'ongoing'],
      ['status', ''],
    ])('%s="%s" → 忽略，退回預設 fetchMangaList', async (param, value) => {
      await callGET({ [param]: value });

      expect(mockFetchMangaList).toHaveBeenCalledWith('japan', 1);
      expect(mockFetchMangaListWithFilters).not.toHaveBeenCalled();
    });

    it.each([
      ['sort', 'invalid-sort'],
      ['sort', 'asc'],
      ['sort', ''],
    ])('%s="%s" → 忽略，退回預設 fetchMangaList', async (param, value) => {
      await callGET({ [param]: value });

      expect(mockFetchMangaList).toHaveBeenCalledWith('japan', 1);
      expect(mockFetchMangaListWithFilters).not.toHaveBeenCalled();
    });
  });

  describe('成功回應格式', () => {
    it('parseMangaList 的回傳值放入 data 欄位', async () => {
      const customList = [
        { id: 42, name: '進擊的巨人', cover: '/cover42.jpg', latestChapter: '第139話', updateTime: '2021-04-09' },
      ];
      mockParseMangaList.mockReturnValue(customList as never);

      const response = await callGET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, data: customList });
    });

    it('parseMangaList 以 html 字串呼叫', async () => {
      mockFetchMangaList.mockResolvedValue('<html>page-html</html>');

      await callGET();

      expect(mockParseMangaList).toHaveBeenCalledWith('<html>page-html</html>');
    });
  });

  describe('錯誤處理', () => {
    it('fetchMangaList 拋錯 → 500 with { success: false, error: ... }', async () => {
      mockFetchMangaList.mockRejectedValue(new Error('network error'));

      const response = await callGET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ success: false, error: 'Failed to fetch manga list' });
    });

    it('searchManga 拋錯 → 500 with { success: false, error: ... }', async () => {
      mockSearchManga.mockRejectedValue(new Error('search failed'));

      const response = await callGET({ keyword: '進擊的巨人' });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ success: false, error: 'Failed to fetch manga list' });
    });

    it('fetchMangaListWithFilters 拋錯 → 500 with { success: false, error: ... }', async () => {
      mockFetchMangaListWithFilters.mockRejectedValue(new Error('filter error'));

      const response = await callGET({ region: 'japan' });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ success: false, error: 'Failed to fetch manga list' });
    });

    it('parseMangaList 拋錯 → 500 with { success: false, error: ... }', async () => {
      mockParseMangaList.mockImplementation(() => { throw new Error('parse error'); });

      const response = await callGET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ success: false, error: 'Failed to fetch manga list' });
    });
  });
});
