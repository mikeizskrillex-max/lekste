import { NextResponse } from 'next/server';
import { integrations } from '@/config/env';
import * as z from 'zod/v4';
import { audit } from '@/server/logs';
import { clientIp, rateLimit } from '@/server/rateLimit';
import { SESSION_COOKIE, signSession } from '@/server/session';

const Body = z.object({ email: z.email().max(200), role: z.enum(['user', 'admin']).default('user'), passphrase: z.string().max(200).optional() });

/** Development-mode sign-in. Disabled as soon as Supabase Auth is configured. */
export async function POST(req: Request) {
  if (integrations.supabase) return NextResponse.json({ error: 'disabled' }, { status: 404 });
  const rl = rateLimit(`devlogin:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { email, role, passphrase } = parsed.data;
  if (role === 'admin') {
    const expected = process.env.DEV_ADMIN_PASSPHRASE || (process.env.NODE_ENV !== 'production' ? 'lekste-admin' : '');
    if (!expected || passphrase !== expected) { await audit(null, 'admin_login_failed', null, { ip: clientIp(req) }); return NextResponse.json({ error: 'forbidden' }, { status: 403 }); }
  }
  const token = await signSession({ email: email.toLowerCase(), role });
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 30 * 86400 });
  if (role === 'admin') await audit(email, 'admin_login', null);
  return res;
}
