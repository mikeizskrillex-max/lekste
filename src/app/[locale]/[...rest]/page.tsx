import { notFound } from 'next/navigation';

/** Any unknown path inside a language shows the localized 404. */
export default function CatchAll() {
  notFound();
}
