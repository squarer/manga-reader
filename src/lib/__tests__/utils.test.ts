import { describe, it, expect } from 'vitest';
import { parsePage } from '../utils';

describe('parsePage', () => {
  it.each([
    [null, undefined, 1],
    ['', undefined, 1],
    ['0', undefined, 1],
    ['-5', undefined, 1],
    ['abc', undefined, 1],
    ['3', undefined, 3],
    ['100', undefined, 100],
    ['501', undefined, 500],
    ['3', 2, 2],
    ['1.5', undefined, 1],
  ])(
    'parsePage(%j, %j) → %i',
    (raw, maxPage, expected) => {
      const result = maxPage === undefined ? parsePage(raw) : parsePage(raw, maxPage);
      expect(result).toBe(expected);
    }
  );
});
