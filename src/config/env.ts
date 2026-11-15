/**
 * Which external services are configured. Components use this to show an
 * honest "development mode" state instead of pretending an integration works.
 */
export const integrations = {
  supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)),
  stripe: Boolean(process.env.STRIPE_SECRET_KEY),
  ai: process.env.AI_PROVIDER === 'anthropic' && Boolean(process.env.ANTHROPIC_API_KEY),
  email: Boolean(process.env.RESEND_API_KEY),
};

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
