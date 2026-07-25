/**
 * 章節圖片 API
 * 解密並返回章節的圖片列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/scraper/providers';
import { CacheHeaders } from '@/lib/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bid: string; cid: string }> }
) {
  const { bid, cid } = await params;

  if (!bid || !bid.trim() || !cid || !cid.trim()) {
    return NextResponse.json(
      { success: false, error: 'Invalid manga or chapter ID' },
      { status: 400 }
    );
  }

  try {
    const chapterImages = await getProvider().getChapterImages(bid, cid);

    if (!chapterImages) {
      return NextResponse.json(
        { success: false, error: 'Failed to decrypt chapter data' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: chapterImages },
      { headers: { 'Cache-Control': CacheHeaders.CHAPTER } }
    );
  } catch (error) {
    console.error('Chapter error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
}
