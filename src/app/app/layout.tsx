import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/appshell';

export const metadata: Metadata = { title: 'Paskyra', robots: { index: false } };

export default function Layout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
