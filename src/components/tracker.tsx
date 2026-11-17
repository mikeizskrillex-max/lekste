'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { track } from '@/lib/track';

/**
 * Sends a page view on every route change, and a click event for any element
 * marked data-track="cta_plan" | "cta_month" (data-track-place says which button).
 */
export function PageTracker() {
  const path = usePathname();
  useEffect(() => { track('pageview'); }, [path]);
  useEffect(() => {
    const on = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-track]');
      const name = el?.dataset.track;
      if (name === 'cta_plan' || name === 'cta_month') track(name, el?.dataset.trackPlace);
    };
    document.addEventListener('click', on, true);
    return () => document.removeEventListener('click', on, true);
  }, []);
  return null;
}
