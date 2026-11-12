import { RecipePage } from '@/components/app/recipe';

export default function Page({ params }: { params: { id: string } }) {
  return <RecipePage id={decodeURIComponent(params.id)} />;
}
