'use client';

import { PageTracker } from '@/components/tracker';
import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from '@/config/markets';
import { I18nProvider } from '@/i18n/I18nProvider';
import { StoreProvider } from '@/state/store';
import { AccountSync } from '@/state/sync';

/** Which integrations the server has keys for (booleans only, never the keys). */
export interface Modes { supabase: boolean; stripe: boolean; ai: boolean; email: boolean }
const ModesCtx = createContext<Modes>({ supabase: false, stripe: false, ai: false, email: false });
export const useModes = () => useContext(ModesCtx);

export function Providers({ lang, modes, children }: { lang: Locale; modes: Modes; children: ReactNode }) {
  return (
    <ModesCtx.Provider value={modes}>
      <I18nProvider initial={lang}>
        <StoreProvider><AccountSync /><PageTracker />{children}</StoreProvider>
      </I18nProvider>
    </ModesCtx.Provider>
  );
}
