import type { Metadata } from 'next';
import FavoritesContent from './FavoritesContent';

export const metadata: Metadata = { title: '我的收藏' };

export default function FavoritesPage() {
  return <FavoritesContent />;
}
