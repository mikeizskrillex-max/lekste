'use client';

/**
 * Keeps the signed-in user's data in Supabase (table app_state) so the
 * questionnaire is filled once and everything is the same on every device.
 * Loads on sign-in; saves 1.5 s after the last change. No-op in development mode.
 */
import { useEffect, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useStore } from './store';

export function AccountSync() {
  const store = useStore();
  const userId = useRef<string | null>(null);
  const loaded = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const storeRef = useRef(store);
  storeRef.current = store;

  // sign-in / sign-out
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !store.ready) return;
    const onUser = async (id: string | null, email: string | null) => {
      if (id === userId.current) return;
      userId.current = id;
      loaded.current = false;
      if (!id) return;
      storeRef.current.login(email ?? '', 'user');
      const { data } = await sb.from('app_state').select('data, updated_at').eq('user_id', id).maybeSingle();
      const local = storeRef.current.snapshot();
      const server = data?.data as Partial<typeof local> | undefined;
      const localNewer = local.onboarded && (!server?.planCreatedAt || (local.planCreatedAt ?? '') > (server.planCreatedAt ?? ''));
      if (server && !localNewer) storeRef.current.importState(server);
      else if (local.onboarded) await sb.from('app_state').upsert({ user_id: id, data: local, updated_at: new Date().toISOString() });
      loaded.current = true;
    };
    void sb.auth.getSession().then(({ data }) => onUser(data.session?.user.id ?? null, data.session?.user.email ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => { void onUser(session?.user.id ?? null, session?.user.email ?? null); });
    return () => sub.subscription.unsubscribe();
  }, [store.ready]);

  // autosave
  const snap = JSON.stringify(store.snapshot());
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !userId.current || !loaded.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void sb.from('app_state').upsert({ user_id: userId.current!, data: JSON.parse(snap), updated_at: new Date().toISOString() });
    }, 1500);
    return () => clearTimeout(timer.current);
  }, [snap]);

  return null;
}
