// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../useIsMobile';

type ChangeListener = (e: { matches: boolean; media: string }) => void;

function createMatchMediaMock(initialMatches: boolean) {
  const listeners: ChangeListener[] = [];

  const mql = {
    matches: initialMatches,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
    addEventListener: vi.fn((_: string, listener: ChangeListener) => {
      listeners.push(listener);
    }),
    removeEventListener: vi.fn((_: string, listener: ChangeListener) => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    }),
  };

  const triggerChange = (matches: boolean) => {
    mql.matches = matches;
    listeners.forEach((fn) => fn({ matches, media: mql.media }));
  };

  return { mql, triggerChange };
}

let mockMatchMedia: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockMatchMedia = vi.fn();
  vi.stubGlobal('matchMedia', mockMatchMedia);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useIsMobile', () => {
  describe('初始狀態', () => {
    it('桌機寬度（≥ 640px）→ 回傳 false', () => {
      const { mql } = createMatchMediaMock(false);
      mockMatchMedia.mockReturnValue(mql);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it('手機寬度（< 640px）→ 回傳 true', () => {
      const { mql } = createMatchMediaMock(true);
      mockMatchMedia.mockReturnValue(mql);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('使用正確的媒體查詢字串（max-width: 639px）', () => {
      const { mql } = createMatchMediaMock(false);
      mockMatchMedia.mockReturnValue(mql);

      renderHook(() => useIsMobile());

      expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 639px)');
    });
  });

  describe('視窗尺寸變更', () => {
    it('從桌機縮小到手機寬度 → 狀態切換為 true', () => {
      const { mql, triggerChange } = createMatchMediaMock(false);
      mockMatchMedia.mockReturnValue(mql);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      act(() => triggerChange(true));

      expect(result.current).toBe(true);
    });

    it('從手機放大到桌機寬度 → 狀態切換為 false', () => {
      const { mql, triggerChange } = createMatchMediaMock(true);
      mockMatchMedia.mockReturnValue(mql);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);

      act(() => triggerChange(false));

      expect(result.current).toBe(false);
    });

    it('快速連續多次切換 → 反映最終狀態', () => {
      const { mql, triggerChange } = createMatchMediaMock(false);
      mockMatchMedia.mockReturnValue(mql);

      const { result } = renderHook(() => useIsMobile());

      act(() => {
        triggerChange(true);
        triggerChange(false);
        triggerChange(true);
      });

      expect(result.current).toBe(true);
    });
  });

  describe('事件監聽器生命週期', () => {
    it('掛載時呼叫 addEventListener', () => {
      const { mql } = createMatchMediaMock(false);
      mockMatchMedia.mockReturnValue(mql);

      renderHook(() => useIsMobile());

      expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('卸載時呼叫 removeEventListener（不洩漏監聽器）', () => {
      const { mql } = createMatchMediaMock(false);
      mockMatchMedia.mockReturnValue(mql);

      const { unmount } = renderHook(() => useIsMobile());
      unmount();

      expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('卸載後觸發 change 事件不拋錯', () => {
      const { mql, triggerChange } = createMatchMediaMock(false);
      mockMatchMedia.mockReturnValue(mql);

      const { result, unmount } = renderHook(() => useIsMobile());
      unmount();

      expect(() => {
        act(() => triggerChange(true));
      }).not.toThrow();

      expect(result.current).toBe(false);
    });
  });

  describe('SSR 安全性', () => {
    it('初始值為 false', () => {
      const { mql } = createMatchMediaMock(false);
      mockMatchMedia.mockReturnValue(mql);

      const { result } = renderHook(() => useIsMobile());

      expect(typeof result.current).toBe('boolean');
      expect(result.current).toBe(false);
    });
  });
});
