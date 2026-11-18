import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { safeNext } from '@/lib/auth/schemas';
import { supabaseServer } from '@/lib/supabase/server';

const TYPES: readonly EmailOtpType[] = ['signup', 'magiclink', 'recovery', 'email_change', 'email', 'invite'];

/**
 * Links from e-mails: /api/auth/confirm?token_hash=…&type=signup&next=/paskyra.
 * token_hash works on any device and browser (v1 broke when the link was opened elsewhere).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = safeNext(url.searchParams.get('next'));
  const failed = new URL(
    next.startsWith('/ru') ? '/ru/prisijungti?klaida=nuoroda' : '/prisijungti?klaida=nuoroda',
    url.origin,
  );
  if (!tokenHash || !type || !TYPES.includes(type)) return NextResponse.redirect(failed);
  const db = await supabaseServer();
  if (!db) return NextResponse.redirect(failed);
  const { error } = await db.auth.verifyOtp({ type, token_hash: tokenHash });
  return NextResponse.redirect(error ? failed : new URL(next, url.origin));
}
