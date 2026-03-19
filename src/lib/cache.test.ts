import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normalizeUrlCacheKey, withCache, getCache, setCache, CacheHeaders } from './cache';

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

describe('withCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Given key already cached, when withCache called again, then fetcher is not called a second time', async () => {
    const key = `/api/manga?_test=withcache-hit-${Date.now()}`;
    const payload = { title: 'One Piece', chapter: 1000 };
    const fetcher = vi.fn().mockResolvedValue(payload);

    const first = await withCache(key, fetcher);
    const second = await withCache(key, fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(first).toEqual(payload);
    expect(second).toEqual(payload);
  });

  it('Given key already cached, when withCache called again, then returns same data reference', async () => {
    const key = `/api/manga?_test=withcache-ref-${Date.now()}`;
    const fetcher = vi.fn().mockResolvedValue([1, 2, 3]);

    const first = await withCache<number[]>(key, fetcher);
    const second = await withCache<number[]>(key, fetcher);

    expect(second).toEqual(first);
  });

  it('Given fetcher throws, when withCache called, then error propagates without silent swallow', async () => {
    const key = `/api/manga?_test=withcache-error-${Date.now()}`;
    const boom = new Error('network failure');
    const fetcher = vi.fn().mockRejectedValue(boom);

    await expect(withCache(key, fetcher)).rejects.toThrow('network failure');
  });

  it('Given fetcher rejects with non-Error value, when withCache called, then rejection propagates', async () => {
    const key = `/api/manga?_test=withcache-reject-${Date.now()}`;
    const fetcher = vi.fn().mockRejectedValue('string rejection');

    await expect(withCache(key, fetcher)).rejects.toBe('string rejection');
  });
});

describe('getCache / setCache', () => {
  it('Given key not set, when getCache called, then returns null', () => {
    expect(getCache(`/api/never-set-${Date.now()}`)).toBeNull();
  });

  it('Given object value, when setCache then getCache, then returns same object', () => {
    const key = `/api/obj-${Date.now()}`;
    const value = { id: 1, title: 'Naruto', tags: ['action'] };
    setCache(key, value);
    expect(getCache(key)).toEqual(value);
  });

  it('Given array value, when setCache then getCache, then returns same array', () => {
    const key = `/api/arr-${Date.now()}`;
    const value = [1, 2, 3];
    setCache(key, value);
    expect(getCache(key)).toEqual(value);
  });

  it('Given string value, when setCache then getCache, then returns same string', () => {
    const key = `/api/str-${Date.now()}`;
    setCache(key, 'hello world');
    expect(getCache<string>(key)).toBe('hello world');
  });

  it('Given number value, when setCache then getCache, then returns same number', () => {
    const key = `/api/num-${Date.now()}`;
    setCache(key, 42);
    expect(getCache<number>(key)).toBe(42);
  });

  it('Given null-ish value like 0, when setCache then getCache, then returns 0 (not confused with cache miss)', () => {
    const key = `/api/zero-${Date.now()}`;
    setCache(key, 0);
    // getCache returns null on miss, so 0 would incorrectly look like a miss
    // The current implementation stores 0 and returns it; this test documents that behavior
    expect(getCache<number>(key)).toBe(0);
  });
});

describe('TTL expiration', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('Given entry set, when TTL has not expired, then getCache returns data', () => {
    vi.useFakeTimers();
    const key = `/api/ttl-valid-${Date.now()}`;
    setCache(key, { fresh: true });

    vi.advanceTimersByTime(86399999); // 1ms before 24h
    expect(getCache(key)).toEqual({ fresh: true });
  });

  it('Given entry set, when TTL has expired (>24h), then getCache returns null', () => {
    vi.useFakeTimers();
    const key = `/api/ttl-expired-${Date.now()}`;
    setCache(key, { stale: true });

    vi.advanceTimersByTime(86400001); // 1ms after 24h
    expect(getCache(key)).toBeNull();
  });

  it('Given expired entry evicted, when setCache called with same key, then fresh data is returned', () => {
    vi.useFakeTimers();
    const key = `/api/ttl-refresh-${Date.now()}`;
    setCache(key, 'old');
    vi.advanceTimersByTime(86400001);
    expect(getCache(key)).toBeNull(); // evicted

    setCache(key, 'new');
    expect(getCache<string>(key)).toBe('new');
  });
});

describe('Cache eviction (FIFO at MAX_CACHE_SIZE)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('Given cache at MAX_CACHE_SIZE (1000), when new key inserted, then oldest key is evicted', () => {
    vi.useFakeTimers();
    const prefix = `evict-fifo-${Date.now()}`;
    // Fill 1000 entries (MAX_CACHE_SIZE)
    for (let i = 0; i < 1000; i++) {
      setCache(`${prefix}-slot-${i}`, i);
    }
    const firstKey = `${prefix}-slot-0`;
    expect(getCache(firstKey)).toBe(0); // still present

    // Adding one more should evict the first entry
    setCache(`${prefix}-slot-1000`, 1000);

    expect(getCache(firstKey)).toBeNull(); // evicted
    expect(getCache(`${prefix}-slot-1`)).toBe(1); // second entry survives
    expect(getCache(`${prefix}-slot-1000`)).toBe(1000); // new entry present
  });

  it('Given cache at MAX_CACHE_SIZE, when existing key updated, then no eviction occurs', () => {
    vi.useFakeTimers();
    const prefix = `evict-update-${Date.now()}`;
    for (let i = 0; i < 1000; i++) {
      setCache(`${prefix}-slot-${i}`, i);
    }
    const firstKey = `${prefix}-slot-0`;

    // Update an existing key — must NOT evict anything
    setCache(firstKey, 'updated');

    expect(getCache<string>(firstKey)).toBe('updated'); // updated, not evicted
    expect(getCache(`${prefix}-slot-999`)).toBe(999); // last entry still intact
  });
});

describe('CacheHeaders constants', () => {
  it('SHORT is 5-minute s-maxage with 1-hour stale-while-revalidate', () => {
    expect(CacheHeaders.SHORT).toBe('public, s-maxage=300, stale-while-revalidate=3600');
  });

  it('SEARCH is 1-minute s-maxage with 5-minute stale-while-revalidate', () => {
    expect(CacheHeaders.SEARCH).toBe('public, s-maxage=60, stale-while-revalidate=300');
  });

  it('DETAIL is 1-hour s-maxage with 24-hour stale-while-revalidate', () => {
    expect(CacheHeaders.DETAIL).toBe('public, s-maxage=3600, stale-while-revalidate=86400');
  });

  it('CHAPTER is 1-hour s-maxage with no stale-while-revalidate', () => {
    expect(CacheHeaders.CHAPTER).toBe('public, s-maxage=3600');
    expect(CacheHeaders.CHAPTER).not.toContain('stale-while-revalidate');
  });

  it('all values are public cache-control directives', () => {
    for (const value of Object.values(CacheHeaders)) {
      expect(value).toMatch(/^public,/);
    }
  });
});

describe('normalizeUrlCacheKey edge cases', () => {
  it('Given URL with hash fragment, when normalized, then hash is stripped', () => {
    // URL constructor discards hash from search, hash is client-side only
    const key = normalizeUrlCacheKey('http://localhost:3000/api/manga?page=1#section2');
    expect(key).toBe('/api/manga?page=1');
    expect(key).not.toContain('#');
  });

  it('Given URL with encoded characters, when normalized, then encoding is preserved', () => {
    const key = normalizeUrlCacheKey('http://localhost:3000/api/manga?q=%E8%8B%B1%E9%9B%84');
    expect(key).toBe('/api/manga?q=%E8%8B%B1%E9%9B%84');
  });

  it('Given URL with root path and no query, when normalized, then returns slash', () => {
    expect(normalizeUrlCacheKey('http://localhost:3000/')).toBe('/');
  });
});
