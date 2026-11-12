import type { Metadata } from 'next';
import { FaqPage } from '@/components/pages';
import { PublicPage } from '@/components/site';

export const metadata: Metadata = { title: 'D.U.K.', alternates: { canonical: '/faq' } };

export default function Page() {
  return <PublicPage><FaqPage /></PublicPage>;
}
