import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/config/supabasePublic';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/server/session';

/** Protects /app and /admin. Supabase sessions when configured, signed dev cookie otherwise. */
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const needsAdmin = path.startsWith('/admin') || path.startsWith('/api/admin');
  let res = NextResponse.next({ request: req });
  let role: 'user' | 'admin' | null = null;

  const url = SUPABASE_URL;
  const anon = SUPABASE_PUBLISHABLE_KEY;
  if (url && anon) {
    const sb = createServerClient(url, anon, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await sb.auth.getUser();
    if (data.user) role = data.user.app_metadata?.role === 'admin' ? 'admin' : 'user';
  } else {
    const s = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (s) role = s.role;
  }

  if (!role || (needsAdmin && role !== 'admin')) {
    if (path.startsWith('/api/')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const to = req.nextUrl.clone();
    to.pathname = needsAdmin && role ? '/app' : '/login';
    to.search = `?next=${encodeURIComponent(path)}${needsAdmin ? '&admin=1' : ''}`;
    return NextResponse.redirect(to);
  }
  return res;
}

export const config = { matcher: ['/app/:path*', '/admin/:path*', '/api/admin/:path*'] };
