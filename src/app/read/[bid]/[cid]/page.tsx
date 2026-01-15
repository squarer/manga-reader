import type { Metadata } from 'next';
import {
  fetchChapterPage,
  decryptChapterPage,
} from '@/lib/scraper';
import ReaderContent from './ReaderContent';

interface PageProps {
  params: Promise<{ bid: string; cid: string }>;
}

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

  try {
    const html = await fetchChapterPage(mangaId, chapterId);
    const data = decryptChapterPage(html);

    if (!data) {
      return { title: '閱讀' };
    }

    return {
      title: `${data.bname} - ${data.cname}`,
      description: `閱讀 ${data.bname} ${data.cname}`,
    };
  } catch {
    return { title: '閱讀' };
  }
}

/**
 * 閱讀器頁面（Server Component）
 */
export default async function ReadPage({ params }: PageProps) {
  const { bid, cid } = await params;
  return <ReaderContent bid={bid} cid={cid} />;
}
