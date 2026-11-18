'use client';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useMemo, useState } from 'react';
import { pickerSearch, type PickerItem } from '@/lib/ingredients/picker';
import { DISLIKE_GROUP_IDS, groupSelected, toggleGroup } from '@/lib/questionnaire/dislikes';
import { cn } from '@/lib/utils';
import { StepHeading } from '../fields';
import type { StepProps } from './types';

export function DislikesStep({ draft, update, headingId, items }: StepProps & { items: readonly PickerItem[] }) {
  const t = useTranslations('questionnaire.dislikes');
  const id = useId();
  const [query, setQuery] = useState('');
  const selected = draft.dislikes ?? [];
  const names = useMemo(() => new Map(items.map((i) => [i.slug, i.name])), [items]);
  const hits = useMemo(() => pickerSearch(items, query), [items, query]);
  const toggle = (slug: string) =>
    update({ dislikes: selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug] });
  const chip = 'h-10 rounded-full px-4 text-sm font-semibold ring-1 transition-colors';

  return (
    <>
      <StepHeading id={headingId} title={t('title')} hint={t('hint')} />
      <p className="mb-3 text-sm font-semibold">{t('popular')}</p>
      <div className="flex flex-wrap gap-2">
        {DISLIKE_GROUP_IDS.map((g) => {
          const on = groupSelected(selected, g);
          return (
            <button
              key={g}
              type="button"
              aria-pressed={on}
              onClick={() => update({ dislikes: toggleGroup(selected, g) })}
              className={cn(
                chip,
                on ? 'bg-accent text-accent-ink ring-accent' : 'bg-surface ring-line hover:ring-ink/30',
              )}
            >
              {t(`groups.${g}`)}
            </button>
          );
        })}
      </div>

      <label htmlFor={id} className="mt-6 mb-1.5 block text-sm font-semibold">
        {t('search')}
      </label>
      <div className="bg-surface ring-line focus-within:ring-accent flex h-12 items-center gap-2 rounded-xl px-4 ring-1 focus-within:ring-2">
        <Search className="text-muted size-4" aria-hidden />
        <input
          id={id}
          type="search"
          autoComplete="off"
          className="w-full bg-transparent outline-none"
          placeholder={t('placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {query.trim().length >= 2 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-live="polite">
          {hits.length === 0 && <li className="text-muted text-sm">{t('noResults')}</li>}
          {hits.map((h) => (
            <li key={h.slug}>
              <button
                type="button"
                aria-pressed={selected.includes(h.slug)}
                onClick={() => toggle(h.slug)}
                className={cn(
                  chip,
                  selected.includes(h.slug) ? 'bg-accent text-accent-ink ring-accent' : 'bg-surface ring-line',
                )}
              >
                {h.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected.length > 0 && (
        <div className="mt-6">
          <p className="text-muted mb-2 text-sm">{t('selected', { count: selected.length })}</p>
          <ul className="flex flex-wrap gap-2">
            {selected.map((slug) => (
              <li key={slug}>
                <button
                  type="button"
                  onClick={() => toggle(slug)}
                  aria-label={t('remove', { name: names.get(slug) ?? slug })}
                  className="bg-surface-2 hover:bg-line flex h-9 items-center gap-1.5 rounded-full pr-2 pl-3 text-sm"
                >
                  {names.get(slug) ?? slug}
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
