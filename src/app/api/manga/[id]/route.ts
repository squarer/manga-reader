/**
 * 漫畫詳情 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/scraper/providers';
import { CacheHeaders } from '@/lib/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !id.trim()) {
    return NextResponse.json(
      { success: false, error: 'Invalid manga ID' },
      { status: 400 }
    );
  }

  try {
    const manga = await getProvider().getMangaDetail(id);

    if (!manga) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse manga detail' },
        { status: 500 }
      );
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
