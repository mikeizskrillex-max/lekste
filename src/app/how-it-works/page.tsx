import type { Metadata } from 'next';
import { HowItWorksPage } from '@/components/pages';
import { PublicPage } from '@/components/site';

export const metadata: Metadata = { title: 'Kaip veikia', alternates: { canonical: '/how-it-works' } };

export default function Page() {
  return <PublicPage><HowItWorksPage /></PublicPage>;
}
