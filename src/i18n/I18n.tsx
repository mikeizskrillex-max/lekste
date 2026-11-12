import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lang } from '../lib/types';
import { S, type StringKey } from './strings';
import { load, save } from '../lib/storage';

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  /** pick the right field from a {lt, ru} object */
  pick: <T extends { lt: string; ru: string }>(o: T) => string;
}

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => load<Lang>('lang', 'lt'));
  const setLang = useCallback((l: Lang) => { setLangState(l); save('lang', l); }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const value = useMemo<Ctx>(() => ({
    lang,
    setLang,
    t: (key, vars) => {
      let s: string = S[key][lang];
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
      return s;
    },
    pick: (o) => o[lang],
  }), [lang, setLang]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n(): Ctx {
  const c = useContext(I18nCtx);
  if (!c) throw new Error('useI18n outside I18nProvider');
  return c;
}

export function formatEur(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'lt' ? 'lt-LT' : 'ru-RU', { style: 'currency', currency: 'EUR' }).format(n);
}

export function formatNum(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'lt' ? 'lt-LT' : 'ru-RU').format(Math.round(n));
}
