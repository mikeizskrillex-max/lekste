import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Success } from '@/components/checkout';

export const metadata: Metadata = { title: 'Ačiū', robots: { index: false } };

export default function Page() {
  return <Suspense><Success /></Suspense>;
}
