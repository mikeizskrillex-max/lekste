import type { Metadata } from 'next';
import { DemoPage } from '@/components/pages';
import { PublicPage } from '@/components/site';

export const metadata: Metadata = { title: 'Demonstracija', alternates: { canonical: '/demo' } };

export default function Page() {
  return <PublicPage><DemoPage /></PublicPage>;
}
