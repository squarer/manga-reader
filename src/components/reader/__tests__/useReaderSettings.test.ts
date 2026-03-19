// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReaderSettings } from '../useReaderHooks';
import { ViewMode, DEFAULT_SETTINGS } from '../types';

const STORAGE_KEY = 'reader-settings';

beforeEach(() => {
  localStorage.removeItem(STORAGE_KEY);
  // 重置 module-level cachedSettings 至預設值
  const { result } = renderHook(() => useReaderSettings());
  act(() => {
    result.current.updateSettings({ ...DEFAULT_SETTINGS });
  });
});

describe('useReaderSettings', () => {
  it('回傳預設設定', () => {
    const { result } = renderHook(() => useReaderSettings());

    expect(result.current.settings.viewMode).toBe(ViewMode.Scroll);
    expect(result.current.settings.imageWidth).toBe(100);
  });

  it('物件更新正常寫入', () => {
    const { result } = renderHook(() => useReaderSettings());

    act(() => {
      result.current.updateSettings({ imageWidth: 80 });
    });

    expect(result.current.settings.imageWidth).toBe(80);
  });

  it('functional updater 基於前一狀態計算', () => {
    const { result } = renderHook(() => useReaderSettings());

    act(() => {
      result.current.updateSettings({ imageWidth: 80 });
    });

    act(() => {
      result.current.updateSettings((prev) => ({ imageWidth: prev.imageWidth + 10 }));
    });

    expect(result.current.settings.imageWidth).toBe(90);
  });

  it('連續快速更新不丟失', () => {
    const { result } = renderHook(() => useReaderSettings());

    act(() => {
      result.current.updateSettings({ imageWidth: 75 });
      result.current.updateSettings({ viewMode: ViewMode.Single });
    });

    expect(result.current.settings.imageWidth).toBe(75);
    expect(result.current.settings.viewMode).toBe(ViewMode.Single);
  });
});
