'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useModes } from '@/app/providers';
import { useI18n } from '@/i18n/I18nProvider';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useStore } from '@/state/store';
import { Button, ButtonLink, Card, Container, Field, inputCls } from './ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Development-mode sign-in shared by login and checkout. */
export async function devSignIn(email: string, role: 'user' | 'admin' = 'user', passphrase?: string): Promise<boolean> {
  const r = await fetch('/api/dev/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, role, passphrase }) });
  return r.ok;
}

export function LoginForm() {
  const { t } = useI18n();
  const modes = useModes();
  const store = useStore();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') ?? '/app';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/app';
  const wantsAdmin = sp.get('admin') === '1';
  const [email, setEmail] = useState(store.answers.email || '');
  const [pass, setPass] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error' | 'badpass'>(sp.get('error') ? 'error' : 'idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) { setState('error'); return; }
    setState('busy');
    if (modes.supabase) {
      const sb = supabaseBrowser();
      const { error } = await sb!.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}` } });
      setState(error ? 'error' : 'sent');
      return;
    }
    const role = wantsAdmin ? 'admin' : 'user';
    if (await devSignIn(email, role, pass)) { store.login(email, role); router.push(safeNext); router.refresh(); }
    else setState(wantsAdmin ? 'badpass' : 'error');
  };

  return (
    <Container className="grid min-h-[70vh] place-items-center py-12">
      <Card className="w-full max-w-[440px] p-6 md:p-8">
        <h1 className="font-display text-[28px] font-extrabold">{wantsAdmin ? t('adminLogin') : t('loginTitle')}</h1>
        <p className="mt-2 text-[15px] text-muted">{modes.supabase ? t('loginSub') : t('devLoginNote')}</p>
        {state === 'sent' ? (
          <p className="mt-6 rounded-2xl bg-sage p-4 font-semibold text-forest">✓ {t('linkSent')}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Field label={t('emailField')}><input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
            {wantsAdmin && !modes.supabase && <Field label={t('passphrase')} hint="DEV_ADMIN_PASSPHRASE"><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className={inputCls} /></Field>}
            {state === 'error' && <p className="text-[13.5px] text-danger">{t('emailInvalid')}</p>}
            {state === 'badpass' && <p className="text-[13.5px] text-danger">{t('wrongPass')}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={state === 'busy'}>{modes.supabase ? t('sendLink') : t('devLogin')}</Button>
          </form>
        )}
        <p className="mt-6 text-center text-[14px] text-muted">{t('registerSub')} <a href="/onboarding" className="font-semibold text-leaf">{t('startOnboarding')} →</a></p>
      </Card>
    </Container>
  );
}

export function RegisterCard() {
  const { t } = useI18n();
  return (
    <Container className="grid min-h-[70vh] place-items-center py-12">
      <Card className="w-full max-w-[440px] p-6 text-center md:p-8">
        <h1 className="font-display text-[28px] font-extrabold">{t('register')}</h1>
        <p className="mt-3 text-[15px] text-muted">{t('registerSub')}</p>
        <ButtonLink href="/onboarding" size="lg" className="mt-6 w-full">{t('ctaCreate')} →</ButtonLink>
        <ButtonLink href="/login" variant="ghost" className="mt-2 w-full">{t('login')}</ButtonLink>
      </Card>
    </Container>
  );
}
