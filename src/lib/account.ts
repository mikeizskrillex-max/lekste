'use client';

import { supabaseBrowser } from './supabaseBrowser';

/**
 * Email + password accounts. Supabase Auth when configured; in development mode a
 * signed dev-session cookie (password only checked for length — clearly a dev mode).
 */
export type AuthResult = { ok: true; needsConfirm?: boolean } | { ok: false; error: 'invalid' | 'exists' | 'weak' | 'network' | 'notConfirmed' };

const devLogin = async (email: string): Promise<AuthResult> => {
  const r = await fetch('/api/dev/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => null);
  return r?.ok ? { ok: true } : { ok: false, error: 'network' };
};

export async function signUp(email: string, password: string): Promise<AuthResult> {
  if (password.length < 8) return { ok: false, error: 'weak' };
  const sb = supabaseBrowser();
  if (!sb) return devLogin(email);
  const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback?next=/app` } });
  if (error) return { ok: false, error: /already|registered|exists/i.test(error.message) ? 'exists' : /password/i.test(error.message) ? 'weak' : 'network' };
  // existing confirmed users come back with no identities
  if (data.user && data.user.identities && data.user.identities.length === 0) return { ok: false, error: 'exists' };
  return data.session ? { ok: true } : { ok: true, needsConfirm: true };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const sb = supabaseBrowser();
  if (!sb) return password.length >= 8 ? devLogin(email) : { ok: false, error: 'invalid' };
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (!error) return { ok: true };
  return { ok: false, error: /confirm/i.test(error.message) ? 'notConfirmed' : /invalid/i.test(error.message) ? 'invalid' : 'network' };
}

export async function sendReset(email: string): Promise<boolean> {
  const sb = supabaseBrowser();
  if (!sb) return true;
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/auth/reset` });
  return !error;
}

export async function setNewPassword(password: string): Promise<boolean> {
  const sb = supabaseBrowser();
  if (!sb || password.length < 8) return false;
  const { error } = await sb.auth.updateUser({ password });
  return !error;
}

export async function signOut(): Promise<void> {
  const sb = supabaseBrowser();
  if (sb) await sb.auth.signOut();
  await fetch('/api/dev/logout', { method: 'POST' }).catch(() => null);
}
