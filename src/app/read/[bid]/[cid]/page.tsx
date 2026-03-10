import { cache } from 'react';
import type { Metadata } from 'next';
import {
  fetchChapterPage,
  fetchMangaDetail,
  decryptChapterPage,
  parseMangaDetail,
  buildImageUrl,
} from '@/lib/scraper';
import { computePrevNextCid } from '@/lib/chapter-utils';
import type { ChapterData } from '@/components/reader/types';
import ReaderContent from './ReaderContent';

interface PageProps {
  params: Promise<{ bid: string; cid: string }>;
}

/**
 * 使用 React.cache 讓 generateMetadata 與 ReadPage 共享同一次爬取結果
 * 邏輯與 /api/chapter/[bid]/[cid]/route.ts 對齊：並行抓章節與漫畫詳情，補齊 prevCid/nextCid
 */
const getChapterData = cache(async (mangaId: number, chapterId: number): Promise<ChapterData | null> => {
  try {
    const [chapterHtml, mangaHtml] = await Promise.all([
      fetchChapterPage(mangaId, chapterId),
      fetchMangaDetail(mangaId),
    ]);

    const imageData = decryptChapterPage(chapterHtml);
    if (!imageData) return null;

    const images = imageData.files.map((filename) =>
      buildImageUrl(imageData.path, filename, imageData.sl)
    );

    let prevCid: number | null = imageData.prevcid ?? null;
    let nextCid: number | null = imageData.nextcid ?? null;

    if (prevCid === null || nextCid === null) {
      const mangaInfo = parseMangaDetail(mangaHtml, mangaId);
      if (mangaInfo) {
        const allChapters = mangaInfo.chapters.flatMap((g) => g.chapters);
        const computed = computePrevNextCid(allChapters, chapterId);
        if (prevCid === null) prevCid = computed.prevCid;
        if (nextCid === null) nextCid = computed.nextCid;
      }
    }

    return {
      bid: imageData.bid,
      cid: imageData.cid,
      bname: imageData.bname,
      cname: imageData.cname,
      images,
      prevCid: prevCid ?? undefined,
      nextCid: nextCid ?? undefined,
      total: images.length,
    };
  } catch (err) {
    console.error('getChapterData failed:', err);
    return null;
  }
});

/**
 * 動態生成頁面 metadata（漫畫名 - 章節名）
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bid, cid } = await params;
  const mangaId = parseInt(bid, 10);
  const chapterId = parseInt(cid, 10);

  if (isNaN(mangaId) || isNaN(chapterId)) {
    return { title: '閱讀' };
  }

  const data = await getChapterData(mangaId, chapterId);
  if (!data) return { title: '閱讀' };

  return {
    title: `${data.bname} - ${data.cname}`,
    description: `閱讀 ${data.bname} ${data.cname}`,
  };
}

/**
 * 閱讀器頁面（Server Component）
 * Server 取得資料後透過 initialData 傳入 Client Component，避免 Client 端重複請求
 */
export default async function ReadPage({ params }: PageProps) {
  const { bid, cid } = await params;
  const mangaId = parseInt(bid, 10);
  const chapterId = parseInt(cid, 10);

  const initialData =
    isNaN(mangaId) || isNaN(chapterId) ? null : await getChapterData(mangaId, chapterId);

  return <ReaderContent bid={bid} cid={cid} initialData={initialData} />;
}
