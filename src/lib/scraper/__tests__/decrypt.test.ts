import { describe, it, expect, vi, afterEach } from 'vitest';
import { unpack, extractPackedScript, parseImageData, buildImageUrl, decryptChapterPage } from '../decrypt';

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

describe('空 images 陣列防禦', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reader 格式空 images 回傳 null', () => {
    const decrypted = `SMH.reader({"bookId":1,"chapterId":1,"bookName":"test","chapterTitle":"ch1","images":[]})`;
    const result = parseImageData(decrypted);
    expect(result).toBeNull();
  });

  it('reader 格式空 images 觸發 console.warn', () => {
    const warnSpy = vi.spyOn(console, 'warn');
    const decrypted = `SMH.reader({"bookId":1,"chapterId":1,"bookName":"test","chapterTitle":"ch1","images":[]})`;
    parseImageData(decrypted);
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe('parseImageData 結構驗證', () => {
  it('files 非陣列時跳過 JSON 解析', () => {
    const input = `SMH.imgData({"bid":1,"cid":1,"bname":"t","cname":"c","path":"/p/","files":"not_array","sl":{"e":0,"m":""}})`;
    expect(parseImageData(input)).toBeNull();
  });

  it('bid 非 number 時跳過 JSON 解析', () => {
    const input = `SMH.imgData({"bid":"abc","cid":1,"bname":"t","cname":"c","path":"/p/","files":["1.jpg"],"sl":{"e":0,"m":""}})`;
    expect(parseImageData(input)).toBeNull();
  });

  it('cid 非 number 時跳過 JSON 解析', () => {
    const input = `SMH.imgData({"bid":1,"cid":"abc","bname":"t","cname":"c","path":"/p/","files":["1.jpg"],"sl":{"e":0,"m":""}})`;
    expect(parseImageData(input)).toBeNull();
  });

  it('合法結構正常回傳', () => {
    const input = `SMH.imgData({"bid":1,"cid":2,"bname":"test","cname":"ch1","path":"/comics/test/","files":["001.jpg","002.jpg"],"sl":{"e":0,"m":""}})`;
    const result = parseImageData(input);
    expect(result).not.toBeNull();
    expect(result!.bid).toBe(1);
    expect(result!.cid).toBe(2);
    expect(result!.files).toHaveLength(2);
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

describe('decryptChapterPage logging', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('404 頁面觸發 console.warn', () => {
    const warnSpy = vi.spyOn(console, 'warn');
    const html = '<html><body>404 找不到此頁面</body></html>';

    const result = decryptChapterPage(html);

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0].join(' ')).toContain('404');
  });

  it('403 頁面觸發 console.warn', () => {
    const warnSpy = vi.spyOn(console, 'warn');
    const html = '<html><body>403 Forbidden</body></html>';

    const result = decryptChapterPage(html);

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0].join(' ')).toContain('403');
  });

  it('無 packed script 觸發 console.warn', () => {
    const warnSpy = vi.spyOn(console, 'warn');
    const html = '<html><body><p>Random content without any packed script</p></body></html>';

    const result = decryptChapterPage(html);

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0].join(' ')).toContain('No packed script');
  });
});

describe('decrypt edge cases', () => {
  // ─── extractPackedScript ────────────────────────────────────────────────

  it('extractPackedScript: HTML 含多個 packed script → 提取第一個符合的', () => {
    // 第一個是合法 eval(...) 格式，第二個是寬鬆格式 — 應取到第一個
    const firstScript = `eval(function(p,a,c,k,e,d){while(c--)if(k[c])p=p.replace(k[c],k[c]);return p}('0',36,1,'hello'.split('|')))`;
    const secondScript = `}('${'z'.repeat(101)}',36,2,'foo|bar')`;
    const html = `<script>${firstScript}</script><script>${secondScript}</script>`;
    const result = extractPackedScript(html);
    expect(result).not.toBeNull();
    // 第一個 eval(...) 格式優先被匹配
    expect(result).toContain('eval(function');
  });

  it('extractPackedScript: 無任何 packed script → 回傳 null', () => {
    const html = `<html><head><title>Normal Page</title></head><body><p>Just plain HTML, no JS at all.</p></body></html>`;
    expect(extractPackedScript(html)).toBeNull();
  });

  it('extractPackedScript: 類似 packed 但用陣列代替 .split → 仍可被 loose pattern 擷取', () => {
    // eval(function...) 格式仍能被 loose match 擷取，因為字串長度足夠
    const malformed = `eval(function(p,a,c,k,e,d){return p}('payload',36,1,['hello']))`;
    // loose pattern 只要有 eval(function 開頭就會嘗試匹配
    expect(extractPackedScript(malformed)).not.toBeNull();
  });

  // ─── unpack ─────────────────────────────────────────────────────────────

  it('unpack: 所有關鍵字為空字串 → payload 中的 token 保持原始編碼', () => {
    // count=3, keywords 全為空字串，dictionary[key] = key（fallback）
    const packed = `}('0 1 2',36,3,'||'.split('|'))`;
    const result = unpack(packed);
    // 空字串 keyword → 字典值是 key 本身（encodeBase(n,36)）
    expect(result).toBe('0 1 2');
  });

  it('unpack: radix > 36 → 使用自訂進位編碼正確解碼', () => {
    // radix=62: encodeBase(36, 62) → 36 >= 36，所以 fromCharCode(36+29)=fromCharCode(65)='A'
    // encodeBase(37, 62) → fromCharCode(37+29)='B'
    // payload 包含 'A' 和 'B' → 分別替換為 'alpha' 和 'beta'
    const packed = `}('A B',62,38,'${'|'.repeat(36)}alpha|beta'.split('|'))`;
    const result = unpack(packed);
    expect(result).toBe('alpha beta');
  });

  // ─── parseImageData ──────────────────────────────────────────────────────

  it('parseImageData: imgData 格式中含 prevcid/nextcid → 從解密字串額外提取', () => {
    // prevcid/nextcid 不在 JSON 物件內，但存在於周圍字串 → 應透過 regex fallback 取到
    const decrypted = `var prevcid=500;var nextcid=502;SMH.imgData({"bid":999,"cid":501,"bname":"測試","cname":"第5話","path":"/manga/999/","files":["001.jpg","002.jpg"],"sl":{"e":0,"m":""}})`;
    const result = parseImageData(decrypted);
    expect(result).not.toBeNull();
    expect(result!.bid).toBe(999);
    expect(result!.cid).toBe(501);
    expect(result!.prevcid).toBe(500);
    expect(result!.nextcid).toBe(502);
  });

  it('parseImageData: 完全無法辨識的輸入 → 回傳 null', () => {
    const garbage = `!!!@@@###$$$%%%^^^&&&***((()))`;
    expect(parseImageData(garbage)).toBeNull();
  });

  it('parseImageData: 只有空白字串 → 回傳 null', () => {
    expect(parseImageData('   \t\n\r   ')).toBeNull();
  });

  it('parseImageData: 空字串 → 回傳 null', () => {
    expect(parseImageData('')).toBeNull();
  });

  // ─── buildImageUrl ───────────────────────────────────────────────────────

  it('buildImageUrl: path 含中文字元 → 直接拼接不做額外編碼', () => {
    const url = buildImageUrl('/漫畫/路徑/', '圖片.jpg');
    expect(url).toBe('https://i.hamreus.com/漫畫/路徑/圖片.jpg');
  });

  it('buildImageUrl: filename 含空白與括號等特殊字元 → 原樣拼接', () => {
    const url = buildImageUrl('/path/', 'file name (1).jpg');
    expect(url).toBe('https://i.hamreus.com/path/file name (1).jpg');
  });

  it('buildImageUrl: path 為根路徑 "/" → URL 正確且不出現雙斜線', () => {
    const url = buildImageUrl('/', 'cover.jpg');
    expect(url).toBe('https://i.hamreus.com/cover.jpg');
    expect(url.split('//').length - 1).toBe(1); // 只有協議的 :// 一組雙斜線
  });

  it('buildImageUrl: sl 僅 e 有值但 m 為空 → 不附加 query string', () => {
    const url = buildImageUrl('/path/', 'img.jpg', { e: 999, m: '' });
    expect(url).not.toContain('?');
  });

  it('buildImageUrl: sl 僅 m 有值但 e 為 0 → 不附加 query string', () => {
    const url = buildImageUrl('/path/', 'img.jpg', { e: 0, m: 'sometoken' });
    expect(url).not.toContain('?');
  });
});
