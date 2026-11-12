import { notFound } from 'next/navigation';
import { DayPage } from '@/components/app/menu';

export default function Page({ params }: { params: { day: string } }) {
  const day = Number(params.day);
  if (!Number.isInteger(day) || day < 0 || day > 6) notFound();
  return <DayPage day={day} />;
}
