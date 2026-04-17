import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

vi.mock('@/lib/scraper', () => ({
  fetchMangaDetail: vi.fn(),
  parseMangaDetail: vi.fn(),
}));

const callGET = (id: string) =>
  GET(new NextRequest('http://localhost/api/manga/' + id), {
    params: Promise.resolve({ id }),
  });

describe('GET /api/manga/[id] — ID 驗證', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['-1', 'negative integer'],
    ['3.5', 'float'],
    ['0', 'zero'],
    ['abc', 'non-numeric string'],
    ['', 'empty string'],
    ['999999999999999999', 'exceeds safe integer range'],
  ])('id = "%s" (%s) → 400 Invalid manga ID', async (id) => {
    const response = await callGET(id);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ success: false, error: 'Invalid manga ID' });
  });
});
