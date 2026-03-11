import { describe, it, expect } from 'vitest';
import { computePrevNextCid } from '../chapter-utils';

describe('computePrevNextCid', () => {
  // 邊界案例
  it('空列表回傳 { prevCid: null, nextCid: null }', () => {
    expect(computePrevNextCid([], 100)).toEqual({ prevCid: null, nextCid: null });
  });

  it('單元素且 currentCid 匹配：prevCid=null, nextCid=null', () => {
    expect(computePrevNextCid([{ id: 100 }], 100)).toEqual({ prevCid: null, nextCid: null });
  });

  it('currentCid 不存在於列表回傳 { prevCid: null, nextCid: null }', () => {
    expect(computePrevNextCid([{ id: 100 }, { id: 200 }], 999)).toEqual({
      prevCid: null,
      nextCid: null,
    });
  });

  // 順序邏輯：index 0 = 最新章節
  it('最新章節（index=0）：nextCid=null，prevCid 為較舊章節', () => {
    // [300(新), 200, 100(舊)]
    const chapters = [{ id: 300 }, { id: 200 }, { id: 100 }];
    expect(computePrevNextCid(chapters, 300)).toEqual({ prevCid: 200, nextCid: null });
  });

  it('最舊章節（index=last）：prevCid=null，nextCid 為較新章節', () => {
    const chapters = [{ id: 300 }, { id: 200 }, { id: 100 }];
    expect(computePrevNextCid(chapters, 100)).toEqual({ prevCid: null, nextCid: 200 });
  });

  it('中間章節：prevCid 和 nextCid 均非 null', () => {
    const chapters = [{ id: 300 }, { id: 200 }, { id: 100 }];
    expect(computePrevNextCid(chapters, 200)).toEqual({ prevCid: 100, nextCid: 300 });
  });

  // 兩元素
  it('兩元素列表，較新章節正確計算', () => {
    const chapters = [{ id: 200 }, { id: 100 }];
    expect(computePrevNextCid(chapters, 200)).toEqual({ prevCid: 100, nextCid: null });
  });

  it('兩元素列表，較舊章節正確計算', () => {
    const chapters = [{ id: 200 }, { id: 100 }];
    expect(computePrevNextCid(chapters, 100)).toEqual({ prevCid: null, nextCid: 200 });
  });

  // 特殊 ID 值
  it('id 為 0 的章節正確匹配', () => {
    const chapters = [{ id: 1 }, { id: 0 }];
    expect(computePrevNextCid(chapters, 0)).toEqual({ prevCid: null, nextCid: 1 });
  });
});
