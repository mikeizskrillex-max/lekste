import type { Metadata } from 'next';
import { LegalPage } from '@/components/pages';
import { PublicPage } from '@/components/site';

export const metadata: Metadata = { title: 'Privatumo politika', alternates: { canonical: '/privacy' } };

export default function Page() {
  return <PublicPage><LegalPage kind="privacy" /></PublicPage>;
}
