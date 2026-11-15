'use client';
import { createBrowserClient } from '@supabase/ssr';

export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return url && anon ? createBrowserClient(url, anon) : null;
}
