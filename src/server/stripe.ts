import 'server-only';
import Stripe from 'stripe';

export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  // fetch-based client: works on Vercel/edge and honours HTTPS proxies
  return key ? new Stripe(key, { httpClient: Stripe.createFetchHttpClient() }) : null;
}
