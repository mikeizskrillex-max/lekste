import 'server-only';
import { supabaseAdmin } from './supabase';

/** AI request log (metadata only, no message bodies with personal data). */
export interface AiLog { at: string; provider: string; ok: boolean; fallback: boolean; actions: string[]; ms: number; error?: string }
const g = globalThis as unknown as { __aiLogs?: AiLog[] };
g.__aiLogs ??= [];

export async function logAi(entry: AiLog) {
  g.__aiLogs!.unshift(entry);
  g.__aiLogs!.splice(200);
  const db = supabaseAdmin();
  if (db) await db.from('ai_generation_logs').insert({ provider: entry.provider, ok: entry.ok, fallback: entry.fallback, actions: entry.actions, duration_ms: entry.ms, error: entry.error ?? null });
}
export const recentAiLogs = () => g.__aiLogs!;

export async function audit(actor: string | null, action: string, target: string | null, meta: Record<string, unknown> = {}) {
  const db = supabaseAdmin();
  if (db) await db.from('audit_logs').insert({ actor, action, target, meta });
  else console.info('[audit]', actor, action, target, meta);
}
