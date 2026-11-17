import { createHash, createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import * as z from 'zod/v4';
import { clientIp, rateLimit } from '@/server/rateLimit';
import { supabaseAdmin } from '@/server/supabase';

const Body = z.object({
  name: z.enum(['pageview', 'cta_plan', 'cta_month']),
  path: z.string().max(200).regex(/^\//),
  ref: z.string().max(200).optional(),
  place: z.string().max(40).optional(),
});

/** Daily-rotating anonymous visitor id: no cookie, no stored IP, not linkable across days. */
function visitorId(req: Request): string {
  const day = new Date().toISOString().slice(0, 10);
  const salt = createHmac('sha256', process.env.SESSION_SECRET || process.env.SUPABASE_SECRET_KEY || 'lekste').update(day).digest('hex');
  return createHash('sha256').update(`${salt}|${clientIp(req)}|${req.headers.get('user-agent') ?? ''}`).digest('hex').slice(0, 20);
}

const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless|vercel/i;

export async function POST(req: Request) {
  const ua = req.headers.get('user-agent') ?? '';
  if (BOT.test(ua)) return new NextResponse(null, { status: 204 });
  if (!rateLimit(`track:${clientIp(req)}`, 120, 60_000).ok) return new NextResponse(null, { status: 204 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  const db = supabaseAdmin();
  if (!parsed.success || !db) return new NextResponse(null, { status: 204 });
  const { name, path, ref, place } = parsed.data;
  let refHost: string | null = null;
  try { refHost = ref ? new URL(ref).hostname.replace(/^www\./, '') : null; } catch { refHost = null; }
  if (refHost && req.headers.get('host')?.replace(/^www\./, '') === refHost) refHost = null; // internal navigation
  await db.from('events').insert({ name, path: path.split('?')[0], visitor: visitorId(req), device: /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop', ref: refHost, place: place ?? null });
  return new NextResponse(null, { status: 204 });
}
