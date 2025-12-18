/**
 * 圖片代理 API
 * 繞過防盜鏈獲取漫畫圖片
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchImage } from '@/lib/scraper';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  try {
    // 驗證 URL 是否來自允許的域名
    const allowedDomains = [
      'i.hamreus.com',
      'us.hamreus.com',
      'eu.hamreus.com',
      'cf.mhgui.com',
      'cf2.mhgui.com',
    ];

    const urlObj = new URL(url);
    if (!allowedDomains.some((domain) => urlObj.hostname.includes(domain))) {
      return NextResponse.json(
        { error: 'Domain not allowed' },
        { status: 403 }
      );
    }

    const { data, contentType } = await fetchImage(url);

    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 快取 1 天
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
