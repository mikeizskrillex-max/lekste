'use server';

import { site } from '@/lib/config';
import { answers as answersSchema, type Answers } from '@/lib/questionnaire/schema';
import { supabaseServer } from '@/lib/supabase/server';
import {
  authErrorKey,
  emailOnlyInput,
  newPasswordInput,
  safeNext,
  signInInput,
  signUpInput,
  type AuthErrorKey,
} from './schemas';

export type AuthResult = { ok: true } | { ok: false; error: AuthErrorKey };

const prefix = (locale: string) => (locale === 'ru' ? '/ru' : '');
/** Links in e-mails open /api/auth/confirm with a token_hash — works on any device, not only the one that asked. */
const confirmUrl = (next: string) => `${site.url}/api/auth/confirm?next=${encodeURIComponent(next)}`;
const firstError = (issues: { message: string }[]): AuthErrorKey => (issues[0]?.message as AuthErrorKey) ?? 'unknown';

export async function signUp(input: { email: string; password: string; locale: string }): Promise<AuthResult> {
  const v = signUpInput.safeParse(input);
  if (!v.success) return { ok: false, error: firstError(v.error.issues) };
  const db = await supabaseServer();
  if (!db) return { ok: false, error: 'unavailable' };
  const { error } = await db.auth.signUp({
    email: v.data.email,
    password: v.data.password,
    options: {
      emailRedirectTo: confirmUrl(`${prefix(input.locale)}/paskyra`),
      data: { locale: input.locale === 'ru' ? 'ru' : 'lt' },
    },
  });
  // an already registered e-mail gets the same answer, so nobody can probe who has an account
  if (error && authErrorKey(error) !== 'userExists') return { ok: false, error: authErrorKey(error) };
  return { ok: true };
}

export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  const v = signInInput.safeParse(input);
  if (!v.success) return { ok: false, error: firstError(v.error.issues) };
  const db = await supabaseServer();
  if (!db) return { ok: false, error: 'unavailable' };
  const { error } = await db.auth.signInWithPassword(v.data);
  return error ? { ok: false, error: authErrorKey(error) } : { ok: true };
}

export async function sendMagicLink(input: { email: string; locale: string; next?: string }): Promise<AuthResult> {
  const v = emailOnlyInput.safeParse(input);
  if (!v.success) return { ok: false, error: firstError(v.error.issues) };
  const db = await supabaseServer();
  if (!db) return { ok: false, error: 'unavailable' };
  const { error } = await db.auth.signInWithOtp({
    email: v.data.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: confirmUrl(safeNext(input.next, `${prefix(input.locale)}/paskyra`)),
    },
  });
  // same answer whether the e-mail has an account or not
  if (error && authErrorKey(error) === 'rateLimited') return { ok: false, error: 'rateLimited' };
  return { ok: true };
}

export async function requestPasswordReset(input: { email: string; locale: string }): Promise<AuthResult> {
  const v = emailOnlyInput.safeParse(input);
  if (!v.success) return { ok: false, error: firstError(v.error.issues) };
  const db = await supabaseServer();
  if (!db) return { ok: false, error: 'unavailable' };
  const { error } = await db.auth.resetPasswordForEmail(v.data.email, {
    redirectTo: confirmUrl(`${prefix(input.locale)}/slaptazodis/naujas`),
  });
  if (error && authErrorKey(error) === 'rateLimited') return { ok: false, error: 'rateLimited' };
  return { ok: true };
}

export async function setNewPassword(input: { password: string; repeat: string }): Promise<AuthResult> {
  const v = newPasswordInput.safeParse(input);
  if (!v.success) return { ok: false, error: firstError(v.error.issues) };
  const db = await supabaseServer();
  if (!db) return { ok: false, error: 'unavailable' };
  const { error } = await db.auth.updateUser({ password: v.data.password });
  return error ? { ok: false, error: authErrorKey(error) } : { ok: true };
}

export async function signOut(): Promise<void> {
  const db = await supabaseServer();
  await db?.auth.signOut();
}

/** Google sign-in: returns the URL to send the browser to (PKCE verifier is kept in a cookie). */
export async function googleSignInUrl(input: {
  locale: string;
  next?: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: AuthErrorKey }> {
  const db = await supabaseServer();
  if (!db) return { ok: false, error: 'unavailable' };
  const next = safeNext(input.next, `${prefix(input.locale)}/paskyra`);
  const { data, error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${site.url}/api/auth/callback?next=${encodeURIComponent(next)}`,
      skipBrowserRedirect: true,
    },
  });
  return error || !data.url ? { ok: false, error: authErrorKey(error) } : { ok: true, url: data.url };
}

/** Saves the questionnaire to the account. Records the health-data consent given in the questionnaire. */
export async function saveQuestionnaire(raw: unknown): Promise<AuthResult> {
  const v = answersSchema.safeParse(raw);
  if (!v.success) return { ok: false, error: 'unknown' };
  const db = await supabaseServer();
  if (!db) return { ok: false, error: 'unavailable' };
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return { ok: false, error: 'invalidCredentials' };
  const consent = await db.from('profiles').update({ health_consent_at: v.data.consentAt }).eq('id', auth.user.id);
  if (consent.error) return { ok: false, error: 'unknown' };
  const { error } = await db.from('questionnaires').upsert({ user_id: auth.user.id, answers: v.data });
  return error ? { ok: false, error: 'unknown' } : { ok: true };
}

export async function loadQuestionnaire(): Promise<Answers | null> {
  const db = await supabaseServer();
  if (!db) return null;
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return null;
  const { data } = await db.from('questionnaires').select('answers').eq('user_id', auth.user.id).maybeSingle();
  const parsed = answersSchema.safeParse(data?.answers);
  return parsed.success ? parsed.data : null;
}
