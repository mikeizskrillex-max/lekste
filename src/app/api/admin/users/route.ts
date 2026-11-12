import { NextResponse } from 'next/server';
import { getViewer } from '@/server/auth';
import { audit } from '@/server/logs';
import { supabaseAdmin } from '@/server/supabase';

/** Admin user list (Supabase only). Returns no health data, only account and subscription fields. */
export async function GET() {
  const v = await getViewer();
  if (v?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ mode: 'dev', users: [] });
  const { data, error } = await db.from('profiles').select('id, email, locale, created_at, subscriptions(status, plan_id, current_period_end)').order('created_at', { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await audit(v.email, 'admin_list_users', null, { count: data?.length ?? 0 });
  return NextResponse.json({ mode: 'supabase', users: data });
}
