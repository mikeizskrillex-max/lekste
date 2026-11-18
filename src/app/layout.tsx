import type { ReactNode } from 'react';
import './globals.css';

/** The html/body live in app/[locale]/layout.tsx; this root only forwards children. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
