import { describe, it, expect } from 'vitest';
import {
  STATUS_MAP,
  SORT_MAP,
  parseFiltersFromParams,
  filtersToParams,
} from '../filter-utils';
import {
  DEFAULT_FILTER_STATE,
  YEAR_OPTIONS,
  getActiveFilterCount,
  hasActiveFilters,
  type FilterState,
} from '../filter-types';
import { GenreType } from '../scraper/types';

// ---------------------------------------------------------------------------
// STATUS_MAP
// ---------------------------------------------------------------------------

describe('STATUS_MAP', () => {
  it.each([
    ['ongoing', 'lianzai'],
    ['completed', 'wanjie'],
  ])('maps UI value "%s" → API value "%s"', (ui, api) => {
    expect(STATUS_MAP[ui]).toBe(api);
  });

  it('does not contain unknown keys', () => {
    expect(STATUS_MAP['all']).toBeUndefined();
    expect(STATUS_MAP['unknown']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// SORT_MAP
// ---------------------------------------------------------------------------

describe('SORT_MAP', () => {
  it.each([
    ['latest', 'update'],
    ['update', 'update'],
    ['popular', 'view'],
    ['rating', 'rate'],
  ])('maps UI value "%s" → API value "%s"', (ui, api) => {
    expect(SORT_MAP[ui]).toBe(api);
  });

  it('does not contain unknown keys', () => {
    expect(SORT_MAP['unknown']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// parseFiltersFromParams
// ---------------------------------------------------------------------------

describe('parseFiltersFromParams', () => {
  function makeParams(entries: Record<string, string>): URLSearchParams {
    return new URLSearchParams(entries);
  }

  describe('defaults when params are absent', () => {
    it('returns default FilterState for empty URLSearchParams', () => {
      const result = parseFiltersFromParams(new URLSearchParams());
      expect(result).toEqual(DEFAULT_FILTER_STATE);
    });

    it('defaults region to null', () => {
      expect(parseFiltersFromParams(new URLSearchParams()).region).toBeNull();
    });

    it('defaults genre to null', () => {
      expect(parseFiltersFromParams(new URLSearchParams()).genre).toBeNull();
    });

    it('defaults year to null', () => {
      expect(parseFiltersFromParams(new URLSearchParams()).year).toBeNull();
    });

    it('defaults status to "all"', () => {
      expect(parseFiltersFromParams(new URLSearchParams()).status).toBe('all');
    });

    it('defaults sort to "update"', () => {
      expect(parseFiltersFromParams(new URLSearchParams()).sort).toBe('update');
    });
  });

  describe('valid param values', () => {
    it.each([
      ['japan'],
      ['hongkong'],
      ['korea'],
      ['other'],
    ] as const)('parses region "%s"', (region) => {
      const result = parseFiltersFromParams(makeParams({ region }));
      expect(result.region).toBe(region);
    });

    it('parses a valid genre', () => {
      const result = parseFiltersFromParams(makeParams({ genre: GenreType.Rexue }));
      expect(result.genre).toBe(GenreType.Rexue);
    });

    it('parses a valid year from YEAR_OPTIONS', () => {
      const validYear = YEAR_OPTIONS[0];
      const result = parseFiltersFromParams(makeParams({ year: validYear }));
      expect(result.year).toBe(validYear);
    });

    it('parses the special "更早" year option', () => {
      const result = parseFiltersFromParams(makeParams({ year: '更早' }));
      expect(result.year).toBe('更早');
    });

    it.each([
      ['ongoing'],
      ['completed'],
      ['all'],
    ] as const)('parses status "%s"', (status) => {
      const result = parseFiltersFromParams(makeParams({ status }));
      expect(result.status).toBe(status);
    });

    it.each([
      ['latest'],
      ['update'],
      ['popular'],
      ['rating'],
    ] as const)('parses sort "%s"', (sort) => {
      const result = parseFiltersFromParams(makeParams({ sort }));
      expect(result.sort).toBe(sort);
    });
  });

  describe('invalid / unknown values → fallback', () => {
    it('returns null genre for an unknown genre string', () => {
      const result = parseFiltersFromParams(makeParams({ genre: 'notarealgenre' }));
      expect(result.genre).toBeNull();
    });

    it('returns null genre for an empty genre string', () => {
      const result = parseFiltersFromParams(makeParams({ genre: '' }));
      expect(result.genre).toBeNull();
    });

    it('returns null year for an invalid year string', () => {
      const result = parseFiltersFromParams(makeParams({ year: '1800' }));
      expect(result.year).toBeNull();
    });

    it('returns null year for an empty year string', () => {
      const result = parseFiltersFromParams(makeParams({ year: '' }));
      expect(result.year).toBeNull();
    });

    it('falls back status to the raw string (cast) when unknown — does not throw', () => {
      // The implementation casts without validation; just verify no exception
      expect(() => parseFiltersFromParams(makeParams({ status: 'badstatus' }))).not.toThrow();
    });

    it('falls back sort to the raw string (cast) when unknown — does not throw', () => {
      expect(() => parseFiltersFromParams(makeParams({ sort: 'badsort' }))).not.toThrow();
    });
  });

  describe('genre with comma-separated value', () => {
    it('takes only the first value when multiple genres are joined with comma', () => {
      const result = parseFiltersFromParams(
        makeParams({ genre: `${GenreType.Rexue},${GenreType.Baihe}` })
      );
      expect(result.genre).toBe(GenreType.Rexue);
    });

    it('returns null when first segment of comma list is invalid', () => {
      const result = parseFiltersFromParams(
        makeParams({ genre: `invalid,${GenreType.Baihe}` })
      );
      expect(result.genre).toBeNull();
    });
  });

  describe('all params together', () => {
    it('parses a fully-specified set of params correctly', () => {
      const result = parseFiltersFromParams(
        makeParams({
          region: 'japan',
          genre: GenreType.Tuili,
          year: YEAR_OPTIONS[1],
          status: 'completed',
          sort: 'popular',
        })
      );
      expect(result).toEqual<FilterState>({
        region: 'japan',
        genre: GenreType.Tuili,
        year: YEAR_OPTIONS[1],
        status: 'completed',
        sort: 'popular',
      });
    });
  });
});

// ---------------------------------------------------------------------------
// filtersToParams
// ---------------------------------------------------------------------------

describe('filtersToParams', () => {
  it('produces empty URLSearchParams for DEFAULT_FILTER_STATE', () => {
    const params = filtersToParams(DEFAULT_FILTER_STATE);
    expect(params.toString()).toBe('');
  });

  it('omits region when null', () => {
    const params = filtersToParams({ ...DEFAULT_FILTER_STATE, region: null });
    expect(params.has('region')).toBe(false);
  });

  it('includes region when set', () => {
    const params = filtersToParams({ ...DEFAULT_FILTER_STATE, region: 'korea' });
    expect(params.get('region')).toBe('korea');
  });

  it('omits genre when null', () => {
    const params = filtersToParams({ ...DEFAULT_FILTER_STATE, genre: null });
    expect(params.has('genre')).toBe(false);
  });

  it('includes genre when set', () => {
    const params = filtersToParams({ ...DEFAULT_FILTER_STATE, genre: GenreType.Baihe });
    expect(params.get('genre')).toBe(GenreType.Baihe);
  });

  it('omits year when null', () => {
    const params = filtersToParams({ ...DEFAULT_FILTER_STATE, year: null });
    expect(params.has('year')).toBe(false);
  });

  it('includes year when set', () => {
    const params = filtersToParams({ ...DEFAULT_FILTER_STATE, year: '更早' });
    expect(params.get('year')).toBe('更早');
  });

  it('omits status when it equals "all"', () => {
    const params = filtersToParams({ ...DEFAULT_FILTER_STATE, status: 'all' });
    expect(params.has('status')).toBe(false);
  });

  it.each([
    ['ongoing'],
    ['completed'],
  ] as const)('includes status "%s" when not "all"', (status) => {
    const params = filtersToParams({ ...DEFAULT_FILTER_STATE, status });
    expect(params.get('status')).toBe(status);
  });

  it('omits sort when it equals "update"', () => {
    const params = filtersToParams({ ...DEFAULT_FILTER_STATE, sort: 'update' });
    expect(params.has('sort')).toBe(false);
  });

  it.each([
    ['latest'],
    ['popular'],
    ['rating'],
  ] as const)('includes sort "%s" when not "update"', (sort) => {
    const params = filtersToParams({ ...DEFAULT_FILTER_STATE, sort });
    expect(params.get('sort')).toBe(sort);
  });

  it('roundtrips: filtersToParams → parseFiltersFromParams returns equivalent state', () => {
    const original: FilterState = {
      region: 'hongkong',
      genre: GenreType.Kongbu,
      year: YEAR_OPTIONS[2],
      status: 'ongoing',
      sort: 'rating',
    };
    const params = filtersToParams(original);
    const restored = parseFiltersFromParams(params);
    expect(restored).toEqual(original);
  });

  it('roundtrip preserves default state (empty params)', () => {
    const params = filtersToParams(DEFAULT_FILTER_STATE);
    const restored = parseFiltersFromParams(params);
    expect(restored).toEqual(DEFAULT_FILTER_STATE);
  });
});

// ---------------------------------------------------------------------------
// getActiveFilterCount (from filter-types)
// ---------------------------------------------------------------------------

describe('getActiveFilterCount', () => {
  it('returns 0 for default state', () => {
    expect(getActiveFilterCount(DEFAULT_FILTER_STATE)).toBe(0);
  });

  it.each([
    [{ region: 'japan' as const }, 1],
    [{ genre: GenreType.Wuxia }, 1],
    [{ year: '更早' }, 1],
    [{ status: 'completed' as const }, 1],
    [{ sort: 'popular' as const }, 1],
  ])('counts 1 when one non-default field is set (%o)', (override, expected) => {
    const filters = { ...DEFAULT_FILTER_STATE, ...override };
    expect(getActiveFilterCount(filters)).toBe(expected);
  });

  it('counts all 5 when every field is non-default', () => {
    const filters: FilterState = {
      region: 'japan',
      genre: GenreType.Rexue,
      year: YEAR_OPTIONS[0],
      status: 'ongoing',
      sort: 'popular',
    };
    expect(getActiveFilterCount(filters)).toBe(5);
  });

  it('does not count status "all" as active', () => {
    expect(getActiveFilterCount({ ...DEFAULT_FILTER_STATE, status: 'all' })).toBe(0);
  });

  it('does not count sort "update" as active', () => {
    expect(getActiveFilterCount({ ...DEFAULT_FILTER_STATE, sort: 'update' })).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// hasActiveFilters (from filter-types)
// ---------------------------------------------------------------------------

describe('hasActiveFilters', () => {
  it('returns false for default state', () => {
    expect(hasActiveFilters(DEFAULT_FILTER_STATE)).toBe(false);
  });

  it('returns true when at least one field is non-default', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTER_STATE, region: 'other' })).toBe(true);
  });

  it('returns true when all fields are non-default', () => {
    const filters: FilterState = {
      region: 'korea',
      genre: GenreType.Danmei,
      year: '更早',
      status: 'completed',
      sort: 'rating',
    };
    expect(hasActiveFilters(filters)).toBe(true);
  });
});
