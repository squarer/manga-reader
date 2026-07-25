import { unstable_cache } from 'next/cache';
import type { Metadata } from 'next';
import { getProvider } from '@/lib/scraper/providers';
import type { MangaInfo } from '@/lib/scraper/types';
import MangaDetailContent from './MangaDetailContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

/** 跨請求快取漫畫詳情（30 分鐘），避免每次 SSR 都重新爬取 */
const getMangaData = unstable_cache(
  async (mangaId: string): Promise<MangaInfo | null> => {
    try {
      return await getProvider().getMangaDetail(mangaId);
    } catch (err) {
      console.error('getMangaData failed:', err);
      return null;
    }
  },
  ['manga-detail'],
  { revalidate: 1800 }
);

/**
 * 靜態 metadata — 不 call scraper，避免阻塞 TTFB、讓 loading.tsx 立即 stream
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `漫畫 #${id}` };
}

/**
 * 漫畫詳情頁（Server Component）
 * Server 取得資料後透過 initialData 傳入 Client Component，避免 Client 端重複請求
 */
export default async function MangaDetailPage({ params }: PageProps) {
  const { id } = await params;

  const initialData = id && id.trim() ? await getMangaData(id) : null;

  return <MangaDetailContent id={id} initialData={initialData} />;
}
