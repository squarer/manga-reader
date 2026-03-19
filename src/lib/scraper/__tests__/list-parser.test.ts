import { describe, it, expect } from 'vitest';
import { parseMangaList } from '../parser/list-parser';

// ────────────────────────────────────────────────────────────────────────────
// Fixture helpers
// ────────────────────────────────────────────────────────────────────────────

interface ListItemOptions {
  id?: number;
  name?: string;
  cover?: string;
  latestChapter?: string;
  updateTime?: string;
  score?: string | null;
}

function makeListItem({
  id = 12345,
  name = '測試漫畫',
  cover = '//cf.mhgui.com/cpic/h/12345.jpg',
  latestChapter = '第100話',
  updateTime = '2024-06-01',
  score = '9.2',
}: ListItemOptions = {}): string {
  const scoreHtml = score != null ? `<em class="score">${score}</em>` : '';
  return `
    <li>
      <a href="/comic/${id}/" title="${name}">
        <img src="${cover}" alt="${name}"/>
        <span class="tt">${latestChapter}</span>
        <span class="updateon">更新于：${updateTime}</span>${scoreHtml}
      </a>
    </li>`;
}

function makeListHtml(items: string[], pagerHtml = ''): string {
  return `<html><body>
    <ul id="contList">${items.join('')}</ul>
    ${pagerHtml}
  </body></html>`;
}

// ────────────────────────────────────────────────────────────────────────────
// Search result fixture helpers
// ────────────────────────────────────────────────────────────────────────────

interface SearchItemOptions {
  id?: number;
  name?: string;
  cover?: string;
  latestChapter?: string;
  score?: string | null;
}

function makeSearchItem({
  id = 99001,
  name = '搜尋結果漫畫',
  cover = '//cf.mhgui.com/cpic/h/99001.jpg',
  latestChapter = '第50話',
  score = '8.8',
}: SearchItemOptions = {}): string {
  const scoreHtml = score != null ? `<em>${score}</em>` : '';
  return `
    <li class="cf">
      <div class="book-cover">
        <a class="bcover" href="/comic/${id}/" title="${name}">
          <img src="${cover}" alt="${name}"/>
        </a>
        <span class="tt">${latestChapter}</span>
        ${scoreHtml}
      </div>
      <dl class="book-detail">
        <dt><a href="/comic/${id}/" title="${name}">${name}</a></dt>
      </dl>
    </li>`;
}

function makeSearchHtml(items: string[], pagerHtml = ''): string {
  return `<html><body>
    <div class="book-result">
      <ul>${items.join('')}</ul>
    </div>
    ${pagerHtml}
  </body></html>`;
}

// ────────────────────────────────────────────────────────────────────────────
// Pager fixture helpers
// ────────────────────────────────────────────────────────────────────────────

function makeButtonPager({
  currentPage = 1,
  totalPages = 10,
  totalItems = 200,
}: {
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
} = {}): string {
  const links = Array.from({ length: totalPages }, (_, i) => {
    const page = i + 1;
    return page === currentPage
      ? `<span class="current">${page}</span>`
      : `<a href="?page=${page}">${page}</a>`;
  }).join('');
  return `<div class="pager">${links} 共有 ${totalItems} 部</div>`;
}

function makeTextPager(currentPage: number, totalPages: number): string {
  return `<div class="page-box">第 ${currentPage} / ${totalPages} 頁</div>`;
}

// ────────────────────────────────────────────────────────────────────────────
// parseMangaList — list page
// ────────────────────────────────────────────────────────────────────────────

describe('parseMangaList — 列表頁', () => {
  it('單一項目：正確解析 id、name、cover、latestChapter、updateTime、score', () => {
    const html = makeListHtml([
      makeListItem({
        id: 12345,
        name: '海賊王',
        cover: '//cf.mhgui.com/cpic/h/12345.jpg',
        latestChapter: '第1000話',
        updateTime: '2024-06-15',
        score: '9.5',
      }),
    ]);

    const { items } = parseMangaList(html);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 12345,
      name: '海賊王',
      cover: 'https://cf.mhgui.com/cpic/h/12345.jpg',
      latestChapter: '第1000話',
      updateTime: '2024-06-15',
      score: 9.5,
    });
  });

  it('多項目：解析三個漫畫，回傳正確陣列長度與各項 id', () => {
    const html = makeListHtml([
      makeListItem({ id: 1001, name: '漫畫A' }),
      makeListItem({ id: 1002, name: '漫畫B' }),
      makeListItem({ id: 1003, name: '漫畫C' }),
    ]);

    const { items } = parseMangaList(html);

    expect(items).toHaveLength(3);
    expect(items.map((i) => i.id)).toEqual([1001, 1002, 1003]);
  });

  it('空列表 HTML：回傳空陣列', () => {
    const html = makeListHtml([]);

    const { items } = parseMangaList(html);

    expect(items).toHaveLength(0);
  });

  it('無任何漫畫結構的 HTML：回傳空陣列', () => {
    const { items } = parseMangaList('<html><body><p>nothing here</p></body></html>');

    expect(items).toHaveLength(0);
  });

  describe('封面 URL 正規化', () => {
    it.each([
      ['// 開頭', '//cf.mhgui.com/cpic/h/1.jpg', 'https://cf.mhgui.com/cpic/h/1.jpg'],
      ['https:// 開頭（不重複加）', 'https://cf.mhgui.com/cpic/h/1.jpg', 'https://cf.mhgui.com/cpic/h/1.jpg'],
      ['http:// 開頭（不變）', 'http://cf.mhgui.com/cpic/h/1.jpg', 'http://cf.mhgui.com/cpic/h/1.jpg'],
    ])('%s', (_label, rawCover, expectedCover) => {
      const html = makeListHtml([makeListItem({ cover: rawCover })]);
      const { items } = parseMangaList(html);
      expect(items[0].cover).toBe(expectedCover);
    });
  });

  describe('缺少欄位的容錯處理', () => {
    it('無 .tt 標籤：latestChapter 為空字串', () => {
      const html = `<html><body>
        <ul id="contList">
          <li>
            <a href="/comic/500/" title="無章節漫畫">
              <img src="//example.com/img.jpg"/>
              <span class="updateon">更新于：2024-01-01</span>
            </a>
          </li>
        </ul>
      </body></html>`;

      const { items } = parseMangaList(html);

      expect(items[0].latestChapter).toBe('');
    });

    it('無 .updateon 標籤：updateTime 為空字串', () => {
      const html = `<html><body>
        <ul id="contList">
          <li>
            <a href="/comic/600/" title="無更新時間">
              <img src="//example.com/img.jpg"/>
              <span class="tt">第1話</span>
            </a>
          </li>
        </ul>
      </body></html>`;

      const { items } = parseMangaList(html);

      expect(items[0].updateTime).toBe('');
    });

    it('無評分 em 標籤：score 為 undefined', () => {
      const html = makeListHtml([makeListItem({ score: null })]);
      const { items } = parseMangaList(html);
      expect(items[0].score).toBeUndefined();
    });

    it('評分為非數字文字：score 為 NaN（parseFloat 行為）', () => {
      // 驗證 parseFloat 對非數字字串的行為（防止靜默容錯掩蓋問題）
      const html = makeListHtml([makeListItem({ score: 'N/A' })]);
      const { items } = parseMangaList(html);
      expect(items[0].score).toBeNaN();
    });

    it('href 無法匹配 /comic/id/ 格式的 li 跳過', () => {
      const html = `<html><body>
        <ul id="contList">
          <li><a href="/category/action/" title="動作">動作分類</a></li>
          <li><a href="/comic/777/" title="合法漫畫"><img src="//x.com/1.jpg"/></a></li>
        </ul>
      </body></html>`;

      const { items } = parseMangaList(html);

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(777);
    });
  });

  it('data-src 屬性作為封面備援（img 無 src 時）', () => {
    const html = `<html><body>
      <ul id="contList">
        <li>
          <a href="/comic/888/" title="懶載入漫畫">
            <img data-src="//cf.mhgui.com/cpic/h/888.jpg"/>
          </a>
        </li>
      </ul>
    </body></html>`;

    const { items } = parseMangaList(html);

    expect(items[0].cover).toBe('https://cf.mhgui.com/cpic/h/888.jpg');
  });

  it('book-list 選擇器：.book-list li 也能解析', () => {
    const html = `<html><body>
      <ul class="book-list">
        <li>
          <a href="/comic/321/" title="book-list 漫畫">
            <img src="//x.com/321.jpg"/>
          </a>
        </li>
      </ul>
    </body></html>`;

    const { items } = parseMangaList(html);

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(321);
  });

  it('標題優先順序：a[title] > p.ell a > p.ell text', () => {
    // a[title] 存在時使用 a[title]
    const html = makeListHtml([makeListItem({ name: 'TitleFromAttr' })]);
    const { items } = parseMangaList(html);
    expect(items[0].name).toBe('TitleFromAttr');
  });

  it('a 無 title 屬性時退回 p.ell a 文字', () => {
    const html = `<html><body>
      <ul id="contList">
        <li>
          <a href="/comic/456/">
            <img src="//x.com/456.jpg"/>
            <p class="ell"><a href="/comic/456/">p.ell 標題</a></p>
          </a>
        </li>
      </ul>
    </body></html>`;

    const { items } = parseMangaList(html);

    expect(items[0].name).toBe('p.ell 標題');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// parseMangaList — search result page
// ────────────────────────────────────────────────────────────────────────────

describe('parseMangaList — 搜尋結果頁', () => {
  it('有 .book-result 結構：走搜尋結果解析路徑', () => {
    const html = makeSearchHtml([makeSearchItem({ id: 99001, name: '搜尋到的漫畫' })]);
    const { items } = parseMangaList(html);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(99001);
    expect(items[0].name).toBe('搜尋到的漫畫');
  });

  it('搜尋結果：封面 // 開頭自動補 https:', () => {
    const html = makeSearchHtml([
      makeSearchItem({ cover: '//cf.mhgui.com/search/99002.jpg' }),
    ]);
    const { items } = parseMangaList(html);
    expect(items[0].cover).toBe('https://cf.mhgui.com/search/99002.jpg');
  });

  it('搜尋結果：正確解析 latestChapter 與 score', () => {
    const html = makeSearchHtml([
      makeSearchItem({ id: 99003, latestChapter: '第200話', score: '7.3' }),
    ]);
    const { items } = parseMangaList(html);
    expect(items[0].latestChapter).toBe('第200話');
    expect(items[0].score).toBe(7.3);
  });

  it('搜尋結果：無評分 em 時 score 為 undefined', () => {
    const html = makeSearchHtml([makeSearchItem({ score: null })]);
    const { items } = parseMangaList(html);
    expect(items[0].score).toBeUndefined();
  });

  it('搜尋結果：updateTime 固定為空字串', () => {
    const html = makeSearchHtml([makeSearchItem()]);
    const { items } = parseMangaList(html);
    expect(items[0].updateTime).toBe('');
  });

  it('搜尋結果：無法匹配 href 的 li 跳過', () => {
    const invalidItem = `<li class="cf"><div class="book-cover"><a class="bcover" href="/author/123/">不合法</a></div></li>`;
    const validItem = makeSearchItem({ id: 99010 });
    const html = makeSearchHtml([invalidItem, validItem]);
    const { items } = parseMangaList(html);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(99010);
  });

  it('多個搜尋結果：回傳正確數量', () => {
    const html = makeSearchHtml([
      makeSearchItem({ id: 1 }),
      makeSearchItem({ id: 2 }),
      makeSearchItem({ id: 3 }),
    ]);
    const { items } = parseMangaList(html);
    expect(items).toHaveLength(3);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// parseMangaList — pagination
// ────────────────────────────────────────────────────────────────────────────

describe('parseMangaList — 分頁資訊', () => {
  it('無分頁元素：預設 current=1, total=1, totalItems=項目數', () => {
    const html = makeListHtml([makeListItem({ id: 1 }), makeListItem({ id: 2 })]);
    const { pagination } = parseMangaList(html);
    expect(pagination.current).toBe(1);
    expect(pagination.total).toBe(1);
    expect(pagination.totalItems).toBe(2);
  });

  it('按鈕式分頁：正確解析當前頁與總頁數', () => {
    const html = makeListHtml(
      [makeListItem()],
      makeButtonPager({ currentPage: 3, totalPages: 10, totalItems: 200 })
    );
    const { pagination } = parseMangaList(html);
    expect(pagination.current).toBe(3);
    expect(pagination.total).toBe(10);
    expect(pagination.totalItems).toBe(200);
  });

  it('按鈕式分頁：第一頁（span.current = 1）', () => {
    const html = makeListHtml(
      [makeListItem()],
      makeButtonPager({ currentPage: 1, totalPages: 5 })
    );
    const { pagination } = parseMangaList(html);
    expect(pagination.current).toBe(1);
    expect(pagination.total).toBe(5);
  });

  it('按鈕式分頁：最後一頁（current 為 span，link 最大為 total-1）', () => {
    const html = makeListHtml(
      [makeListItem()],
      makeButtonPager({ currentPage: 10, totalPages: 10 })
    );
    const { pagination } = parseMangaList(html);
    expect(pagination.current).toBe(10);
    // total 取自 max(link pages, current)，此處 link 最大=9，current=10
    expect(pagination.total).toBeGreaterThanOrEqual(9);
  });

  it('文字式分頁「第 X / Y 頁」：正確解析', () => {
    const html = makeListHtml([makeListItem()], makeTextPager(4, 20));
    const { pagination } = parseMangaList(html);
    expect(pagination.current).toBe(4);
    expect(pagination.total).toBe(20);
  });

  it('文字式分頁：第 1 / 1 頁（單頁）', () => {
    const html = makeListHtml([makeListItem()], makeTextPager(1, 1));
    const { pagination } = parseMangaList(html);
    expect(pagination.current).toBe(1);
    expect(pagination.total).toBe(1);
  });

  it('共有 N 部 pattern：totalItems 正確解析', () => {
    const pager = `<div class="pager">
      <span class="current">2</span>
      <a href="?page=3">3</a>
      共有 500 部
    </div>`;
    const html = makeListHtml([makeListItem()], pager);
    const { pagination } = parseMangaList(html);
    expect(pagination.totalItems).toBe(500);
  });

  it.each([
    ['共有 100 部', 100],
    ['共 50 部', 50],
  ])('totalItems pattern: "%s" → %d', (totalText, expected) => {
    const pager = `<div class="pager"><span class="current">1</span><a href="?page=2">2</a> ${totalText}</div>`;
    const html = makeListHtml([makeListItem()], pager);
    const { pagination } = parseMangaList(html);
    expect(pagination.totalItems).toBe(expected);
  });

  it('分頁只有一頁連結時：total 等於唯一頁碼', () => {
    const pager = `<div class="pager"><span class="current">1</span><a href="?page=2">2</a></div>`;
    const html = makeListHtml([makeListItem()], pager);
    const { pagination } = parseMangaList(html);
    expect(pagination.total).toBe(2);
  });

  it('搜尋結果頁含分頁：pagination 也能正確解析', () => {
    const html = makeSearchHtml(
      [makeSearchItem()],
      makeButtonPager({ currentPage: 2, totalPages: 5, totalItems: 100 })
    );
    const { pagination } = parseMangaList(html);
    expect(pagination.current).toBe(2);
    expect(pagination.total).toBe(5);
    expect(pagination.totalItems).toBe(100);
  });
});
