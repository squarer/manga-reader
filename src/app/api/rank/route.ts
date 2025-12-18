/**
 * 排行榜 API
 *
 * 支援參數：
 * - type: 排行榜類型（day/week/month/total，預設 day）
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchRankList, parseRankList, RankTypeEnum } from '@/lib/scraper';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get('type') || 'day') as RankTypeEnum;

  // 驗證 type 參數
  const validTypes = ['day', 'week', 'month', 'total'];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
      },
      { status: 400 }
    );
  }

  try {
    const html = await fetchRankList();
    const rankData = parseRankList(html);

    // 根據請求的 type 回傳對應資料
    const items = rankData[type as keyof typeof rankData];

    return NextResponse.json({
      success: true,
      data: {
        type,
        items,
        // 同時回傳所有類型的資料供前端快取
        all: rankData,
      },
    });
  } catch (error) {
    console.error('Rank list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch rank list',
      },
      { status: 500 }
    );
  }
}
