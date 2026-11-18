'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const ORDER = ['system', 'light', 'dark'] as const;
const ICON = { system: Monitor, light: Sun, dark: Moon };

/** Cycles device → light → dark. Renders a neutral icon until mounted to avoid a hydration mismatch. */
export function ThemeToggle() {
  const t = useTranslations('theme');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = (
    mounted && ORDER.includes(theme as (typeof ORDER)[number]) ? theme : 'system'
  ) as (typeof ORDER)[number];
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length] ?? 'system';
  const Icon = ICON[current];
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`${t('label')}: ${t(current)}`}
      title={`${t('label')}: ${t(current)}`}
      className="text-muted hover:bg-surface-2 hover:text-ink grid h-10 w-10 place-items-center rounded-full transition-colors"
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </button>
  );
}
