import { describe, it, expect } from 'vitest';
import { parseRankList } from '../parser/rank-parser';
import { RankTrend } from '../types';

const CDN_URL = 'https://cf.mhgui.com';

function buildCoverUrl(id: number) {
  return `${CDN_URL}/cpic/h/${id}.jpg`;
}

// ── HTML fixture 工廠 ──────────────────────────────────────────────────

interface RowOptions {
  rank?: string;
  id?: number;
  name?: string;
  authors?: string[];
  latestChapter?: string;
  updateTime?: string;
  score?: string;
  trendClass?: 'trend-up' | 'trend-down' | 'trend-no' | '';
}

function makeRow({
  rank = '1',
  id = 10001,
  name = '測試漫畫',
  authors = ['作者A'],
  latestChapter = '第100話',
  updateTime = '2024-01-01',
  score = '9.5',
  trendClass = 'trend-no',
}: RowOptions = {}): string {
  const authorLinks = authors
    .map((a) => `<a href="/search/?author=${encodeURIComponent(a)}">${a}</a>`)
    .join('');
  const trendHtml = trendClass
    ? `<span class="${trendClass}"></span>`
    : '<span></span>';
  return `
    <tr>
      <td class="rank-no"><span>${rank}</span></td>
      <td class="rank-title"><h5><a href="/comic/${id}/">${name}</a></h5></td>
      <td class="rank-author">${authorLinks}</td>
      <td class="rank-update"><a href="/comic/${id}/chapter/">${latestChapter}</a></td>
      <td class="rank-time">${updateTime}</td>
      <td class="rank-score">${score}</td>
      <td class="rank-trend">${trendHtml}</td>
    </tr>`;
}

function makeTable(rows: string): string {
  return `
    <html><body>
      <table class="rank-detail">
        <tr><th>排名</th><th>漫畫</th><th>作者</th><th>最新章節</th><th>更新時間</th><th>評分</th><th>趨勢</th></tr>
        <tr class="rank-split-first"><td colspan="7"></td></tr>
        ${rows}
        <tr class="rank-split"><td colspan="7"></td></tr>
      </table>
    </body></html>`;
}

// ── 測試 ──────────────────────────────────────────────────────────────

describe('parseRankList', () => {
  describe('有效排行榜 HTML：多項目', () => {
    it('解析三筆資料後傳回長度 3 的陣列', () => {
      const html = makeTable(
        makeRow({ rank: '1', id: 10001, name: '進擊的巨人' }) +
          makeRow({ rank: '2', id: 10002, name: '海賊王' }) +
          makeRow({ rank: '3', id: 10003, name: '火影忍者' })
      );
      const result = parseRankList(html);
      expect(result).toHaveLength(3);
    });

    it('第一項的所有欄位值正確', () => {
      const html = makeTable(
        makeRow({
          rank: '1',
          id: 10001,
          name: '進擊的巨人',
          authors: ['諫山創'],
          latestChapter: '第139話',
          updateTime: '2021-04-09',
          score: '9.8',
          trendClass: 'trend-up',
        })
      );
      const [item] = parseRankList(html);
      expect(item).toMatchObject({
        rank: 1,
        id: 10001,
        name: '進擊的巨人',
        cover: buildCoverUrl(10001),
        author: '諫山創',
        latestChapter: '第139話',
        updateTime: '2021-04-09',
        score: 9.8,
        trend: RankTrend.UP,
      });
    });

    it('第二項排名為 2', () => {
      const html = makeTable(
        makeRow({ rank: '1', id: 10001 }) +
          makeRow({ rank: '2', id: 10002, name: '海賊王' })
      );
      const result = parseRankList(html);
      expect(result[1].rank).toBe(2);
    });

    it('各項目 id 不重複', () => {
      const html = makeTable(
        makeRow({ rank: '1', id: 10001 }) +
          makeRow({ rank: '2', id: 10002 }) +
          makeRow({ rank: '3', id: 10003 })
      );
      const ids = parseRankList(html).map((i) => i.id);
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe('趨勢解析', () => {
    it.each([
      ['trend-up', RankTrend.UP],
      ['trend-down', RankTrend.DOWN],
      ['trend-no', RankTrend.SAME],
    ] as const)('trendClass=%s → trend=%s', (trendClass, expected) => {
      const html = makeTable(makeRow({ trendClass }));
      const [item] = parseRankList(html);
      expect(item.trend).toBe(expected);
    });

    it('無 trend class → 預設 SAME', () => {
      const html = makeTable(makeRow({ trendClass: '' }));
      const [item] = parseRankList(html);
      expect(item.trend).toBe(RankTrend.SAME);
    });
  });

  describe('評分解析（string → number）', () => {
    it('整數字串 "9" → 9', () => {
      const html = makeTable(makeRow({ score: '9' }));
      const [item] = parseRankList(html);
      expect(item.score).toBe(9);
    });

    it('小數字串 "8.75" → 8.75', () => {
      const html = makeTable(makeRow({ score: '8.75' }));
      const [item] = parseRankList(html);
      expect(item.score).toBe(8.75);
    });

    it('"10.0" → 10', () => {
      const html = makeTable(makeRow({ score: '10.0' }));
      const [item] = parseRankList(html);
      expect(item.score).toBe(10);
    });
  });

  describe('封面 URL', () => {
    it('使用 CDN URL 組合 id', () => {
      const html = makeTable(makeRow({ id: 99999 }));
      const [item] = parseRankList(html);
      expect(item.cover).toBe(`${CDN_URL}/cpic/h/99999.jpg`);
    });
  });

  describe('多作者', () => {
    it('兩位作者以逗號連接', () => {
      const html = makeTable(makeRow({ authors: ['作者A', '作者B'] }));
      const [item] = parseRankList(html);
      expect(item.author).toBe('作者A, 作者B');
    });

    it('單一作者不帶逗號', () => {
      const html = makeTable(makeRow({ authors: ['獨著者'] }));
      const [item] = parseRankList(html);
      expect(item.author).toBe('獨著者');
    });
  });

  describe('空排行榜', () => {
    it('空 table → []', () => {
      const html = makeTable('');
      expect(parseRankList(html)).toEqual([]);
    });

    it('無 table.rank-detail → []', () => {
      const html = '<html><body><div>無表格</div></body></html>';
      expect(parseRankList(html)).toEqual([]);
    });

    it('空字串 HTML → []', () => {
      expect(parseRankList('')).toEqual([]);
    });
  });

  describe('缺少選填欄位的優雅處理', () => {
    it('無 .rank-score 文字 → score 為 undefined', () => {
      const row = `
        <tr>
          <td class="rank-no"><span>1</span></td>
          <td class="rank-title"><h5><a href="/comic/10001/">無評分漫畫</a></h5></td>
          <td class="rank-author"></td>
          <td class="rank-update"><a href="#">第1話</a></td>
          <td class="rank-time">2024-01-01</td>
          <td class="rank-score"></td>
          <td class="rank-trend"><span class="trend-no"></span></td>
        </tr>`;
      const [item] = parseRankList(makeTable(row));
      expect(item.score).toBeUndefined();
    });

    it('無作者連結 → author 為 undefined', () => {
      const row = `
        <tr>
          <td class="rank-no"><span>1</span></td>
          <td class="rank-title"><h5><a href="/comic/10001/">無作者漫畫</a></h5></td>
          <td class="rank-author"></td>
          <td class="rank-update"><a href="#">第1話</a></td>
          <td class="rank-time">2024-01-01</td>
          <td class="rank-score">8.0</td>
          <td class="rank-trend"><span class="trend-no"></span></td>
        </tr>`;
      const [item] = parseRankList(makeTable(row));
      expect(item.author).toBeUndefined();
    });
  });

  describe('跳過無效行', () => {
    it('th 表頭行不計入結果', () => {
      const html = makeTable(makeRow({ rank: '1', id: 10001 }));
      // 表格中有一個 th 表頭行，但結果只有一個 data 行
      expect(parseRankList(html)).toHaveLength(1);
    });

    it('.rank-split 分隔行不計入結果', () => {
      const html = makeTable(makeRow({ rank: '1', id: 10001 }));
      // makeTable 已含 rank-split 和 rank-split-first，不應計入
      expect(parseRankList(html)).toHaveLength(1);
    });

    it('排名文字無法解析為數字的行被跳過', () => {
      const badRow = `
        <tr>
          <td class="rank-no"><span>N/A</span></td>
          <td class="rank-title"><h5><a href="/comic/10001/">有問題的行</a></h5></td>
          <td class="rank-author"></td>
          <td class="rank-update"></td>
          <td class="rank-time"></td>
          <td class="rank-score"></td>
          <td class="rank-trend"><span class="trend-no"></span></td>
        </tr>`;
      const html = makeTable(badRow + makeRow({ rank: '2', id: 10002 }));
      const result = parseRankList(html);
      expect(result).toHaveLength(1);
      expect(result[0].rank).toBe(2);
    });

    it('href 不符合 /comic/\\d+ 格式的行被跳過', () => {
      const badRow = `
        <tr>
          <td class="rank-no"><span>1</span></td>
          <td class="rank-title"><h5><a href="/invalid/path/">無效連結</a></h5></td>
          <td class="rank-author"></td>
          <td class="rank-update"></td>
          <td class="rank-time"></td>
          <td class="rank-score">8.0</td>
          <td class="rank-trend"><span class="trend-no"></span></td>
        </tr>`;
      const html = makeTable(badRow);
      expect(parseRankList(html)).toHaveLength(0);
    });
  });

  describe('type 參數', () => {
    it('傳入 type 不影響解析結果', () => {
      const html = makeTable(makeRow({ rank: '1', id: 10001 }));
      const withType = parseRankList(html, 'day' as import('../types').RankTypeEnum);
      const withoutType = parseRankList(html);
      expect(withType).toEqual(withoutType);
    });
  });
});
