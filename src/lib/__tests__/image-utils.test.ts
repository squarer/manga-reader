import { describe, it, expect } from 'vitest';
import { getProxiedImageUrl, toCoverRelativePath } from '../image-utils';

describe('getProxiedImageUrl', () => {
  it('Given 空字串，when 呼叫，then 回傳 placeholder', () => {
    expect(getProxiedImageUrl('')).toBe('/placeholder.jpg');
  });

  it('Given 相對路徑，when 呼叫，then 補上主要 CDN origin 後送進 proxy', () => {
    expect(getProxiedImageUrl('/cpic/b/123.jpg')).toBe(
      '/api/image?url=https%3A%2F%2Fcf.mhgui.com%2Fcpic%2Fb%2F123.jpg'
    );
  });

  it('Given 完整 CDN URL（舊格式向後相容），when 呼叫，then 不被二次加工直接送進 proxy', () => {
    expect(getProxiedImageUrl('https://cf.mhgui.com/cpic/b/123.jpg')).toBe(
      '/api/image?url=https%3A%2F%2Fcf.mhgui.com%2Fcpic%2Fb%2F123.jpg'
    );
  });

  it('Given protocol-relative URL，when 呼叫，then 補上 https: 後送進 proxy', () => {
    expect(getProxiedImageUrl('//cf.mhgui.com/cpic/b/456.jpg')).toBe(
      '/api/image?url=https%3A%2F%2Fcf.mhgui.com%2Fcpic%2Fb%2F456.jpg'
    );
  });

  it('Given cf2 CDN URL，when 呼叫，then 原樣送進 proxy', () => {
    expect(getProxiedImageUrl('https://cf2.mhgui.com/cpic/h/789.jpg')).toBe(
      '/api/image?url=https%3A%2F%2Fcf2.mhgui.com%2Fcpic%2Fh%2F789.jpg'
    );
  });
});

describe('toCoverRelativePath', () => {
  it('Given 空字串，when 呼叫，then 回傳空字串', () => {
    expect(toCoverRelativePath('')).toBe('');
  });

  it('Given 完整 CDN URL，when 呼叫，then 回傳相對路徑', () => {
    expect(toCoverRelativePath('https://cf.mhgui.com/cpic/b/123.jpg')).toBe('/cpic/b/123.jpg');
  });

  it('Given cf2 CDN URL，when 呼叫，then 回傳相對路徑', () => {
    expect(toCoverRelativePath('https://cf2.mhgui.com/cpic/h/456.jpg')).toBe('/cpic/h/456.jpg');
  });

  it('Given protocol-relative URL，when 呼叫，then 回傳相對路徑', () => {
    expect(toCoverRelativePath('//cf.mhgui.com/cpic/b/789.jpg')).toBe('/cpic/b/789.jpg');
  });

  it('Given 已是相對路徑，when 呼叫，then 原樣回傳', () => {
    expect(toCoverRelativePath('/cpic/b/123.jpg')).toBe('/cpic/b/123.jpg');
  });

  it('Given 非 CDN 域名的完整 URL，when 呼叫，then 原樣回傳', () => {
    const url = 'https://other-domain.com/image.jpg';
    expect(toCoverRelativePath(url)).toBe(url);
  });
});
