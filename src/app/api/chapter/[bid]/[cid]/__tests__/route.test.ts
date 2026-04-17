import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import * as scraper from '@/lib/scraper';
import * as chapterUtils from '@/lib/chapter-utils';

vi.mock('@/lib/scraper', () => ({
  fetchChapterPage: vi.fn(),
  fetchMangaDetail: vi.fn(),
  decryptChapterPage: vi.fn(),
  parseMangaDetail: vi.fn(),
  buildImageUrl: vi.fn(),
}));

vi.mock('@/lib/chapter-utils', () => ({
  computePrevNextCid: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  CacheHeaders: {
    CHAPTER: 'public, s-maxage=3600',
  },
}));

const callGET = (bid: string, cid: string) =>
  GET(new NextRequest(`http://localhost/api/chapter/${bid}/${cid}`), {
    params: Promise.resolve({ bid, cid }),
  });

describe('GET /api/chapter/[bid]/[cid] - ID validation', () => {
  it.each([
    ['bid="-1"', '-1', '1'],
    ['cid="-1"', '1', '-1'],
    ['bid="3.5"', '3.5', '1'],
    ['cid="3.5"', '1', '3.5'],
    ['bid="0"', '0', '1'],
    ['bid="abc"', 'abc', '1'],
  ])('returns 400 when %s', async (_label, bid, cid) => {
    const response = await callGET(bid, cid);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

describe('GET /api/chapter/[bid]/[cid] - successful request', () => {
  beforeEach(() => {
    vi.mocked(scraper.fetchChapterPage).mockResolvedValue('<html>chapter</html>');
    vi.mocked(scraper.fetchMangaDetail).mockResolvedValue('<html>manga</html>');
    vi.mocked(scraper.decryptChapterPage).mockReturnValue({
      bid: 123,
      cid: 456,
      bname: '測試漫畫',
      cname: '第1話',
      path: 'https://img.example.com/manga/123/456/',
      files: ['001.jpg', '002.jpg', '003.jpg'],
      sl: { e: 1700000000, m: 'abc123' },
      prevcid: 455,
      nextcid: 457,
    });
    vi.mocked(scraper.buildImageUrl).mockImplementation(
      (path, filename, _sl) => `${path}${filename}`
    );
  });

  it('returns 200 with images array and chapter metadata', async () => {
    const response = await callGET('123', '456');

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.bid).toBe(123);
    expect(body.data.cid).toBe(456);
    expect(body.data.bname).toBe('測試漫畫');
    expect(body.data.cname).toBe('第1話');
    expect(body.data.images).toEqual([
      'https://img.example.com/manga/123/456/001.jpg',
      'https://img.example.com/manga/123/456/002.jpg',
      'https://img.example.com/manga/123/456/003.jpg',
    ]);
    expect(body.data.total).toBe(3);
  });

  it('includes prevCid and nextCid from decrypted data when both are present', async () => {
    const response = await callGET('123', '456');

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.prevCid).toBe(455);
    expect(body.data.nextCid).toBe(457);
    // computePrevNextCid should NOT be called when decrypt data already has prev/next
    expect(chapterUtils.computePrevNextCid).not.toHaveBeenCalled();
  });

  it('includes correct Cache-Control header', async () => {
    const response = await callGET('123', '456');

    expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=3600');
  });
});

describe('GET /api/chapter/[bid]/[cid] - prev/next from manga detail fallback', () => {
  beforeEach(() => {
    vi.mocked(scraper.fetchChapterPage).mockResolvedValue('<html>chapter</html>');
    vi.mocked(scraper.fetchMangaDetail).mockResolvedValue('<html>manga</html>');
    vi.mocked(scraper.decryptChapterPage).mockReturnValue({
      bid: 10,
      cid: 20,
      bname: '漫畫A',
      cname: '第2話',
      path: 'https://cdn.example.com/',
      files: ['p1.jpg'],
      sl: { e: 1700000000, m: 'xyz' },
      prevcid: undefined,
      nextcid: undefined,
    });
    vi.mocked(scraper.buildImageUrl).mockImplementation(
      (path, filename, _sl) => `${path}${filename}`
    );
    vi.mocked(scraper.parseMangaDetail).mockReturnValue({
      id: 10,
      name: '漫畫A',
      cover: '',
      author: '',
      status: '',
      genres: [],
      description: '',
      lastUpdate: '',
      chapters: [
        {
          title: '話',
          chapters: [
            { id: 21, name: '第3話', url: '' },
            { id: 20, name: '第2話', url: '' },
            { id: 19, name: '第1話', url: '' },
          ],
        },
      ],
    });
    vi.mocked(chapterUtils.computePrevNextCid).mockReturnValue({
      prevCid: 19,
      nextCid: 21,
    });
  });

  it('falls back to computePrevNextCid when prevcid/nextcid are null in decrypt data', async () => {
    const response = await callGET('10', '20');

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.prevCid).toBe(19);
    expect(body.data.nextCid).toBe(21);
    expect(chapterUtils.computePrevNextCid).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 19, name: '第1話' })]),
      20
    );
  });
});

describe('GET /api/chapter/[bid]/[cid] - error handling', () => {
  it('returns 500 when decryptChapterPage returns null', async () => {
    vi.mocked(scraper.fetchChapterPage).mockResolvedValue('<html>chapter</html>');
    vi.mocked(scraper.fetchMangaDetail).mockResolvedValue('<html>manga</html>');
    vi.mocked(scraper.decryptChapterPage).mockReturnValue(null);

    const response = await callGET('1', '2');

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to decrypt chapter data');
  });

  it('returns 500 when fetchChapterPage throws', async () => {
    vi.mocked(scraper.fetchChapterPage).mockRejectedValue(new Error('Network timeout'));
    vi.mocked(scraper.fetchMangaDetail).mockResolvedValue('<html>manga</html>');

    const response = await callGET('1', '2');

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch chapter');
  });

  it('returns 500 when fetchMangaDetail throws', async () => {
    vi.mocked(scraper.fetchChapterPage).mockResolvedValue('<html>chapter</html>');
    vi.mocked(scraper.fetchMangaDetail).mockRejectedValue(new Error('503 Service Unavailable'));

    const response = await callGET('1', '2');

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch chapter');
  });
});
