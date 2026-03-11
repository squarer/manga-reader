import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeUrlCacheKey, withCache } from './cache';

describe('normalizeUrlCacheKey', () => {
  it('Given dev and prod URLs with same path+query, when normalized, then same key', () => {
    const devUrl = 'http://localhost:3000/api/rank?type=day';
    const prodUrl = 'https://manga.example.com/api/rank?type=day';
    expect(normalizeUrlCacheKey(devUrl)).toBe(normalizeUrlCacheKey(prodUrl));
  });

  it('Given full URL, when normalized, then key contains only pathname + search', () => {
    const key = normalizeUrlCacheKey('http://localhost:3000/api/rank?type=week');
    expect(key).toBe('/api/rank?type=week');
    expect(key).not.toContain('localhost');
    expect(key).not.toContain('http');
  });

  it('Given URL with no query string, when normalized, then returns only pathname', () => {
    expect(normalizeUrlCacheKey('http://localhost:3000/api/manga')).toBe('/api/manga');
  });

  it('Given URL with multiple params, when normalized, then preserves full search string', () => {
    const key = normalizeUrlCacheKey('https://prod.com/api/manga?page=2&region=japan');
    expect(key).toBe('/api/manga?page=2&region=japan');
  });

  it('Given URL with different ports, when normalized, then same key', () => {
    const port3000 = normalizeUrlCacheKey('http://localhost:3000/api/manga/update?page=1');
    const port4000 = normalizeUrlCacheKey('http://localhost:4000/api/manga/update?page=1');
    expect(port3000).toBe(port4000);
  });
});

describe('withCache + normalizeUrlCacheKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Given dev URL cached, when queried with prod URL (same path+query), then fetcher called only once', async () => {
    const testId = Date.now().toString();
    const devUrl = `http://localhost:3000/api/rank?type=day&_test=${testId}`;
    const prodUrl = `https://prod.com/api/rank?type=day&_test=${testId}`;
    const fetcher = vi.fn().mockResolvedValue({ items: [1, 2, 3] });

    await withCache(normalizeUrlCacheKey(devUrl), fetcher);
    await withCache(normalizeUrlCacheKey(prodUrl), fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
