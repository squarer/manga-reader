import { cache } from 'react';
import type { Metadata } from 'next';
import { fetchMangaDetail, parseMangaDetail } from '@/lib/scraper';
import type { MangaInfo } from '@/lib/scraper/types';
import { getProxiedImageUrl } from '@/lib/image-utils';
import MangaDetailContent from './MangaDetailContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * 使用 React.cache 讓 generateMetadata 與 MangaDetailPage 共享同一次爬取結果
 */
const getMangaData = cache(async (mangaId: number): Promise<MangaInfo | null> => {
  try {
    const html = await fetchMangaDetail(mangaId);
    return parseMangaDetail(html, mangaId);
  } catch (err) {
    console.error('getMangaData failed:', err);
    return null;
  }
});

/**
 * 動態生成頁面 metadata（漫畫名稱作為 title）
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const mangaId = parseInt(id, 10);

  if (isNaN(mangaId)) {
    return { title: '漫畫詳情' };
  }

  const manga = await getMangaData(mangaId);
  if (!manga) {
    return { title: '漫畫詳情' };
  }

  const description = manga.description || `閱讀 ${manga.name}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const coverUrl = `${baseUrl}${getProxiedImageUrl(manga.cover)}`;

  return {
    title: manga.name,
    description,
    openGraph: {
      title: manga.name,
      description,
      images: [{ url: coverUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title: manga.name,
      description,
      images: [coverUrl],
    },
  };
}

/**
 * 漫畫詳情頁（Server Component）
 * Server 取得資料後透過 initialData 傳入 Client Component，避免 Client 端重複請求
 */
export default async function MangaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const mangaId = parseInt(id, 10);

  const initialData = isNaN(mangaId) ? null : await getMangaData(mangaId);

  return <MangaDetailContent id={id} initialData={initialData} />;
}
