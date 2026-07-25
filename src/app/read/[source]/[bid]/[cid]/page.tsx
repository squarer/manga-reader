import { unstable_cache } from 'next/cache';
import type { Metadata } from 'next';
import { getProvider } from '@/lib/scraper/providers';
import type { ChapterData } from '@/components/reader/types';
import ReaderContent from './ReaderContent';

interface PageProps {
  params: Promise<{ source: string; bid: string; cid: string }>;
}

/**
 * 跨請求快取章節資料（60 分鐘，對齊 CDN CHAPTER cache policy）。
 * cacheKey 含 source，避免跨來源快取污染。
 * 爬取失敗直接拋出，讓 error.tsx boundary 接住。
 */
const getChapterData = unstable_cache(
  async (source: string, bid: string, cid: string): Promise<ChapterData | null> => {
    const chapterImages = await getProvider(source).getChapterImages(bid, cid);
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
      source: chapterImages.source,
      mangaCover: chapterImages.mangaCover,
    };
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
  const { source, bid, cid } = await params;

  const initialData =
    bid && bid.trim() && cid && cid.trim()
      ? await getChapterData(source, bid, cid)
      : null;

  return <ReaderContent source={source} bid={bid} cid={cid} initialData={initialData} />;
}
