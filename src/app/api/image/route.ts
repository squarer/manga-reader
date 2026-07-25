/**
 * 圖片代理 API
 * 繞過防盜鏈獲取漫畫圖片
 * 允許網域與 Referer 由各 provider 的 imageProxy 設定提供，單一來源。
 */

import { NextRequest, NextResponse } from 'next/server';
import { allProviders } from '@/lib/scraper/providers';
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
    const urlObj = new URL(url);

    // SSRF 防護：僅允許 HTTPS protocol
    if (urlObj.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'Only HTTPS protocol is allowed' },
        { status: 400 }
      );
    }

    // 從 provider registry 找出命中的 provider（決定 Referer）
    const providers = allProviders();
    const matchedProvider = providers.find((p) =>
      p.imageProxy.allowedDomains.some(
        (domain) =>
          urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      )
    );

    if (!matchedProvider) {
      return NextResponse.json(
        { error: 'Domain not allowed' },
        { status: 403 }
      );
    }

    const { refererBuilder, referer } = matchedProvider.imageProxy;
    const resolvedReferer = refererBuilder ? refererBuilder(url) : referer;

    const { data, contentType } = await fetchImage(url, resolvedReferer);

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
