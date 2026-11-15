/**
 * Public Supabase connection values. Both are public by design (they are sent to
 * every browser); data is protected by row-level security in the database.
 * Environment variables override them; NEXT_PUBLIC_SUPABASE_URL=none turns
 * Supabase off (development mode, e.g. for the e2e suite).
 * Secret keys are NEVER stored in code.
 */
const OFF = process.env.NEXT_PUBLIC_SUPABASE_URL === 'none';
export const SUPABASE_URL = OFF ? '' : process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vqrdkpidfluzwnhkchxj.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = OFF
  ? ''
  : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_PcC77Yz3BWd9oSg5zqZr5w_LrMVPUdS';
