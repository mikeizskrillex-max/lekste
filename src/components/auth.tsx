'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useModes } from '@/app/providers';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { sendReset, setNewPassword, signIn, signUp, type AuthResult } from '@/lib/account';
import { useStore } from '@/state/store';
import { Button, Card, Container, Field, inputCls } from './ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const safe = (n: string | null, d: string) => (n && n.startsWith('/') && !n.startsWith('//') ? n : d);

/** Development-mode sign-in kept for the checkout test flow. */
export async function devSignIn(email: string, role: 'user' | 'admin' = 'user', passphrase?: string): Promise<boolean> {
  const r = await fetch('/api/dev/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, role, passphrase }) });
  return r.ok;
}

function PasswordInput({ value, onChange, autoComplete }: { value: string; onChange: (v: string) => void; autoComplete: string }) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} pr-20`} minLength={8} required />
      <button type="button" onClick={() => setShow((x) => !x)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[12.5px] font-semibold text-leaf">{show ? t('hide') : t('show')}</button>
    </div>
  );
}

const ERR: Record<Exclude<AuthResult, { ok: true }>['error'], MessageKey> = { invalid: 'errInvalid', exists: 'errExists', weak: 'errWeak', network: 'errNetwork', notConfirmed: 'errNotConfirmed' };

/** Create an account (email + password). Used after the questionnaire to save the plan. */
export function RegisterForm() {
  const { t } = useI18n();
  const store = useStore();
  const router = useRouter();
  const sp = useSearchParams();
  const next = safe(sp.get('next'), store.onboarded ? '/checkout' : '/onboarding');
  const [email, setEmail] = useState(store.answers.email || '');
  const [pw, setPw] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'confirm'>('idle');
  const [err, setErr] = useState<MessageKey | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) { setErr('emailInvalid'); return; }
    setState('busy'); setErr(null);
    const r = await signUp(email.trim().toLowerCase(), pw);
    if (!r.ok) { setErr(ERR[r.error]); setState('idle'); return; }
    store.setAnswers({ email });
    store.login(email);
    if (r.needsConfirm) { setState('confirm'); return; }
    router.push(next); router.refresh();
  };
  return (
    <Container className="grid min-h-[70vh] place-items-center py-10">
      <Card className="w-full max-w-[440px] p-6 md:p-8">
        <h1 className="font-display text-[28px] font-extrabold">{t('createAccount')}</h1>
        <p className="mt-2 text-[15px] text-muted">{store.onboarded ? t('createAccountSubPlan') : t('createAccountSub')}</p>
        {state === 'confirm' ? (
          <p className="mt-6 rounded-2xl bg-sage p-4 font-semibold text-forest">✉ {t('confirmEmailSent', { email })}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Field label={t('emailField')}><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required /></Field>
            <Field label={t('password')} hint={t('passwordHint')}><PasswordInput value={pw} onChange={setPw} autoComplete="new-password" /></Field>
            {err && <p role="alert" className="text-[13.5px] font-semibold text-danger">{t(err)}{err === 'errExists' && <> <Link href={`/login?next=${encodeURIComponent(next)}`} className="underline">{t('login')}</Link></>}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={state === 'busy'}>{t('createAccountBtn')}</Button>
          </form>
        )}
        <p className="mt-6 text-center text-[14px] text-muted">{t('haveAccount')} <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-leaf">{t('login')}</Link></p>
      </Card>
    </Container>
  );
}

export function LoginForm() {
  const { t } = useI18n();
  const modes = useModes();
  const store = useStore();
  const router = useRouter();
  const sp = useSearchParams();
  const next = safe(sp.get('next'), '/app');
  const wantsAdmin = sp.get('admin') === '1';
  const [email, setEmail] = useState(store.answers.email || '');
  const [pw, setPw] = useState('');
  const [mode, setMode] = useState<'password' | 'reset' | 'resetSent'>('password');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<MessageKey | null>(sp.get('error') ? 'errLink' : null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) { setErr('emailInvalid'); return; }
    setBusy(true); setErr(null);
    if (mode === 'reset') { const ok = await sendReset(email.trim().toLowerCase()); setBusy(false); if (ok) setMode('resetSent'); else setErr('errNetwork'); return; }
    if (wantsAdmin && !modes.supabase) {
      const ok = await devSignIn(email, 'admin', pw);
      setBusy(false);
      if (ok) { store.login(email, 'admin'); router.push(next); router.refresh(); } else setErr('errInvalid');
      return;
    }
    const r = await signIn(email.trim().toLowerCase(), pw);
    setBusy(false);
    if (!r.ok) { setErr(ERR[r.error]); return; }
    store.login(email);
    router.push(next); router.refresh();
  };

  return (
    <Container className="grid min-h-[70vh] place-items-center py-10">
      <Card className="w-full max-w-[440px] p-6 md:p-8">
        <h1 className="font-display text-[28px] font-extrabold">{mode === 'password' ? (wantsAdmin ? t('adminLogin') : t('login')) : t('forgotTitle')}</h1>
        <p className="mt-2 text-[15px] text-muted">{mode === 'password' ? t('loginSubPw') : t('forgotSub')}</p>
        {!modes.supabase && <p className="mt-3 rounded-xl bg-gold/20 p-3 text-[12.5px]">◎ {t('devLoginNote')}</p>}
        {mode === 'resetSent' ? (
          <p className="mt-6 rounded-2xl bg-sage p-4 font-semibold text-forest">✉ {t('resetSent')}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Field label={t('emailField')}><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required /></Field>
            {mode === 'password' && <Field label={wantsAdmin && !modes.supabase ? t('passphrase') : t('password')}><PasswordInput value={pw} onChange={setPw} autoComplete="current-password" /></Field>}
            {err && <p role="alert" className="text-[13.5px] font-semibold text-danger">{t(err)}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>{mode === 'password' ? t('login') : t('sendResetLink')}</Button>
          </form>
        )}
        <div className="mt-5 flex flex-wrap justify-between gap-2 text-[14px]">
          {mode === 'password'
            ? <button type="button" className="font-semibold text-leaf" onClick={() => { setMode('reset'); setErr(null); }}>{t('forgotPassword')}</button>
            : <button type="button" className="font-semibold text-leaf" onClick={() => { setMode('password'); setErr(null); }}>← {t('login')}</button>}
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-leaf">{t('createAccount')}</Link>
        </div>
      </Card>
    </Container>
  );
}

/** New password after clicking the reset link (user is signed in by the link). */
export function ResetPasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<MessageKey | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { setErr('errWeak'); return; }
    if (await setNewPassword(pw)) router.push('/app'); else setErr('errLink');
  };
  return (
    <Container className="grid min-h-[70vh] place-items-center py-10">
      <Card className="w-full max-w-[440px] p-6 md:p-8">
        <h1 className="font-display text-[28px] font-extrabold">{t('newPassword')}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label={t('password')} hint={t('passwordHint')}><PasswordInput value={pw} onChange={setPw} autoComplete="new-password" /></Field>
          {err && <p role="alert" className="text-[13.5px] font-semibold text-danger">{t(err)}</p>}
          <Button type="submit" size="lg" className="w-full">{t('save')}</Button>
        </form>
      </Card>
    </Container>
  );
}

export function RegisterCard() { return <RegisterForm />; }
