import { describe, it, expect } from 'vitest';
import { unpack } from '../unpack';
import { extractPackedScript, parseImageData, buildImageUrl } from '../providers/manhuagui/decrypt';

// 最小可手工驗算的 packed 格式
// payload: "0 1"（兩個標識符待替換）
// radix: 36, count: 2, keywords: "hello|world"
// encodeBase(0, 36) = "0" → "hello"
// encodeBase(1, 36) = "1" → "world"
const SIMPLE_PACKED = `}('0 1',36,2,'hello|world'.split('|'))`;

describe('unpack', () => {
  it('解包標準格式，正確替換關鍵字', () => {
    const result = unpack(SIMPLE_PACKED);
    expect(result).toBe('hello world');
  });

  it('超過 MAX_PAYLOAD_LENGTH 時拋出 Error', () => {
    const huge = `}('${'a'.repeat(500001)}',36,1,'b'.split('|'))`;
    expect(() => unpack(huge)).toThrow('Packed string too large');
  });

  it('格式不符時拋出 Invalid packed format', () => {
    expect(() => unpack('not packed at all')).toThrow('Invalid packed format');
  });

  it('空關鍵字時使用原始編碼符號', () => {
    // count=3 但只有 2 個關鍵字，第 3 個 fallback 到 key 本身
    const packed = `}('0 1 2',36,3,'hello|world'.split('|'))`;
    const result = unpack(packed);
    expect(result).toContain('hello');
    expect(result).toContain('world');
    expect(result).toContain('2'); // fallback to key
  });
});

describe('extractPackedScript', () => {
  it('從包含 eval(function...) 的 HTML 中提取 packed script', () => {
    // 函數體不含巢狀 {}，符合 [^}]+ 正則限制
    const html = `<script>eval(function(p,a,c,k,e,d){while(c--)if(k[c])p=p.replace(k[c],k[c]);return p}('0',36,1,'hello'.split('|')))</script>`;
    const result = extractPackedScript(html);
    expect(result).not.toBeNull();
  });

  it('從寬鬆匹配格式提取（looseMatch）', () => {
    // 字串長度 > 100 的 payload 觸發寬鬆匹配
    const longPayload = 'a'.repeat(101);
    const html = `<script>}('${longPayload}',36,2,'hello|world')</script>`;
    const result = extractPackedScript(html);
    expect(result).not.toBeNull();
    expect(result).toContain(longPayload);
  });

  it('HTML 不含 packed script 時回傳 null', () => {
    expect(extractPackedScript('<html><body>plain content</body></html>')).toBeNull();
  });

  it('空字串 HTML 回傳 null', () => {
    expect(extractPackedScript('')).toBeNull();
  });
});

describe('parseImageData', () => {
  it('解析 SMH.imgData({...}) 格式，回傳正確的 ImageData', () => {
    const decrypted = `SMH.imgData({"bid":12345,"cid":678,"bname":"測試漫畫","cname":"第1話","path":"/comic/path/","files":["001.jpg","002.jpg"],"sl":{"e":1,"m":"abc"},"prevcid":677,"nextcid":679})`;
    const result = parseImageData(decrypted);
    expect(result).not.toBeNull();
    expect(result!.bid).toBe(12345);
    expect(result!.cid).toBe(678);
    expect(result!.files).toContain('001.jpg');
    expect(result!.prevcid).toBe(677);
    expect(result!.nextcid).toBe(679);
  });

  it('解析 SMH.reader({...}) 格式，正確轉換 images 為 path + files', () => {
    const decrypted = `SMH.reader({"bookId":12345,"chapterId":678,"bookName":"測試漫畫","chapterTitle":"第1話","images":["/comic/path/001.jpg","/comic/path/002.jpg"]})`;
    const result = parseImageData(decrypted);
    expect(result).not.toBeNull();
    expect(result!.bid).toBe(12345);
    expect(result!.path).toBe('/comic/path/');
    expect(result!.files).toEqual(['001.jpg', '002.jpg']);
  });

  it('無法解析時回傳 null', () => {
    expect(parseImageData('no image data here')).toBeNull();
  });

  it('解析後 bid、cid 為 number 型別', () => {
    const decrypted = `SMH.imgData({"bid":999,"cid":1,"bname":"test","cname":"ch1","path":"/p/","files":["1.jpg"],"sl":{"e":0,"m":""}})`;
    const result = parseImageData(decrypted);
    expect(typeof result!.bid).toBe('number');
    expect(typeof result!.cid).toBe('number');
  });
});

describe('buildImageUrl', () => {
  it('無 sl 參數時回傳正確 URL', () => {
    expect(buildImageUrl('/comic/path/', '001.jpg')).toBe(
      'https://i.hamreus.com/comic/path/001.jpg'
    );
  });

  it('sl.e=0 且 sl.m="" 時不附加 query string', () => {
    const url = buildImageUrl('/path/', 'img.jpg', { e: 0, m: '' });
    expect(url).toBe('https://i.hamreus.com/path/img.jpg');
    expect(url).not.toContain('?');
  });

  it('sl.e 和 sl.m 均有值時附加 ?e=X&m=Y', () => {
    const url = buildImageUrl('/path/', 'img.jpg', { e: 1234567890, m: 'abc123' });
    expect(url).toBe('https://i.hamreus.com/path/img.jpg?e=1234567890&m=abc123');
  });

  it('sl.m 含特殊字元時被 encodeURIComponent', () => {
    const url = buildImageUrl('/path/', 'img.jpg', { e: 1, m: 'a+b=c&d' });
    expect(url).toContain('m=' + encodeURIComponent('a+b=c&d'));
  });

  it('path 以 / 結尾時 URL 格式正確（無雙斜線）', () => {
    const url = buildImageUrl('/comic/12345/', '001.jpg');
    expect(url).toBe('https://i.hamreus.com/comic/12345/001.jpg');
    expect(url).not.toContain('//comic');
  });
});
