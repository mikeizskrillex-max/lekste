import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/server/session';
import { supabaseServer } from '@/server/supabase';

export async function POST() {
  const sb = supabaseServer();
  if (sb) await sb.auth.signOut();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
