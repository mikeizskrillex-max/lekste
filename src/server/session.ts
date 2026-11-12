/**
 * Development-mode session (used only when Supabase is not configured).
 * A small HMAC-signed cookie, verifiable in middleware (Web Crypto works on the
 * edge and in Node). With Supabase configured, Supabase Auth sessions are used.
 */
export const SESSION_COOKIE = 'lk_session';
export interface DevSession { email: string; role: 'user' | 'admin'; exp: number }

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
    // a missing secret in production must never fall back silently
    console.error('SESSION_SECRET is not set: development sessions are disabled');
    return '';
  }
  return 'lekste-dev-only-secret';
}

const enc = new TextEncoder();
const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

export async function signSession(s: Omit<DevSession, 'exp'>, days = 30): Promise<string> {
  if (!secret()) throw new Error('SESSION_SECRET missing');
  const body = b64(enc.encode(JSON.stringify({ ...s, exp: Date.now() + days * 86400000 })));
  return `${body}.${await hmac(body)}`;
}

export async function verifySession(token: string | undefined): Promise<DevSession | null> {
  if (!token || !secret()) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = await hmac(body);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff) return null;
  try {
    const s = JSON.parse(new TextDecoder().decode(unb64(body))) as DevSession;
    return s.exp > Date.now() ? s : null;
  } catch { return null; }
}
