import { z } from 'zod';

/** One set of rules for the forms and the server actions. Messages are i18n keys under "auth.errors". */
export const email = z.string().trim().toLowerCase().email('email').max(254, 'email');
export const password = z.string().min(8, 'passwordShort').max(72, 'passwordLong');

export const signUpInput = z.object({ email, password });
export const signInInput = z.object({ email, password: z.string().min(1, 'passwordRequired').max(72) });
export const emailOnlyInput = z.object({ email });
export const newPasswordInput = z
  .object({ password, repeat: z.string() })
  .refine((v) => v.password === v.repeat, { message: 'passwordMismatch', path: ['repeat'] });

/** Only same-site paths are allowed after sign-in ("/paskyra", "/ru/paskyra"), never another domain. */
export function safeNext(next: string | null | undefined, fallback = '/paskyra'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback;
  return next;
}

export type AuthErrorKey =
  | 'email'
  | 'passwordShort'
  | 'passwordLong'
  | 'passwordRequired'
  | 'passwordMismatch'
  | 'invalidCredentials'
  | 'emailNotConfirmed'
  | 'userExists'
  | 'rateLimited'
  | 'unavailable'
  | 'unknown';

/** Supabase error → our message key. Messages never reveal whether an e-mail is registered (except sign-up). */
export function authErrorKey(err: { message?: string; code?: string; status?: number } | null): AuthErrorKey {
  if (!err) return 'unknown';
  const code = err.code ?? '';
  const msg = (err.message ?? '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login')) return 'invalidCredentials';
  if (code === 'email_not_confirmed' || msg.includes('not confirmed')) return 'emailNotConfirmed';
  if (code === 'user_already_exists' || msg.includes('already registered')) return 'userExists';
  if (err.status === 429 || code.includes('rate_limit') || msg.includes('rate limit')) return 'rateLimited';
  if (code === 'weak_password') return 'passwordShort';
  return 'unknown';
}
