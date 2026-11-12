import type { Metadata } from 'next';
import { SupermarketsPage } from '@/components/pages';
import { PublicPage } from '@/components/site';

export const metadata: Metadata = { title: 'Prekybos centrai', alternates: { canonical: '/supermarkets' } };

export default function Page() {
  return <PublicPage><SupermarketsPage /></PublicPage>;
}
