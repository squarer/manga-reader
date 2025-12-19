/**
 * 章節圖片 API
 * 解密並返回章節的圖片列表
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchChapterPage,
  fetchMangaDetail,
  decryptChapterPage,
  parseMangaDetail,
  buildImageUrl,
} from '@/lib/scraper';

/**
 * 從章節列表計算上一章/下一章 ID
 * 章節列表順序：最新 → 最舊
 */
function computePrevNextCid(
  chapters: { id: number }[],
  currentCid: number
): { prevCid: number | null; nextCid: number | null } {
  // 展平所有章節群組
  const index = chapters.findIndex((ch) => ch.id === currentCid);

  if (index === -1) {
    return { prevCid: null, nextCid: null };
  }

  // 列表順序：最新 → 最舊
  // index - 1 = 較新的章節 = nextCid
  // index + 1 = 較舊的章節 = prevCid
  const nextCid = index > 0 ? chapters[index - 1].id : null;
  const prevCid = index < chapters.length - 1 ? chapters[index + 1].id : null;

  return { prevCid, nextCid };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bid: string; cid: string }> }
) {
  const { bid, cid } = await params;
  const mangaId = parseInt(bid, 10);
  const chapterId = parseInt(cid, 10);

  if (isNaN(mangaId) || isNaN(chapterId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid manga or chapter ID' },
      { status: 400 }
    );
  }

  try {
    // 並行獲取章節頁面和漫畫詳情
    const [chapterHtml, mangaHtml] = await Promise.all([
      fetchChapterPage(mangaId, chapterId),
      fetchMangaDetail(mangaId),
    ]);

    const imageData = decryptChapterPage(chapterHtml);

    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'Failed to decrypt chapter data' },
        { status: 500 }
      );
    }

    // 構建完整的圖片 URL 列表
    const images = imageData.files.map((filename) =>
      buildImageUrl(imageData.path, filename, imageData.sl)
    );

    // 計算上下章 ID
    let prevCid: number | null = imageData.prevcid ?? null;
    let nextCid: number | null = imageData.nextcid ?? null;

    // 如果解密數據沒有 prev/next，從漫畫詳情計算
    if (prevCid === null || nextCid === null) {
      const mangaInfo = parseMangaDetail(mangaHtml, mangaId);
      if (mangaInfo) {
        // 展平章節列表
        const allChapters = mangaInfo.chapters.flatMap((g) => g.chapters);
        const computed = computePrevNextCid(allChapters, chapterId);
        if (prevCid === null) prevCid = computed.prevCid;
        if (nextCid === null) nextCid = computed.nextCid;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        bid: imageData.bid,
        cid: imageData.cid,
        bname: imageData.bname,
        cname: imageData.cname,
        images,
        prevCid,
        nextCid,
        total: images.length,
      },
    });
  } catch (error) {
    console.error('Chapter error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
}
