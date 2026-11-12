import type { Metadata } from 'next';
import { LegalPage } from '@/components/pages';
import { PublicPage } from '@/components/site';

export const metadata: Metadata = { title: 'Naudojimo sąlygos', alternates: { canonical: '/terms' } };

export default function Page() {
  return <PublicPage><LegalPage kind="terms" /></PublicPage>;
}
