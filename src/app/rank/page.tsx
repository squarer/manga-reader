import type { Metadata } from 'next';
import RankContent from './RankContent';

export const metadata: Metadata = { title: '排行榜' };

export default function RankPage() {
  return <RankContent />;
}
