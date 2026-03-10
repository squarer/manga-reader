import { describe, it, expect } from 'vitest';
import { parseStoredValue } from './useLocalStorage';

describe('parseStoredValue', () => {
  it('Given valid JSON array, when parsed, then returns the array', () => {
    const stored = JSON.stringify([{ id: 1, name: 'test' }]);
    expect(parseStoredValue(stored)).toEqual([{ id: 1, name: 'test' }]);
  });

  it('Given valid JSON object, when parsed, then returns the object', () => {
    const stored = JSON.stringify({ key: 'value', num: 42 });
    expect(parseStoredValue(stored)).toEqual({ key: 'value', num: 42 });
  });

  it('Given valid JSON with transform, when parsed, then transform is applied to result', () => {
    const stored = JSON.stringify([1, 2, 3]);
    const result = parseStoredValue<number[]>(stored, (items) => items.map((x) => x * 2));
    expect(result).toEqual([2, 4, 6]);
  });

  it('Given valid JSON with transform that mutates each item, when parsed, then all items are transformed', () => {
    const stored = JSON.stringify([
      { cover: 'https://cf.mhgui.com/cpic/b/123.jpg' },
      { cover: '/cpic/b/456.jpg' },
    ]);
    const result = parseStoredValue<{ cover: string }[]>(stored, (items) =>
      items.map((item) => ({ ...item, cover: item.cover.replace(/^https?:\/\/[^/]+/, '') }))
    );
    expect(result[0].cover).toBe('/cpic/b/123.jpg');
    expect(result[1].cover).toBe('/cpic/b/456.jpg');
  });

  it('Given empty JSON array, when parsed, then returns empty array', () => {
    expect(parseStoredValue('[]')).toEqual([]);
  });

  it('Given JSON null, when parsed, then returns null', () => {
    expect(parseStoredValue('null')).toBeNull();
  });

  it('Given invalid JSON, when parsed, then throws SyntaxError (Fail-Fast)', () => {
    expect(() => parseStoredValue('not json')).toThrow(SyntaxError);
  });

  it('Given truncated JSON, when parsed, then throws SyntaxError', () => {
    expect(() => parseStoredValue('{"key": ')).toThrow(SyntaxError);
  });

  it('Given empty string, when parsed, then throws SyntaxError', () => {
    expect(() => parseStoredValue('')).toThrow(SyntaxError);
  });

  it('Given valid JSON but no transform, when parsed, then transform is not applied', () => {
    const stored = JSON.stringify([10, 20]);
    const result = parseStoredValue<number[]>(stored, undefined);
    expect(result).toEqual([10, 20]);
  });
});
