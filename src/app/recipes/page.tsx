import type { Metadata } from 'next';
import { CatalogPage } from '@/components/catalog';
import { PublicPage } from '@/components/site';

export const metadata: Metadata = {
  title: 'Receptai',
  description: 'Daugiau nei 1 800 receptų iš Maxima (Barbora) ir Rimi produktų: kalorijos, baltymai, kaina porcijai ir kur pigiausia nupirkti.',
  alternates: { canonical: '/recipes' },
};

export default function Page() {
  return <PublicPage><CatalogPage /></PublicPage>;
}
