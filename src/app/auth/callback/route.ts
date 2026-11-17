import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/server/supabase';

const TYPES: EmailOtpType[] = ['signup', 'email', 'recovery', 'invite', 'magiclink', 'email_change'];

/**
 * Every link in our emails lands here.
 *  - token_hash + type (our email templates): works on ANY device or mail app,
 *    e.g. registered on a laptop, opened the email on the phone.
 *  - code (Supabase default links): works only in the browser that asked for it.
 * Password reset → /auth/reset; everything else → /auth/done, which sends the
 * person on to where they were going (checkout, app…).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
  const sb = supabaseServer();
  const go = (path: string) => NextResponse.redirect(new URL(path, url.origin));

  if (sb && tokenHash && type && TYPES.includes(type)) {
    const { error } = await sb.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return go(type === 'recovery' ? '/auth/reset' : safeNext ?? '/auth/done');
    return go(`/login?error=${type === 'recovery' ? 'reset' : 'link'}`);
  }
  if (sb && code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return go(safeNext ?? '/auth/done');
  }
  return go('/login?error=link');
}
