import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth';
import { PublicPage } from '@/components/site';

export const metadata: Metadata = { title: 'Sukurti paskyrą', robots: { index: false } };

export default function Page() {
  return <PublicPage><Suspense><RegisterForm /></Suspense></PublicPage>;
}
