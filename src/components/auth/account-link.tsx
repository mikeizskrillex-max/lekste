'use client';

import { UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';

/** Header: "Paskyra" when signed in, "Prisijungti" otherwise. Client-side so public pages stay static. */
export function AccountLink() {
  const t = useTranslations('nav');
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    const db = supabaseBrowser();
    if (!db) return;
    void db.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = db.auth.onAuthStateChange((_e, s) => setSignedIn(Boolean(s)));
    return () => data.subscription.unsubscribe();
  }, []);
  if (signedIn === null) return null;
  const label = signedIn ? t('account') : t('signIn');
  return (
    <Link
      href={signedIn ? '/paskyra' : '/prisijungti'}
      aria-label={label}
      className="text-ink/80 hover:bg-surface-2 hover:text-ink flex h-9 items-center gap-1.5 rounded-full px-3 text-[15px] font-medium"
    >
      <UserRound className="size-4" aria-hidden />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}
