import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TasteSwipe } from '@/components/taste';

export const metadata: Metadata = { title: 'Skonio testas', robots: { index: false } };

export default function Page() {
  return <Suspense><TasteSwipe /></Suspense>;
}
