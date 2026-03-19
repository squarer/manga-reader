// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFavoritesUpdateCheck } from '../useFavoritesUpdateCheck';
import type { FavoriteItem } from '../useFavorites';
import type { HistoryItem } from '../useHistory';

const favorites: FavoriteItem[] = [
  { mangaId: 1, mangaName: 'Test', mangaCover: '/cover.jpg', addedAt: Date.now() },
];

const history: HistoryItem[] = [
  {
    mangaId: 1,
    mangaName: 'Test',
    mangaCover: '/cover.jpg',
    chapterId: 100,
    chapterName: 'Ch 100',
    page: 1,
    timestamp: Date.now(),
  },
];

describe('useFavoritesUpdateCheck', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', undefined);
  });

  it('API 失敗時 console.error 被呼叫', async () => {
    const fetchError = new Error('Network error');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(fetchError));

    renderHook(() => useFavoritesUpdateCheck(favorites, history, true));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    const calls = consoleErrorSpy.mock.calls;
    const hasExpectedCall = calls.some((args: unknown[]) =>
      args.some((arg: unknown) => typeof arg === 'string' && arg.includes('useFavoritesUpdateCheck'))
    );
    expect(hasExpectedCall).toBe(true);
  });

  it('AbortError 不觸發 console.error', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    const { unmount } = renderHook(() => useFavoritesUpdateCheck(favorites, history, true));

    // Unmount to trigger abort before fetch resolves, but we still need to give
    // the async path a chance to run with the AbortError
    unmount();

    // Give microtasks a tick to settle
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('空收藏不觸發任何請求', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    renderHook(() => useFavoritesUpdateCheck([], history, true));

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
