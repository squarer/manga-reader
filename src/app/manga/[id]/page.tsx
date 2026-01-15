import type { Metadata } from 'next';
import { fetchMangaDetail, parseMangaDetail } from '@/lib/scraper';
import MangaDetailContent from './MangaDetailContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * 動態生成頁面 metadata（漫畫名稱作為 title）
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const mangaId = parseInt(id, 10);

  if (isNaN(mangaId)) {
    return { title: '漫畫詳情' };
  }

  try {
    const html = await fetchMangaDetail(mangaId);
    const manga = parseMangaDetail(html, mangaId);

    if (!manga) {
      return { title: '漫畫詳情' };
    }

    return {
      title: manga.name,
      description: manga.description || `閱讀 ${manga.name}`,
    };
  } catch {
    return { title: '漫畫詳情' };
  }
}

/**
 * 漫畫詳情頁（Server Component）
 */
export default async function MangaDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <MangaDetailContent id={id} />;
}
