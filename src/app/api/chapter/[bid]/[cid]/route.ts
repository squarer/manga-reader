/**
 * 章節圖片 API
 * 解密並返回章節的圖片列表
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchChapterPage,
  decryptChapterPage,
  buildImageUrl,
} from '@/lib/scraper';

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
    const html = await fetchChapterPage(mangaId, chapterId);
    const imageData = decryptChapterPage(html);

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

    return NextResponse.json({
      success: true,
      data: {
        bid: imageData.bid,
        cid: imageData.cid,
        bname: imageData.bname,
        cname: imageData.cname,
        images,
        prevCid: imageData.prevcid,
        nextCid: imageData.nextcid,
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
