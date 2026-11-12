import type { Metadata } from 'next';
import { RegisterCard } from '@/components/auth';
import { PublicPage } from '@/components/site';

export const metadata: Metadata = { title: 'Registruotis', robots: { index: false } };

export default function Page() {
  return <PublicPage><RegisterCard /></PublicPage>;
}
