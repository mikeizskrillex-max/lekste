import type { Metadata } from 'next';
import { PricingPage } from '@/components/pages';
import { PublicPage } from '@/components/site';

export const metadata: Metadata = { title: 'Kainos', alternates: { canonical: '/pricing' } };

export default function Page() {
  return <PublicPage><PricingPage /></PublicPage>;
}
