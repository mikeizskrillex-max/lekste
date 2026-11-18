import type { ReactNode } from 'react';
import { NormAside } from './norm-aside';

/** Form card on the left, the norm on the right (phones: the norm below, compact). */
export function AuthLayout({
  title,
  lead,
  children,
  aside = true,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
  aside?: boolean;
}) {
  return (
    <section className="mx-auto grid max-w-5xl gap-6 px-4 pt-10 pb-24 md:grid-cols-2 md:gap-10 md:px-6 md:pt-16">
      <div className="rounded-card bg-surface shadow-card ring-line p-6 ring-1 md:p-8">
        <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
        {lead && <p className="text-muted mt-2">{lead}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {aside && <NormAside />}
    </section>
  );
}
