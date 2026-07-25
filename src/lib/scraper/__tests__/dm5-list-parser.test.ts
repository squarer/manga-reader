/**
 * dm5 搜尋／列表解析測試
 * 重點：搜尋頁頂部「精確匹配」banner（.banner_detail_form）需置頂且去重，
 * 否則完全符合的主作（第一筆）會遺漏（回歸自「source=dm5 查詢漏第一筆」bug）。
 */

import { describe, it, expect } from 'vitest';
import { parseMangaList } from '../providers/dm5/parser/list';

/** 最小 .mh-item 清單項目（.manga-info + h2.title a） */
function mhItem({
  name,
  slug,
  cover = 'https://cdn.example/x.jpg',
  latestChapter = '第1卷',
}: {
  name: string;
  slug: string;
  cover?: string;
  latestChapter?: string;
}): string {
  return `
    <div class="mh-item">
      <h2 class="title"><a href="/manhua-${slug}/">${name}</a></h2>
      <div class="manga-info" uk="manhua-${slug}" tc="${cover}" tn="${latestChapter}" lt=""></div>
    </div>`;
}

/** 最小精確匹配 banner */
function banner({
  name = '幽游白书',
  slug = 'youyoubaishu',
  cover = 'https://cdn.example/banner.jpg',
  btnTitle = '幽游白书 第15卷',
}: Partial<{ name: string; slug: string; cover: string; btnTitle: string }> = {}): string {
  return `
    <section class="mt70"><div class="banner_detail_form">
      <div class="cover"><img src="${cover}"></div>
      <div class="info">
        <p class="title"><a href="/manhua-${slug}/" title="${name}">${name}</a></p>
        <div class="bottom">
          <a href="/m1/" title="${btnTitle}" class="btn-2">开始阅读</a>
        </div>
      </div>
    </div></section>`;
}

describe('dm5 parseMangaList — 搜尋 banner 置頂', () => {
  it('banner 主作置頂於 .mh-item 清單之前', () => {
    const html =
      banner() +
      mhItem({ name: '幽游白书画集', slug: 'youyoubaishuhuaji' }) +
      mhItem({ name: '白幽灵', slug: 'baiyouling' });

    const { items } = parseMangaList(html);

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      id: 'youyoubaishu',
      name: '幽游白书',
      cover: 'https://cdn.example/banner.jpg',
      latestChapter: '第15卷', // btn title 去掉 name 前綴
    });
    expect(items[1].id).toBe('youyoubaishuhuaji');
  });

  it('banner 與清單同 slug 時去重（不重複出現）', () => {
    const html =
      banner({ slug: 'youyoubaishu' }) +
      mhItem({ name: '幽游白书', slug: 'youyoubaishu' }) + // 與 banner 重複
      mhItem({ name: '白幽灵', slug: 'baiyouling' });

    const { items } = parseMangaList(html);

    expect(items).toHaveLength(2);
    expect(items.filter((i) => i.id === 'youyoubaishu')).toHaveLength(1);
    expect(items[0].id).toBe('youyoubaishu'); // banner 版本置頂
  });

  it('無 banner（瀏覽列表頁）時清單原樣，不受影響', () => {
    const html =
      mhItem({ name: '海贼王', slug: 'haizeiwang-onepiece' }) +
      mhItem({ name: '火影忍者', slug: 'huoying' });

    const { items } = parseMangaList(html);

    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('haizeiwang-onepiece');
  });

  it('banner btn title 無 name 前綴時 latestChapter 為空', () => {
    const html = banner({ name: '幽游白书', btnTitle: '开始阅读' });

    const { items } = parseMangaList(html);

    expect(items[0].latestChapter).toBe('');
  });
});
