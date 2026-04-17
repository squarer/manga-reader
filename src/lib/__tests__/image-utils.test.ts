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

  it('Given 帶 query string 的完整 CDN URL，when 呼叫，then 保留 query string 並回傳去除 origin 的路徑', () => {
    expect(toCoverRelativePath('https://cf.mhgui.com/cpic/b/123.jpg?w=200&h=300')).toBe(
      '/cpic/b/123.jpg?w=200&h=300'
    );
  });

  it('Given 帶 encoded 字元的 CDN URL，when 呼叫，then 正確剝除 origin 保留 encoded 路徑', () => {
    expect(toCoverRelativePath('https://cf.mhgui.com/cpic/b/%E9%80%B1%E5%88%8A.jpg')).toBe(
      '/cpic/b/%E9%80%B1%E5%88%8A.jpg'
    );
  });

  it('Given 超長路徑的 CDN URL，when 呼叫，then 完整回傳剝除 origin 後的長路徑', () => {
    const longSegment = 'a'.repeat(500);
    expect(toCoverRelativePath(`https://cf.mhgui.com/cpic/${longSegment}.jpg`)).toBe(
      `/cpic/${longSegment}.jpg`
    );
  });

  it('Given protocol-relative cf2 CDN URL，when 呼叫，then 回傳相對路徑', () => {
    expect(toCoverRelativePath('//cf2.mhgui.com/cpic/h/999.jpg')).toBe('/cpic/h/999.jpg');
  });

  it('Given http:// CDN URL（非 https），when 呼叫，then 原樣回傳（不匹配 CDN_ORIGINS）', () => {
    const url = 'http://cf.mhgui.com/cpic/b/123.jpg';
    expect(toCoverRelativePath(url)).toBe(url);
  });

  it('Given 只有空白的字串，when 呼叫，then 原樣回傳（falsy 陷阱：空白非 falsy）', () => {
    expect(toCoverRelativePath('   ')).toBe('   ');
  });
});

describe('getProxiedImageUrl — edge cases', () => {
  it('Given null（以 unknown 強轉），when 呼叫，then 回傳 placeholder', () => {
    expect(getProxiedImageUrl(null as unknown as string)).toBe('/placeholder.jpg');
  });

  it('Given undefined（以 unknown 強轉），when 呼叫，then 回傳 placeholder', () => {
    expect(getProxiedImageUrl(undefined as unknown as string)).toBe('/placeholder.jpg');
  });

  it('Given 帶 query string 的相對路徑，when 呼叫，then query string 被 encode 後出現在 proxy URL', () => {
    expect(getProxiedImageUrl('/cpic/b/123.jpg?w=200&q=80')).toBe(
      '/api/image?url=https%3A%2F%2Fcf.mhgui.com%2Fcpic%2Fb%2F123.jpg%3Fw%3D200%26q%3D80'
    );
  });

  it('Given 帶 encoded 字元的相對路徑，when 呼叫，then encoded 字元被再次 encode 進 proxy URL', () => {
    expect(getProxiedImageUrl('/cpic/b/%E9%80%B1%E5%88%8A.jpg')).toBe(
      '/api/image?url=https%3A%2F%2Fcf.mhgui.com%2Fcpic%2Fb%2F%25E9%2580%25B1%25E5%2588%258A.jpg'
    );
  });

  it('Given 帶中文字元的相對路徑，when 呼叫，then 中文被 encode 進 proxy URL', () => {
    expect(getProxiedImageUrl('/cpic/b/週刊.jpg')).toBe(
      '/api/image?url=https%3A%2F%2Fcf.mhgui.com%2Fcpic%2Fb%2F%E9%80%B1%E5%88%8A.jpg'
    );
  });

  it('Given 超長檔名的相對路徑，when 呼叫，then 整個長路徑被補上 CDN 後 encode 進 proxy URL', () => {
    const longName = 'x'.repeat(500);
    const encoded = encodeURIComponent(`https://cf.mhgui.com/cpic/${longName}.jpg`);
    expect(getProxiedImageUrl(`/cpic/${longName}.jpg`)).toBe(`/api/image?url=${encoded}`);
  });

  it('Given 非 CDN 的完整 http URL，when 呼叫，then 原樣 encode 進 proxy URL', () => {
    expect(getProxiedImageUrl('http://other.com/img.jpg')).toBe(
      '/api/image?url=http%3A%2F%2Fother.com%2Fimg.jpg'
    );
  });

  it('Given protocol-relative URL of cf2，when 呼叫，then 補上 https: 後 encode 進 proxy URL', () => {
    expect(getProxiedImageUrl('//cf2.mhgui.com/cpic/h/abc.jpg')).toBe(
      '/api/image?url=https%3A%2F%2Fcf2.mhgui.com%2Fcpic%2Fh%2Fabc.jpg'
    );
  });

  it('Given 只有空白的字串，when 呼叫，then 補上 CDN origin 後 encode（空白非 falsy）', () => {
    expect(getProxiedImageUrl('   ')).toBe(
      `/api/image?url=${encodeURIComponent('https://cf.mhgui.com   ')}`
    );
  });
});
