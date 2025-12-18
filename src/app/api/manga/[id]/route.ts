/**
 * 漫畫詳情 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchMangaDetail, parseMangaDetail } from '@/lib/scraper';

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

    return NextResponse.json({
      success: true,
      data: manga,
    });
  } catch (error) {
    console.error('Manga detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch manga detail' },
      { status: 500 }
    );
  }
}
