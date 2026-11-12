import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth';
import { PublicPage } from '@/components/site';

export const metadata: Metadata = { title: 'Prisijungti', robots: { index: false } };

export default function Page() {
  return <PublicPage><Suspense><LoginForm /></Suspense></PublicPage>;
}
