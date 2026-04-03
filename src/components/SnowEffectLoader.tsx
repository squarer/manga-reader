'use client';

import dynamic from 'next/dynamic';

const SnowEffect = dynamic(
  () => import('@/components/SnowEffect').then((m) => ({ default: m.SnowEffect })),
  { ssr: false }
);

export function SnowEffectLoader() {
  return <SnowEffect />;
}
