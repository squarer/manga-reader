/**
 * 漫畫詳情 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchMangaDetail, parseMangaDetail } from '@/lib/scraper';
import { CacheHeaders } from '@/lib/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mangaId = parseInt(id, 10);

  if (isNaN(mangaId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid manga ID' },
      { status: 400 }
    );
  }

  try {
    const html = await fetchMangaDetail(mangaId);
    const manga = parseMangaDetail(html, mangaId);

    if (!manga) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse manga detail' },
        { status: 500 }
      );
    }

    // 如果 HTML 解析沒取得評分，嘗試從 vote API 計算
    if (!manga.score) {
      try {
        const voteUrl = `https://www.manhuagui.com/tools/vote.ashx?act=get&bid=${mangaId}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        try {
          const res = await fetch(voteUrl, {
            headers: { Referer: 'https://www.manhuagui.com/' },
            signal: controller.signal,
          });

          // vote API 回傳 { success: true, data: { s1, s2, s3, s4, s5 } }
          // s1-s5 代表各星級的投票數（1-5星），網站顯示10分制
          if (res.ok) {
            const json = await res.json();
            if (json?.success && json?.data) {
              const { s1, s2, s3, s4, s5 } = json.data;
              const totalVotes = s1 + s2 + s3 + s4 + s5;

              if (totalVotes > 0) {
                // 加權平均（轉換為10分制：1星=2分, 2星=4分, ..., 5星=10分）
                const weightedSum = s1 * 2 + s2 * 4 + s3 * 6 + s4 * 8 + s5 * 10;
                manga.score = Math.round((weightedSum / totalVotes) * 10) / 10;
              }
            }
          }
        } finally {
          clearTimeout(timer);
        }
      } catch {
        // 評分取得失敗不影響主要功能
      }
    }

    return NextResponse.json(
      { success: true, data: manga },
      { headers: { 'Cache-Control': CacheHeaders.DETAIL } }
    );
  } catch (error) {
    console.error('Manga detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch manga detail' },
      { status: 500 }
    );
  }
}
