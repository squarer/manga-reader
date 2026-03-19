import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseMangaDetail, naturalSort } from '../parser/detail-parser';

describe('naturalSort', () => {
  it('純數字字串排序：["10","9","1"] → ["1","9","10"]', () => {
    expect(['10', '9', '1'].sort(naturalSort)).toEqual(['1', '9', '10']);
  });

  it('中文前綴排序：["話10","話9","話1"] → ["話1","話9","話10"]', () => {
    expect(['話10', '話9', '話1'].sort(naturalSort)).toEqual(['話1', '話9', '話10']);
  });

  it('等值字串排序結果為 0', () => {
    expect(naturalSort('第5話', '第5話')).toBe(0);
  });

  it('單元素陣列排序結果不變', () => {
    expect(['第1話'].sort(naturalSort)).toEqual(['第1話']);
  });

  it('空陣列排序不報錯', () => {
    expect([].sort(naturalSort)).toEqual([]);
  });

  it('混合數字排序：["第1話","第10話","第2話"] → 升冪', () => {
    expect(['第1話', '第10話', '第2話'].sort(naturalSort)).toEqual(['第1話', '第2話', '第10話']);
  });

  it('完全不含數字的字串按 localeCompare 排序', () => {
    const result = ['banana', 'apple', 'cherry'].sort(naturalSort);
    expect(result).toEqual(['apple', 'banana', 'cherry']);
  });
});

// 最小 HTML fixture 工廠函數
function makeHtml({
  title = '測試漫畫',
  cover = '//cf.mhgui.com/cpic/h/12345.jpg',
  author = '作者名',
  status = '连载',
  date = '2024-01-15',
  genres = ['熱血'],
  score = '8.5',
  chapters = [] as Array<{ id: number; name: string }>,
} = {}): string {
  const chapterHtml =
    chapters.length > 0
      ? `<div class="chapter">
          <h4><span>單行本</span></h4>
          <div class="chapter-list">
            <ul>${chapters.map((ch) => `<li><a href="/comic/12345/${ch.id}.html" title="${ch.name}"><span>${ch.name}</span></a></li>`).join('')}</ul>
          </div>
        </div>`
      : '';

  return `<html><body>
    <div class="book-title"><h1>${title}</h1></div>
    <p class="hcover"><img src="${cover}"/></p>
    <ul class="detail-list">
      <li><a href="/author/test">${author}</a></li>
      <li>漫画状态：${status}[${date}]</li>
      ${genres.map((g) => `<li><a href="/list/${g}/">${g}</a></li>`).join('')}
    </ul>
    <div class="score"><p class="score-avg"><em>${score}</em></p></div>
    ${chapterHtml}
  </body></html>`;
}

describe('parseMangaDetail', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('無標題時觸發 console.warn', () => {
    const warnSpy = vi.spyOn(console, 'warn');
    parseMangaDetail('<html><body><div>no title</div></body></html>', 99);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('no title found'),
      expect.anything()
    );
  });

  it('解析標題、封面、作者，回傳正確 MangaInfo', () => {
    const result = parseMangaDetail(makeHtml(), 12345);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('測試漫畫');
    expect(result!.author).toBe('作者名');
    expect(result!.id).toBe(12345);
  });

  it('無標題的 HTML 回傳 null', () => {
    expect(parseMangaDetail('<html><body></body></html>', 1)).toBeNull();
  });

  it('解析連載狀態 "连载" → "連載中"', () => {
    const result = parseMangaDetail(makeHtml({ status: '连载' }), 1);
    expect(result!.status).toBe('連載中');
  });

  it('解析完結狀態 "完结" → "已完結"', () => {
    const result = parseMangaDetail(makeHtml({ status: '完结' }), 1);
    expect(result!.status).toBe('已完結');
  });

  it('解析更新日期', () => {
    const result = parseMangaDetail(makeHtml({ date: '2024-06-01' }), 1);
    expect(result!.lastUpdate).toBe('2024-06-01');
  });

  it('封面 // 開頭自動補 https:', () => {
    const result = parseMangaDetail(makeHtml({ cover: '//cf.mhgui.com/cpic/h/1.jpg' }), 1);
    expect(result!.cover).toBe('https://cf.mhgui.com/cpic/h/1.jpg');
  });

  it('評分格式 <em>8.5</em> 正確解析為 number', () => {
    const result = parseMangaDetail(makeHtml({ score: '8.5' }), 1);
    expect(result!.score).toBe(8.5);
  });

  it('非數字評分時 score 為 undefined', () => {
    const result = parseMangaDetail(makeHtml({ score: 'N/A' }), 1);
    expect(result!.score).toBeUndefined();
  });

  it('解析章節列表，章節按 naturalSort 降序排列', () => {
    const result = parseMangaDetail(
      makeHtml({
        chapters: [
          { id: 1001, name: '第1話' },
          { id: 1010, name: '第10話' },
          { id: 1002, name: '第2話' },
        ],
      }),
      12345
    );
    expect(result!.chapters.length).toBeGreaterThan(0);
    const names = result!.chapters[0].chapters.map((ch) => ch.name);
    // 降序：第10話 > 第2話 > 第1話
    expect(names).toEqual(['第10話', '第2話', '第1話']);
  });

  it('排除地區類型連結（/list/japan/）', () => {
    const html = makeHtml().replace(
      '</ul>',
      '<li><a href="/list/japan/">日本</a></li></ul>'
    );
    const result = parseMangaDetail(html, 1);
    expect(result!.genres).not.toContain('日本');
  });
});
