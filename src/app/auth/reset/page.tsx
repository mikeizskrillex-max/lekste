import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth';
import { PublicPage } from '@/components/site';

export const metadata: Metadata = { title: 'Naujas slaptažodis', robots: { index: false } };

export default function Page() {
  return <PublicPage><ResetPasswordForm /></PublicPage>;
}
