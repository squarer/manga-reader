/**
 * Phase 3：source 概念貫穿測試
 */

import { describe, it, expect } from 'vitest';
import type { MangaListItem, MangaInfo } from '@/lib/scraper/types';
import type { ChapterImages } from '@/lib/scraper/providers/types';
import type { FavoriteItem } from '@/lib/hooks/useFavorites';
import type { HistoryItem } from '@/lib/hooks/useHistory';

// ─── 1. SourceId 在 scraper/types.ts ────────────────────────────────────────
describe('SourceId in scraper/types', () => {
  it('exports SourceId type from scraper/types (runtime guard)', async () => {
    const { DEFAULT_SOURCE } = await import('@/lib/scraper/providers');
    expect(DEFAULT_SOURCE).toBe('manhuagui');
  });
});

// ─── 2. domain 型別帶 source ─────────────────────────────────────────────────
describe('MangaListItem has source field', () => {
  it('MangaListItem shape includes source', () => {
    const item: MangaListItem = {
      id: '1',
      name: 'test',
      cover: '',
      latestChapter: '',
      updateTime: '',
      source: 'manhuagui',
    };
    expect(item.source).toBe('manhuagui');
  });

  it('MangaInfo shape includes source', () => {
    const info: MangaInfo = {
      id: '1',
      name: 'test',
      cover: '',
      author: '',
      status: '',
      genres: [],
      description: '',
      lastUpdate: '',
      chapters: [],
      source: 'dm5',
    };
    expect(info.source).toBe('dm5');
  });
});

// ─── 3. ChapterImages 帶 source ──────────────────────────────────────────────
describe('ChapterImages has source field', () => {
  it('ChapterImages shape includes source', () => {
    const ci: ChapterImages = {
      bid: 'xxx',
      cid: '123',
      bname: 'b',
      cname: 'c',
      images: [],
      total: 0,
      source: 'dm5',
    };
    expect(ci.source).toBe('dm5');
  });
});

// ─── 4. Provider id 蓋章 ─────────────────────────────────────────────────────
describe('Provider stamps source on returned items', () => {
  it('manhuaguiProvider.id is manhuagui', async () => {
    const { manhuaguiProvider } = await import('@/lib/scraper/providers/manhuagui');
    expect(manhuaguiProvider.id).toBe('manhuagui');
  });

  it('dm5Provider.id is dm5', async () => {
    const { dm5Provider } = await import('@/lib/scraper/providers/dm5');
    expect(dm5Provider.id).toBe('dm5');
  });
});

// ─── 5. getProvider 行為不變（未知 source 回 manhuagui）────────────────────
describe('getProvider fallback', () => {
  it('getProvider with no arg returns manhuagui', async () => {
    const { getProvider } = await import('@/lib/scraper/providers');
    expect(getProvider().id).toBe('manhuagui');
  });

  it('getProvider with null returns manhuagui', async () => {
    const { getProvider } = await import('@/lib/scraper/providers');
    expect(getProvider(null).id).toBe('manhuagui');
  });

  it('getProvider with unknown returns manhuagui', async () => {
    const { getProvider } = await import('@/lib/scraper/providers');
    expect(getProvider('nonexistent').id).toBe('manhuagui');
  });

  it('getProvider with dm5 returns dm5', async () => {
    const { getProvider } = await import('@/lib/scraper/providers');
    expect(getProvider('dm5').id).toBe('dm5');
  });
});

// ─── 6. FavoriteItem has source ──────────────────────────────────────────────
describe('FavoriteItem has source field', () => {
  it('FavoriteItem type includes source', () => {
    const item: FavoriteItem = {
      mangaId: '1',
      mangaName: 'test',
      mangaCover: '',
      addedAt: 0,
      source: 'manhuagui',
    };
    expect(item.source).toBe('manhuagui');
  });
});

// ─── 7. HistoryItem has source ───────────────────────────────────────────────
describe('HistoryItem has source field', () => {
  it('HistoryItem type includes source', () => {
    const item: HistoryItem = {
      mangaId: '1',
      mangaName: 'test',
      mangaCover: '',
      chapterId: '123',
      chapterName: 'ch1',
      page: 0,
      timestamp: 0,
      source: 'dm5',
    };
    expect(item.source).toBe('dm5');
  });
});
