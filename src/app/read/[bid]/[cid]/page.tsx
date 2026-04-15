import { unstable_cache } from 'next/cache';
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

/** 跨請求快取章節資料（60 分鐘，對齊 CDN CHAPTER cache policy） */
const getChapterData = unstable_cache(
  async (mangaId: number, chapterId: number): Promise<ChapterData | null> => {
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
  },
  ['chapter-data'],
  { revalidate: 3600 }
);

/**
 * 靜態 metadata — 不 call scraper，避免阻塞 TTFB、讓 loading.tsx 立即 stream
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bid, cid } = await params;
  return { title: `閱讀 #${bid} - ${cid}` };
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
