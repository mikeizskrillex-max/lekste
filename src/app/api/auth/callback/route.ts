import { NextResponse, type NextRequest } from 'next/server';
import { safeNext } from '@/lib/auth/schemas';
import { supabaseServer } from '@/lib/supabase/server';

/** Google sign-in returns here with ?code=… (PKCE). */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));
  const failed = new URL(
    next.startsWith('/ru') ? '/ru/prisijungti?klaida=google' : '/prisijungti?klaida=google',
    url.origin,
  );
  if (!code) return NextResponse.redirect(failed);
  const db = await supabaseServer();
  if (!db) return NextResponse.redirect(failed);
  const { error } = await db.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(error ? failed : new URL(next, url.origin));
}
