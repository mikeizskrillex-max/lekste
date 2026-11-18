import type { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { ChatgptTable } from '@/components/home/chatgpt-table';
import { FinalCta } from '@/components/home/final-cta';
import { Hero } from '@/components/home/hero';
import { How } from '@/components/home/how';
import { Pains } from '@/components/home/pains';
import { PriceDemo } from '@/components/home/price-demo';
import { Pricing } from '@/components/home/pricing';
import { Why } from '@/components/home/why';

/** Home (SPEC §13). The live menu demo and real basket totals join in phases 7–8. */
export default function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return (
    <>
      <Hero />
      <Pains />
      <How />
      <Why />
      <PriceDemo />
      <ChatgptTable />
      <Pricing />
      <FinalCta />
    </>
  );
}
