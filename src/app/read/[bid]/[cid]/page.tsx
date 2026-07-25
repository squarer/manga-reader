import { unstable_cache } from 'next/cache';
import type { Metadata } from 'next';
import { getProvider } from '@/lib/scraper/providers';
import type { ChapterData } from '@/components/reader/types';
import ReaderContent from './ReaderContent';

interface PageProps {
  params: Promise<{ bid: string; cid: string }>;
}

/** 跨請求快取章節資料（60 分鐘，對齊 CDN CHAPTER cache policy） */
const getChapterData = unstable_cache(
  async (bid: string, cid: string): Promise<ChapterData | null> => {
    try {
      const chapterImages = await getProvider().getChapterImages(bid, cid);
      if (!chapterImages) return null;

      return {
        bid: chapterImages.bid,
        cid: chapterImages.cid,
        bname: chapterImages.bname,
        cname: chapterImages.cname,
        images: chapterImages.images,
        prevCid: chapterImages.prevCid,
        nextCid: chapterImages.nextCid,
        total: chapterImages.total,
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

  const initialData =
    bid && bid.trim() && cid && cid.trim()
      ? await getChapterData(bid, cid)
      : null;

  return <ReaderContent bid={bid} cid={cid} initialData={initialData} />;
}
