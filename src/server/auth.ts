import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySession } from './session';
import { supabaseServer } from './supabase';

export interface Viewer { id: string; email: string; role: 'user' | 'admin'; mode: 'supabase' | 'dev' }

/** Current signed-in user on the server (route handlers, server components). */
export async function getViewer(): Promise<Viewer | null> {
  const sb = supabaseServer();
  if (sb) {
    const { data } = await sb.auth.getUser();
    const u = data.user;
    if (!u) return null;
    return { id: u.id, email: u.email ?? '', role: u.app_metadata?.role === 'admin' ? 'admin' : 'user', mode: 'supabase' };
  }
  const s = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  return s ? { id: `dev:${s.email}`, email: s.email, role: s.role, mode: 'dev' } : null;
}
