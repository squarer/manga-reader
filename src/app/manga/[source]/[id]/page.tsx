import { unstable_cache } from 'next/cache';
import type { Metadata } from 'next';
import { getProvider } from '@/lib/scraper/providers';
import type { MangaInfo } from '@/lib/scraper/types';
import MangaDetailContent from './MangaDetailContent';

interface PageProps {
  params: Promise<{ source: string; id: string }>;
}

/**
 * 跨請求快取漫畫詳情（30 分鐘）。
 * cacheKey 含 source，避免跨來源快取污染。
 * 爬取失敗直接拋出，讓 error.tsx boundary 接住。
 */
const getMangaData = unstable_cache(
  async (source: string, mangaId: string): Promise<MangaInfo | null> => {
    return getProvider(source).getMangaDetail(mangaId);
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
  const { source, id } = await params;

  const initialData = id && id.trim() ? await getMangaData(source, id) : null;

  return <MangaDetailContent source={source} id={id} initialData={initialData} />;
}
