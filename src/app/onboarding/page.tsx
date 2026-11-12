import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Onboarding } from '@/components/onboarding';

export const metadata: Metadata = { title: 'Anketa', robots: { index: false } };

export default function Page() {
  return <Suspense><Onboarding /></Suspense>;
}
