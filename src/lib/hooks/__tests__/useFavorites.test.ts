// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFavorites, type FavoriteItem } from '../useFavorites';

const STORAGE_KEY = 'manga-reader-favorites';

const mockItem = (overrides?: Partial<Omit<FavoriteItem, 'addedAt'>>): Omit<FavoriteItem, 'addedAt'> => ({
  mangaId: 1,
  mangaName: 'Test Manga',
  mangaCover: 'https://cf.mhgui.com/images/cover.jpg',
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
});

describe('useFavorites', () => {
  it('initial state: empty favorites', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
  });

  it('addFavorite: adds item to favorites', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockItem());
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].mangaId).toBe(1);
    expect(result.current.favorites[0].mangaName).toBe('Test Manga');
  });

  it('addFavorite: persists to localStorage', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockItem());
    });

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!) as FavoriteItem[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0].mangaId).toBe(1);
  });

  it('addFavorite: strips CDN origin and stores relative path in localStorage', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockItem({ mangaCover: 'https://cf.mhgui.com/images/cover.jpg' }));
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as FavoriteItem[];
    expect(stored[0].mangaCover).toBe('/images/cover.jpg');
  });

  it('removeFavorite: removes item by mangaId', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockItem({ mangaId: 1 }));
      result.current.addFavorite(mockItem({ mangaId: 2, mangaName: 'Another Manga' }));
    });

    act(() => {
      result.current.removeFavorite(1);
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].mangaId).toBe(2);
  });

  it('removeFavorite: removing non-existent id leaves list unchanged', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockItem());
    });

    act(() => {
      result.current.removeFavorite(999);
    });

    expect(result.current.favorites).toHaveLength(1);
  });

  it('isFavorite: returns true when mangaId is in favorites', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockItem({ mangaId: 42 }));
    });

    expect(result.current.isFavorite(42)).toBe(true);
  });

  it('isFavorite: returns false when mangaId is not in favorites', () => {
    const { result } = renderHook(() => useFavorites());

    expect(result.current.isFavorite(42)).toBe(false);
  });

  it('isFavorite: returns false after removal', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockItem({ mangaId: 42 }));
    });

    act(() => {
      result.current.removeFavorite(42);
    });

    expect(result.current.isFavorite(42)).toBe(false);
  });

  it('toggleFavorite: adds item when not present', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite(mockItem({ mangaId: 5 }));
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.isFavorite(5)).toBe(true);
  });

  it('toggleFavorite: removes item when already present', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockItem({ mangaId: 5 }));
    });

    act(() => {
      result.current.toggleFavorite(mockItem({ mangaId: 5 }));
    });

    expect(result.current.favorites).toHaveLength(0);
    expect(result.current.isFavorite(5)).toBe(false);
  });

  it('duplicate prevention: adding same mangaId twice keeps only one entry', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockItem({ mangaId: 1 }));
      result.current.addFavorite(mockItem({ mangaId: 1, mangaName: 'Duplicate' }));
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].mangaName).toBe('Test Manga');
  });

  it('localStorage persistence: data survives re-render', () => {
    const { result: first } = renderHook(() => useFavorites());

    act(() => {
      first.current.addFavorite(mockItem({ mangaId: 7, mangaName: 'Persisted Manga' }));
    });

    const { result: second } = renderHook(() => useFavorites());

    act(() => {
      // trigger useEffect to load from localStorage
    });

    expect(second.current.favorites).toHaveLength(1);
    expect(second.current.favorites[0].mangaId).toBe(7);
    expect(second.current.favorites[0].mangaName).toBe('Persisted Manga');
  });
});
