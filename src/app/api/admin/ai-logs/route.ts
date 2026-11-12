import { NextResponse } from 'next/server';
import { getViewer } from '@/server/auth';
import { recentAiLogs } from '@/server/logs';

export async function GET() {
  const v = await getViewer();
  if (v?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ logs: recentAiLogs(), provider: process.env.AI_PROVIDER === 'anthropic' && process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'rules' });
}
