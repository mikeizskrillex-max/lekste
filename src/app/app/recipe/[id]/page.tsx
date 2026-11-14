import { Suspense } from 'react';
import { RecipePage } from '@/components/app/recipe';

export default function Page({ params }: { params: { id: string } }) {
  return <Suspense><RecipePage id={decodeURIComponent(params.id)} /></Suspense>;
}
