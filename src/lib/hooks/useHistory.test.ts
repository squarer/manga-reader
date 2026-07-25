import { describe, it, expect } from 'vitest';
import { migrateHistoryItems, type HistoryItem } from './useHistory';

/** 建立最小 HistoryItem（欄位可覆寫，模擬各世代舊資料） */
function item(overrides: Partial<HistoryItem> & Record<string, unknown> = {}): HistoryItem {
  return {
    mangaId: 'abc',
    mangaName: '測試',
    mangaCover: '',
    chapterId: 'c1',
    chapterName: '第1話',
    page: 0,
    timestamp: 1,
    source: 'manhuagui',
    ...overrides,
  } as HistoryItem;
}

describe('migrateHistoryItems', () => {
  it('無 source 的舊資料補為 manhuagui', () => {
    const noSource: Partial<HistoryItem> = item();
    delete noSource.source;
    const [r] = migrateHistoryItems([noSource as HistoryItem]);
    expect(r.source).toBe('manhuagui');
  });

  it('number 型 mangaId / chapterId 正規化為 string', () => {
    const [r] = migrateHistoryItems([item({ mangaId: 123 as unknown as string, chapterId: 456 as unknown as string })]);
    expect(r.mangaId).toBe('123');
    expect(r.chapterId).toBe('456');
  });

  it('非 manhuagui 誤存 /cpic/ 專屬封面 → 清空（回歸 dm5 歷史破圖 bug）', () => {
    const [r] = migrateHistoryItems([
      item({ source: 'dm5', mangaCover: '/cpic/b/youyoubaishu.jpg' }),
    ]);
    expect(r.mangaCover).toBe('');
  });

  it('manhuagui 的 /cpic/ 封面為合法，保留不清空', () => {
    const [r] = migrateHistoryItems([
      item({ source: 'manhuagui', mangaCover: '/cpic/b/123.jpg' }),
    ]);
    expect(r.mangaCover).toBe('/cpic/b/123.jpg');
  });

  it('dm5 合法完整封面 URL 不受影響', () => {
    const url = 'https://mhfm9tw.cdndm5.com/2/1244/x.jpg';
    const [r] = migrateHistoryItems([item({ source: 'dm5', mangaCover: url })]);
    expect(r.mangaCover).toBe(url);
  });

  it('mhgui 完整 URL 轉為相對路徑（沿用既有正規化）', () => {
    const [r] = migrateHistoryItems([
      item({ source: 'manhuagui', mangaCover: 'https://cf.mhgui.com/cpic/b/9.jpg' }),
    ]);
    expect(r.mangaCover).toBe('/cpic/b/9.jpg');
  });
});
