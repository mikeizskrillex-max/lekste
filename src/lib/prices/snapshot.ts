import { z } from 'zod';

export const STORE_CODES = ['barbora', 'rimi'] as const;
export type StoreCode = (typeof STORE_CODES)[number];

const money = z.number().positive().max(10000);

export const labelNutrients = z.object({
  kcal: z.number().min(0).max(900),
  protein: z.number().min(0).max(100),
  fat: z.number().min(0).max(100),
  carbs: z.number().min(0).max(100),
  fiber: z.number().min(0).max(100).nullable(),
});
export type LabelNutrients = z.infer<typeof labelNutrients>;

/** One product page as read from a store, before it is written to store_products. */
export const snapshot = z
  .object({
    store: z.enum(STORE_CODES),
    externalId: z.string().regex(/^[A-Za-z0-9._-]{1,64}$/),
    url: z.url().startsWith('https://'),
    title: z.string().min(2).max(300),
    brand: z.string().max(120).nullable(),
    categoryPath: z.string().max(300).nullable(),
    packSize: z.number().positive().nullable(),
    packUnit: z.enum(['g', 'ml', 'pcs']).nullable(),
    soldByWeight: z.boolean(),
    /** for products sold by weight: the amount added per click in the cart, kg (Rimi bananas: 1.6) */
    saleStepKg: z.number().positive().max(50).nullable(),
    /** what a shopper without a loyalty card pays now */
    price: money,
    /** shelf price before a promotion open to everyone */
    regularPrice: money.nullable(),
    /** loyalty-card price (Ačiū, Mano Rimi) */
    cardPrice: money.nullable(),
    promoFrom: z.iso.date().nullable(),
    promoTo: z.iso.date().nullable(),
    unitPrice: money.nullable(),
    unitPriceUnit: z.enum(['kg', 'l', 'pcs']).nullable(),
    inStock: z.boolean(),
    ingredientsText: z.string().max(5000).nullable(),
    nutrients: labelNutrients.nullable(),
  })
  .refine((s) => s.cardPrice === null || s.cardPrice <= (s.regularPrice ?? s.price), 'card price above shelf price');
export type Snapshot = z.infer<typeof snapshot>;
