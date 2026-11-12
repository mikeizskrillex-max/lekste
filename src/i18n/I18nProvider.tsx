'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '@/config/markets';
import { M, type MessageKey } from './messages';

interface Ctx {
  lang: Locale;
  setLang: (l: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  pick: <T extends { lt: string; ru: string }>(o: T) => string;
  eur: (n: number) => string;
  num: (n: number, digits?: number) => string;
  date: (iso: string, opts?: Intl.DateTimeFormatOptions) => string;
}

const I18nCtx = createContext<Ctx | null>(null);
const intl = (l: Locale) => (l === 'lt' ? 'lt-LT' : 'ru-RU');

export function I18nProvider({ initial, children }: { initial: Locale; children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>(initial);
  const setLang = useCallback((l: Locale) => {
    setLangState(l);
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
  }, []);
  const value = useMemo<Ctx>(() => ({
    lang,
    setLang,
    t: (key, vars) => {
      let s: string = M[key]?.[lang] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
      return s;
    },
    pick: (o) => o[lang],
    eur: (n) => new Intl.NumberFormat(intl(lang), { style: 'currency', currency: 'EUR' }).format(n),
    num: (n, digits = 0) => new Intl.NumberFormat(intl(lang), { maximumFractionDigits: digits }).format(n),
    date: (iso, opts = { day: 'numeric', month: 'long' }) => new Date(iso).toLocaleDateString(intl(lang), opts),
  }), [lang, setLang]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n(): Ctx {
  const c = useContext(I18nCtx);
  if (!c) throw new Error('useI18n outside I18nProvider');
  return c;
}
