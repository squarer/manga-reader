import { describe, it, expect } from 'vitest';
import { parseUpdateList } from '../parser/update-parser';

// ─── HTML fixture helpers ────────────────────────────────────────────────────

function makeLi({
  id = 12345,
  href = `/comic/${12345}/`,
  title = '測試漫畫',
  cover = '//cf.mhgui.com/cpic/h/12345.jpg',
  latestChapter = '第100話',
  updateTime = '今天 12:30',
  score = '9.2',
}: {
  id?: number;
  href?: string;
  title?: string;
  cover?: string;
  latestChapter?: string;
  updateTime?: string;
  score?: string | null;
} = {}): string {
  const scoreHtml = score !== null ? `<em>${score}</em>` : '';
  return `
    <li>
      <a class="cover" href="${href.replace('12345', String(id))}" title="${title}">
        <img data-src="${cover}" />
      </a>
      <span class="tt">${latestChapter}</span>
      <span class="dt">${updateTime}</span>
      ${scoreHtml}
    </li>`;
}

function makeHtml({
  items = [makeLi()],
  currentPage = 1,
  pageLinks = [1, 2, 3, 4, 5],
}: {
  items?: string[];
  currentPage?: number;
  pageLinks?: number[];
} = {}): string {
  const pagerHtml = `
    <div class="pager">
      <span class="current">${currentPage}</span>
      ${pageLinks.filter((p) => p !== currentPage).map((p) => `<a href="?page=${p}">${p}</a>`).join('')}
    </div>`;

  return `<html><body>
    <div class="latest-list">
      <ul>${items.join('')}</ul>
    </div>
    ${pagerHtml}
  </body></html>`;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayStr(): string {
  const now = new Date();
  return formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
}

function daysAgoStr(n: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('parseUpdateList', () => {
  describe('items parsing', () => {
    it('valid HTML → returns correct manga item fields', () => {
      const html = makeHtml({
        items: [
          makeLi({
            id: 7890,
            title: '鬼滅之刃',
            cover: '//cf.mhgui.com/cpic/h/7890.jpg',
            latestChapter: '第205話',
            updateTime: '今天 08:00',
            score: '9.8',
          }),
        ],
      });

      const { items } = parseUpdateList(html);

      expect(items).toHaveLength(1);
      const item = items[0];
      expect(item.id).toBe(7890);
      expect(item.name).toBe('鬼滅之刃');
      expect(item.cover).toBe('https://cf.mhgui.com/cpic/h/7890.jpg');
      expect(item.latestChapter).toBe('第205話');
      expect(item.score).toBe(9.8);
    });

    it('cover with src attribute (not data-src) is used', () => {
      const li = `
        <li>
          <a class="cover" href="/comic/111/" title="有 src 封面">
            <img src="//cdn.example.com/cover.jpg" />
          </a>
          <span class="tt">第1話</span>
          <span class="dt">今天 10:00</span>
        </li>`;

      const { items } = parseUpdateList(makeHtml({ items: [li] }));
      expect(items[0].cover).toBe('https://cdn.example.com/cover.jpg');
    });

    it('cover starting with https:// is kept as-is', () => {
      const li = `
        <li>
          <a class="cover" href="/comic/222/" title="絕對路徑封面">
            <img data-src="https://cdn.example.com/full-cover.jpg" />
          </a>
          <span class="tt">第1話</span>
          <span class="dt">今天 10:00</span>
        </li>`;

      const { items } = parseUpdateList(makeHtml({ items: [li] }));
      expect(items[0].cover).toBe('https://cdn.example.com/full-cover.jpg');
    });

    it('missing score → score is undefined', () => {
      const html = makeHtml({
        items: [makeLi({ score: null })],
      });

      const { items } = parseUpdateList(html);
      expect(items[0].score).toBeUndefined();
    });

    it('non-numeric score text → score is NaN (parseFloat edge case)', () => {
      const html = makeHtml({
        items: [makeLi({ score: 'N/A' })],
      });

      const { items } = parseUpdateList(html);
      // parseFloat('N/A') = NaN; score field is present but not a valid number
      expect(Number.isNaN(items[0].score)).toBe(true);
    });

    it('li without matching /comic/id/ href is skipped', () => {
      const invalidLi = `
        <li>
          <a class="cover" href="/other/path/" title="非漫畫連結">
            <img data-src="//cdn.example.com/img.jpg" />
          </a>
          <span class="tt">第1話</span>
          <span class="dt">今天 10:00</span>
        </li>`;

      const { items } = parseUpdateList(makeHtml({ items: [invalidLi] }));
      expect(items).toHaveLength(0);
    });

    it('parses multiple items in order', () => {
      const html = makeHtml({
        items: [
          makeLi({ id: 1, title: '漫畫 A' }),
          makeLi({ id: 2, title: '漫畫 B' }),
          makeLi({ id: 3, title: '漫畫 C' }),
        ],
      });

      const { items } = parseUpdateList(html);
      expect(items).toHaveLength(3);
      expect(items.map((i) => i.id)).toEqual([1, 2, 3]);
      expect(items.map((i) => i.name)).toEqual(['漫畫 A', '漫畫 B', '漫畫 C']);
    });
  });

  describe('relative date parsing', () => {
    it('今天 → today\'s date', () => {
      const html = makeHtml({ items: [makeLi({ updateTime: '今天 14:30' })] });
      const { items } = parseUpdateList(html);
      expect(items[0].updateTime).toBe(todayStr());
    });

    it('昨天 → yesterday\'s date', () => {
      const html = makeHtml({ items: [makeLi({ updateTime: '昨天 09:15' })] });
      const { items } = parseUpdateList(html);
      expect(items[0].updateTime).toBe(daysAgoStr(1));
    });

    it('前天 → day before yesterday', () => {
      const html = makeHtml({ items: [makeLi({ updateTime: '前天 23:59' })] });
      const { items } = parseUpdateList(html);
      expect(items[0].updateTime).toBe(daysAgoStr(2));
    });

    it('今天 with 00:00 (midnight) → today\'s date', () => {
      const html = makeHtml({ items: [makeLi({ updateTime: '今天 00:00' })] });
      const { items } = parseUpdateList(html);
      expect(items[0].updateTime).toBe(todayStr());
    });
  });

  describe('MM-DD date format parsing', () => {
    it('past date in current year → YYYY-MM-DD with current year', () => {
      // Use a fixed past date that is guaranteed to have already passed this year
      const now = new Date();
      const pastMonth = String(1).padStart(2, '0'); // January is always in the past unless it's Jan 1
      const pastDay = '01';
      // Only run this assertion when Jan 1 is in the past
      const jan1 = new Date(now.getFullYear(), 0, 1);
      if (now >= jan1) {
        const html = makeHtml({ items: [makeLi({ updateTime: `01-01` })] });
        const { items } = parseUpdateList(html);
        expect(items[0].updateTime).toBe(`${now.getFullYear()}-${pastMonth}-${pastDay}`);
      }
    });

    it('MM-DD format produces YYYY-MM-DD string', () => {
      const html = makeHtml({ items: [makeLi({ updateTime: '03-15' })] });
      const { items } = parseUpdateList(html);
      expect(items[0].updateTime).toMatch(/^\d{4}-03-15$/);
    });

    it('MM-DD date in the future → assigned to previous year', () => {
      const now = new Date();
      // Find a future month-day combination
      const futureMonth = now.getMonth() + 2; // 2 months ahead guarantees future
      if (futureMonth <= 12) {
        const mm = String(futureMonth).padStart(2, '0');
        const html = makeHtml({ items: [makeLi({ updateTime: `${mm}-01` })] });
        const { items } = parseUpdateList(html);
        expect(items[0].updateTime).toBe(`${now.getFullYear() - 1}-${mm}-01`);
      }
    });

    it('single-digit month and day (M-D) are parsed correctly', () => {
      const html = makeHtml({ items: [makeLi({ updateTime: '3-5' })] });
      const { items } = parseUpdateList(html);
      // Result should be either this year or last year depending on date
      expect(items[0].updateTime).toMatch(/^\d{4}-03-05$/);
    });
  });

  describe('unknown / empty date text', () => {
    it('unrecognised date text → empty string', () => {
      const html = makeHtml({ items: [makeLi({ updateTime: 'unknown format' })] });
      const { items } = parseUpdateList(html);
      expect(items[0].updateTime).toBe('');
    });

    it('empty date text → empty string', () => {
      const html = makeHtml({ items: [makeLi({ updateTime: '' })] });
      const { items } = parseUpdateList(html);
      expect(items[0].updateTime).toBe('');
    });
  });

  describe('empty update list', () => {
    it('no li items → empty items array', () => {
      const html = `<html><body>
        <div class="latest-list"><ul></ul></div>
        <div class="pager"><span class="current">1</span></div>
      </body></html>`;

      const { items, pagination } = parseUpdateList(html);
      expect(items).toHaveLength(0);
      expect(pagination.current).toBe(1);
    });

    it('missing .latest-list → empty items array', () => {
      const html = `<html><body><div class="other"></div></body></html>`;
      const { items } = parseUpdateList(html);
      expect(items).toHaveLength(0);
    });
  });

  describe('pagination extraction', () => {
    it('current page and total pages are extracted correctly', () => {
      const html = makeHtml({ currentPage: 3, pageLinks: [1, 2, 3, 4, 5] });
      const { pagination } = parseUpdateList(html);
      expect(pagination.current).toBe(3);
      expect(pagination.total).toBe(5);
    });

    it('page 1 of 1 (no page links) → current=1 total=1', () => {
      const html = `<html><body>
        <div class="latest-list"><ul>${makeLi()}</ul></div>
        <div class="pager"><span class="current">1</span></div>
      </body></html>`;

      const { pagination } = parseUpdateList(html);
      expect(pagination.current).toBe(1);
      expect(pagination.total).toBe(1);
    });

    it('no .pager element → defaults to current=1 total=1', () => {
      const html = `<html><body>
        <div class="latest-list"><ul>${makeLi()}</ul></div>
      </body></html>`;

      const { pagination } = parseUpdateList(html);
      expect(pagination.current).toBe(1);
      expect(pagination.total).toBe(1);
    });

    it('totalItems is always 0 (not parsed from HTML)', () => {
      const { pagination } = parseUpdateList(makeHtml());
      expect(pagination.totalItems).toBe(0);
    });

    it('current page is max among all page numbers', () => {
      // Current page = 5, links only go up to 4
      const html = `<html><body>
        <div class="latest-list"><ul>${makeLi()}</ul></div>
        <div class="pager">
          <span class="current">5</span>
          <a href="?page=1">1</a>
          <a href="?page=2">2</a>
          <a href="?page=3">3</a>
          <a href="?page=4">4</a>
        </div>
      </body></html>`;

      const { pagination } = parseUpdateList(html);
      expect(pagination.current).toBe(5);
      expect(pagination.total).toBe(5); // Math.max(4, 5) = 5
    });

    it('first page of many → current=1 total reflects highest link', () => {
      const html = makeHtml({ currentPage: 1, pageLinks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
      const { pagination } = parseUpdateList(html);
      expect(pagination.current).toBe(1);
      expect(pagination.total).toBe(10);
    });

    it('last page → current equals total', () => {
      const html = makeHtml({ currentPage: 10, pageLinks: [8, 9, 10] });
      const { pagination } = parseUpdateList(html);
      expect(pagination.current).toBe(10);
      expect(pagination.total).toBe(10);
    });
  });
});
