import type { Metadata } from 'next';
import HistoryContent from './HistoryContent';

export const metadata: Metadata = { title: '閱讀歷史' };

export default function HistoryPage() {
  return <HistoryContent />;
}
