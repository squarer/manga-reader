import type { Metadata } from 'next';
import UpdateContent from './UpdateContent';

export const metadata: Metadata = { title: '最新更新' };

export default function UpdatePage() {
  return <UpdateContent />;
}
