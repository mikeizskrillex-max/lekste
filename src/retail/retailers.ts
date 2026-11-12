import type { RetailerId } from '@/config/markets';
import type { PriceSource } from './types';

export type IntegrationStatus = 'snapshot' | 'csv_only' | 'not_connected';

export interface RetailerInfo {
  id: RetailerId;
  name: string;
  color: string;
  /** acquisition method actually used today */
  method: PriceSource | null;
  status: IntegrationStatus;
  note: { lt: string; ru: string };
  website: string;
}

/**
 * Honest status of every Lithuanian retailer integration. Nothing here is a
 * live API: Barbora and Rimi are public e-shop catalogue snapshots collected
 * by script; the others have no verified data source yet and can be filled by
 * the admin CSV import.
 */
export const RETAILERS: Record<RetailerId, RetailerInfo> = {
  barbora: {
    id: 'barbora', name: 'Barbora', color: '#C8102E', method: 'public_catalog', status: 'snapshot', website: 'https://barbora.lt',
    note: { lt: 'Maxima grupės e. parduotuvė. Kainos iš viešo katalogo (momentinė kopija).', ru: 'Интернет-магазин группы Maxima. Цены из публичного каталога (снимок).' },
  },
  rimi: {
    id: 'rimi', name: 'Rimi', color: '#E5002B', method: 'public_catalog', status: 'snapshot', website: 'https://www.rimi.lt/e-parduotuve',
    note: { lt: 'Rimi e. parduotuvė. Kainos iš viešo katalogo (momentinė kopija).', ru: 'Интернет-магазин Rimi. Цены из публичного каталога (снимок).' },
  },
  maxima: {
    id: 'maxima', name: 'Maxima', color: '#E30613', method: null, status: 'csv_only', website: 'https://www.maxima.lt',
    note: { lt: 'Parduotuvių kainos gali skirtis nuo Barbora. Kol kas tik CSV importas.', ru: 'Цены в магазинах могут отличаться от Barbora. Пока только импорт CSV.' },
  },
  lidl: {
    id: 'lidl', name: 'Lidl', color: '#0050AA', method: null, status: 'csv_only', website: 'https://www.lidl.lt',
    note: { lt: 'Nėra e. parduotuvės su kainomis. Akcijas galima importuoti CSV.', ru: 'Нет интернет-магазина с ценами. Акции можно импортировать CSV.' },
  },
  iki: {
    id: 'iki', name: 'Iki', color: '#E4002B', method: null, status: 'csv_only', website: 'https://iki.lt',
    note: { lt: 'Patikrinto šaltinio dar nėra. Kol kas tik CSV importas.', ru: 'Проверенного источника пока нет. Пока только импорт CSV.' },
  },
};

export const RETAILER_ORDER: RetailerId[] = ['maxima', 'lidl', 'rimi', 'iki', 'barbora'];
