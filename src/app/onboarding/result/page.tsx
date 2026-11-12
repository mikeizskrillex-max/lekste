import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Result } from '@/components/onboarding';

export const metadata: Metadata = { title: 'Jūsų planas', robots: { index: false } };

export default function Page() {
  return <Suspense><Result /></Suspense>;
}
