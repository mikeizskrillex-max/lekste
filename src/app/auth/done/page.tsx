import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthDone } from '@/components/auth';
import { PublicPage } from '@/components/site';

export const metadata: Metadata = { title: 'Paskyra patvirtinta', robots: { index: false } };

export default function Page() {
  return <PublicPage><Suspense><AuthDone /></Suspense></PublicPage>;
}
