import { describe, it, expect } from 'vitest';
import { addSearchEntry, SEARCH_HISTORY_MAX } from './useSearchHistory';

describe('addSearchEntry', () => {
  it('新關鍵字置頂', () => {
    expect(addSearchEntry(['a', 'b'], 'c')).toEqual(['c', 'a', 'b']);
  });

  it('重新搜尋既有詞 → 移到最前、不重複', () => {
    expect(addSearchEntry(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b']);
  });

  it('trim 後為空字串 → 不記錄（原樣返回）', () => {
    const history = ['a'];
    expect(addSearchEntry(history, '   ')).toBe(history);
  });

  it('關鍵字前後空白會被 trim 再儲存', () => {
    expect(addSearchEntry([], '  海賊王  ')).toEqual(['海賊王']);
  });

  it(`上限 ${SEARCH_HISTORY_MAX} 筆，超出截斷最舊`, () => {
    const full = Array.from({ length: SEARCH_HISTORY_MAX }, (_, i) => `k${i}`);
    const result = addSearchEntry(full, 'new');
    expect(result).toHaveLength(SEARCH_HISTORY_MAX);
    expect(result[0]).toBe('new');
    expect(result).not.toContain(`k${SEARCH_HISTORY_MAX - 1}`);
  });
});
