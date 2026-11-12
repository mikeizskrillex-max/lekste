/**
 * Country / market configuration. Adding a market (LV, EE, PL…) means adding
 * an entry here plus its retailers, legal texts and product catalog — the app
 * itself does not change.
 */
export type Locale = 'lt' | 'ru';
/** Languages prepared for later markets (no translations shipped yet). */
export const FUTURE_LOCALES = ['en', 'lv', 'et', 'pl'] as const;

export type RetailerId = 'maxima' | 'barbora' | 'rimi' | 'lidl' | 'iki';

export interface Market {
  id: 'LT' | 'LV' | 'EE' | 'PL';
  name: string;
  currency: 'EUR' | 'PLN';
  defaultLocale: Locale;
  locales: Locale[];
  /** VAT shown on subscription prices (prices are VAT-inclusive for consumers) */
  vatRate: number;
  retailers: RetailerId[];
  live: boolean;
}

export const MARKETS: Record<Market['id'], Market> = {
  LT: { id: 'LT', name: 'Lietuva', currency: 'EUR', defaultLocale: 'lt', locales: ['lt', 'ru'], vatRate: 0.21, retailers: ['maxima', 'barbora', 'rimi', 'lidl', 'iki'], live: true },
  LV: { id: 'LV', name: 'Latvija', currency: 'EUR', defaultLocale: 'lt', locales: ['lt'], vatRate: 0.21, retailers: ['rimi', 'lidl', 'barbora'], live: false },
  EE: { id: 'EE', name: 'Eesti', currency: 'EUR', defaultLocale: 'lt', locales: ['lt'], vatRate: 0.24, retailers: ['rimi', 'lidl', 'barbora'], live: false },
  PL: { id: 'PL', name: 'Polska', currency: 'PLN', defaultLocale: 'lt', locales: ['lt'], vatRate: 0.23, retailers: ['lidl'], live: false },
};

export const CURRENT_MARKET = MARKETS.LT;
