import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Checkout } from '@/components/checkout';

export const metadata: Metadata = { title: 'Apmokėjimas', robots: { index: false } };

export default function Page() {
  return <Suspense><Checkout /></Suspense>;
}
