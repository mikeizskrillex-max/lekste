'use client';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/config/supabasePublic';
import { createBrowserClient } from '@supabase/ssr';

export function supabaseBrowser() {
  const url = SUPABASE_URL;
  const anon = SUPABASE_PUBLISHABLE_KEY;
  return url && anon ? createBrowserClient(url, anon) : null;
}
