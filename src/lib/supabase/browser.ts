'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from './env';

/** Supabase client in the browser (row-level security applies). Null until Supabase is configured. */
export function supabaseBrowser() {
  return supabaseConfigured ? createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;
}
