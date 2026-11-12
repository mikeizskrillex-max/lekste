import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RecipePage } from '@/components/app/recipe';
import { PublicPage } from '@/components/site';
import { Container } from '@/components/ui';
import { RECIPE_BY_ID } from '@/data/recipeIndex';
import { recipeImage } from '@/data/recipes';

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const r = RECIPE_BY_ID[decodeURIComponent(params.id)];
  if (!r) return { title: 'Receptas' };
  return { title: r.lt, description: `${r.lt} — receptas, ingredientai ir kur juos pigiausia nupirkti.`, openGraph: { images: [recipeImage(r.id)] }, alternates: { canonical: `/recipe/${r.id}` } };
}

/** Public recipe page: how to cook + what to buy and where. */
export default function Page({ params, searchParams }: { params: { id: string }; searchParams: { back?: string } }) {
  const id = decodeURIComponent(params.id);
  if (!RECIPE_BY_ID[id]) notFound();
  const back = searchParams.back?.startsWith('/') && !searchParams.back.startsWith('//') ? searchParams.back : '/onboarding/result';
  return <PublicPage><Container className="max-w-[1080px] py-8"><RecipePage id={id} backHref={back} /></Container></PublicPage>;
}
