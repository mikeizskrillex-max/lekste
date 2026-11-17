import { NextResponse } from 'next/server';
import { buildAdminAnalytics } from '@/server/analytics';
import { getViewer } from '@/server/auth';
import { audit } from '@/server/logs';

export const dynamic = 'force-dynamic';

/** Admin dashboard data: accounts from Supabase Auth, subscriptions and payments from Stripe. */
export async function GET() {
  const v = await getViewer();
  if (v?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const data = await buildAdminAnalytics();
  await audit(v.email, 'admin_analytics', null, { users: data.users.length });
  return NextResponse.json(data, { headers: { 'cache-control': 'no-store' } });
}
