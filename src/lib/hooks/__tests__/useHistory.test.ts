// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHistory } from '../useHistory';

const STORAGE_KEY = 'manga-reader-history';

function makeItem(overrides?: Partial<Parameters<ReturnType<typeof useHistory>['addHistory']>[0]>) {
  return {
    mangaId: 1,
    mangaName: 'Test Manga',
    mangaCover: 'https://cf.mhgui.com/covers/1.jpg',
    chapterId: 100,
    chapterName: 'Chapter 1',
    page: 0,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('useHistory', () => {
  describe('initial state', () => {
    it('history is empty when localStorage has no data', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      expect(result.current.history).toEqual([]);
    });
  });

  describe('addHistory', () => {
    it('adds a reading record with a timestamp', async () => {
      const before = Date.now();
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem());
      });

      const after = Date.now();
      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].mangaId).toBe(1);
      expect(result.current.history[0].chapterId).toBe(100);
      expect(result.current.history[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(result.current.history[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('prepends new item to the front of history', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem({ mangaId: 1, chapterId: 100 }));
      });
      act(() => {
        result.current.addHistory(makeItem({ mangaId: 2, chapterId: 200 }));
      });

      expect(result.current.history[0].mangaId).toBe(2);
      expect(result.current.history[1].mangaId).toBe(1);
    });

    it('converts full CDN cover URL to relative path on add', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem({ mangaCover: 'https://cf.mhgui.com/covers/1.jpg' }));
      });

      expect(result.current.history[0].mangaCover).toBe('/covers/1.jpg');
    });
  });

  describe('deduplication', () => {
    it('updating the same mangaId+chapterId replaces the existing entry rather than adding a duplicate', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem({ page: 0 }));
      });
      act(() => {
        result.current.addHistory(makeItem({ page: 5 }));
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].page).toBe(5);
    });

    it('same mangaId but different chapterId are kept as separate entries', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem({ chapterId: 100 }));
      });
      act(() => {
        result.current.addHistory(makeItem({ chapterId: 101 }));
      });

      expect(result.current.history).toHaveLength(2);
    });

    it('deduplicated entry is moved to the front', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem({ mangaId: 1, chapterId: 100 }));
      });
      act(() => {
        result.current.addHistory(makeItem({ mangaId: 2, chapterId: 200 }));
      });
      // Re-add first item — should move it to front
      act(() => {
        result.current.addHistory(makeItem({ mangaId: 1, chapterId: 100 }));
      });

      expect(result.current.history).toHaveLength(2);
      expect(result.current.history[0].mangaId).toBe(1);
      expect(result.current.history[1].mangaId).toBe(2);
    });
  });

  describe('max 50 items limit', () => {
    it('does not exceed 50 entries after adding 60 distinct records', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      for (let i = 1; i <= 60; i++) {
        act(() => {
          result.current.addHistory(makeItem({ mangaId: i, chapterId: i }));
        });
      }

      expect(result.current.history).toHaveLength(50);
    });

    it('keeps the 50 most-recently added entries when the limit is exceeded', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      for (let i = 1; i <= 55; i++) {
        act(() => {
          result.current.addHistory(makeItem({ mangaId: i, chapterId: i }));
        });
      }

      const ids = result.current.history.map((h) => h.mangaId);
      // Entries 1–5 are the oldest and should have been evicted
      for (let i = 1; i <= 5; i++) {
        expect(ids).not.toContain(i);
      }
      // Entry 55 (most recent) should be first
      expect(result.current.history[0].mangaId).toBe(55);
    });
  });

  describe('clearHistory', () => {
    it('removes all history entries', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem({ mangaId: 1, chapterId: 100 }));
      });
      act(() => {
        result.current.addHistory(makeItem({ mangaId: 2, chapterId: 200 }));
      });
      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.history).toEqual([]);
    });
  });

  describe('removeHistory', () => {
    it('removes all entries matching the given mangaId', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem({ mangaId: 1, chapterId: 100 }));
      });
      act(() => {
        result.current.addHistory(makeItem({ mangaId: 1, chapterId: 101 }));
      });
      act(() => {
        result.current.addHistory(makeItem({ mangaId: 2, chapterId: 200 }));
      });
      act(() => {
        result.current.removeHistory(1);
      });

      const remaining = result.current.history;
      expect(remaining.every((h) => h.mangaId !== 1)).toBe(true);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].mangaId).toBe(2);
    });

    it('removing a non-existent mangaId leaves history unchanged', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem({ mangaId: 1 }));
      });
      act(() => {
        result.current.removeHistory(999);
      });

      expect(result.current.history).toHaveLength(1);
    });
  });

  describe('page position preservation', () => {
    it('updateHistoryPage updates the page number for matching mangaId+chapterId', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem({ page: 0 }));
      });
      act(() => {
        result.current.updateHistoryPage(1, 100, 7);
      });

      expect(result.current.history[0].page).toBe(7);
    });

    it('updateHistoryPage refreshes the timestamp', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem({ page: 0 }));
      });
      const originalTimestamp = result.current.history[0].timestamp;

      // Ensure at least 1ms gap
      await new Promise((resolve) => setTimeout(resolve, 5));

      act(() => {
        result.current.updateHistoryPage(1, 100, 3);
      });

      expect(result.current.history[0].timestamp).toBeGreaterThan(originalTimestamp);
    });

    it('updateHistoryPage does not affect other entries', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem({ mangaId: 1, chapterId: 100, page: 0 }));
      });
      act(() => {
        result.current.addHistory(makeItem({ mangaId: 2, chapterId: 200, page: 0 }));
      });
      act(() => {
        result.current.updateHistoryPage(1, 100, 9);
      });

      const entry2 = result.current.history.find((h) => h.mangaId === 2);
      expect(entry2?.page).toBe(0);
    });

    it('updateHistoryPage on non-existent entry leaves history unchanged', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem({ page: 2 }));
      });
      act(() => {
        result.current.updateHistoryPage(999, 999, 10);
      });

      expect(result.current.history[0].page).toBe(2);
    });
  });

  describe('localStorage persistence', () => {
    it('persists history to localStorage after addHistory', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem());
      });

      await waitFor(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].mangaId).toBe(1);
      });
    });

    it('restores history from localStorage on re-mount', async () => {
      const { result: r1 } = renderHook(() => useHistory());
      await waitFor(() => expect(r1.current.isLoaded).toBe(true));

      act(() => {
        r1.current.addHistory(makeItem({ page: 3 }));
      });

      await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
      });

      const { result: r2 } = renderHook(() => useHistory());
      await waitFor(() => expect(r2.current.isLoaded).toBe(true));

      expect(r2.current.history).toHaveLength(1);
      expect(r2.current.history[0].mangaId).toBe(1);
      expect(r2.current.history[0].page).toBe(3);
    });

    it('cover URL stored as relative path and restored as relative path via transform', async () => {
      // Pre-populate localStorage with a full CDN URL (simulating legacy data)
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          {
            mangaId: 5,
            mangaName: 'Old Manga',
            mangaCover: 'https://cf.mhgui.com/covers/old.jpg',
            chapterId: 50,
            chapterName: 'Ch 50',
            page: 1,
            timestamp: 1000,
          },
        ])
      );

      const { result } = renderHook(() => useHistory());
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      // transform should strip the CDN origin
      expect(result.current.history[0].mangaCover).toBe('/covers/old.jpg');
    });

    it('clearHistory removes the entry from localStorage', async () => {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.addHistory(makeItem());
      });
      act(() => {
        result.current.clearHistory();
      });

      await waitFor(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        expect(JSON.parse(stored!)).toEqual([]);
      });
    });
  });
});
