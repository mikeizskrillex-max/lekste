import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { RecipePage } from '@/components/app/recipe';
import { PublicPage } from '@/components/site';
import { Container } from '@/components/ui';
import { SITE_URL } from '@/config/env';
import { INGREDIENT_BY_ID } from '@/data/ingredients';
import { getDetail } from '@/data/recipeDetails';
import { RECIPE_BY_ID } from '@/data/recipeIndex';
import { recipeImage } from '@/data/recipes';
import { recipeFacts } from '@/domain/recipeFacts';

const MEAL_LT: Record<string, string> = { breakfast: 'Pusryčiai', lunch: 'Pietūs', dinner: 'Vakarienė', snack: 'Užkandis' };
const CUISINE_LT: Record<string, string> = { home: 'Naminė', mediterranean: 'Viduržemio jūros', italian: 'Itališka', asian: 'Azijietiška', georgian: 'Gruziniška' };

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const r = RECIPE_BY_ID[decodeURIComponent(params.id)];
  if (!r) return { title: 'Receptas' };
  const f = recipeFacts(r);
  return {
    title: r.lt,
    description: `${r.lt}: ${Math.round(f.kcal)} kcal, ${Math.round(f.protein)} g baltymų porcijai. Receptas žingsnis po žingsnio ir kur ingredientus pigiausia nupirkti.`,
    openGraph: { images: [recipeImage(r.id)], type: 'article' },
    alternates: { canonical: `/recipe/${r.id}` },
  };
}

/** Public recipe page: how to cook + what to buy and where; schema.org/Recipe for search engines. */
export default function Page({ params, searchParams }: { params: { id: string }; searchParams: { back?: string } }) {
  const id = decodeURIComponent(params.id);
  const r = RECIPE_BY_ID[id];
  if (!r) notFound();
  const back = searchParams.back?.startsWith('/') && !searchParams.back.startsWith('//') ? searchParams.back : '/recipes';
  const f = recipeFacts(r);
  const d = getDetail(id);
  const steps = d ? d.steps.map((s) => s[2]) : r.stepsLt;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.lt,
    image: [`${SITE_URL}${recipeImage(r.id)}`],
    inLanguage: 'lt',
    recipeCategory: MEAL_LT[r.meal],
    recipeCuisine: CUISINE_LT[r.cuisine],
    recipeYield: '1 porcija',
    prepTime: `PT${d?.prep ?? 5}M`,
    cookTime: `PT${d?.cook ?? Math.max(0, r.minutes - 5)}M`,
    totalTime: `PT${d ? d.prep + d.cook : r.minutes}M`,
    recipeIngredient: r.items.map(([ing, g]) => `${g} g ${INGREDIENT_BY_ID[ing]?.lt.toLowerCase() ?? ing}`),
    recipeInstructions: steps.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
    nutrition: {
      '@type': 'NutritionInformation',
      calories: `${Math.round(f.kcal)} kcal`,
      proteinContent: `${Math.round(f.protein)} g`,
      fatContent: `${Math.round(f.fat)} g`,
      carbohydrateContent: `${Math.round(f.carbs)} g`,
      fiberContent: `${Math.round(f.fiber)} g`,
    },
  };
  return (
    <PublicPage>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Container className="max-w-[1080px] py-8"><Suspense><RecipePage id={id} backHref={back} /></Suspense></Container>
    </PublicPage>
  );
}
