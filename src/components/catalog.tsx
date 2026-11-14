'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { RECIPES, isChefRecipe, type Recipe } from '@/data/recipes';
import { getDetail } from '@/data/recipeDetails';
import { recipeAtStore } from '@/domain/pricing';
import { passesHardRules, recipeFacts } from '@/domain/recipeFacts';
import type { MealType } from '@/domain/types';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { ingName } from '@/lib/view';
import { RETAILERS } from '@/retail/retailers';
import { useStore } from '@/state/store';
import { Button, Card, Chip, DishImage, cx, inputCls } from './ui';

const PAGE = 24;
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Browse / search all recipes; every card opens the recipe with steps and what to buy. */
export function RecipeCatalog({ recipeHref = (id: string) => `/recipe/${id}?back=/recipes` }: { recipeHref?: (id: string) => string }) {
  const { t, lang, eur, num } = useI18n();
  const { answers, onboarded, homeStore, toggleFavorite } = useStore();
  const fav = useMemo(() => answers.favorites ?? [], [answers.favorites]);
  const [q, setQ] = useState('');
  const [meal, setMeal] = useState<MealType | 'all'>('all');
  const [time, setTime] = useState<15 | 30 | 60 | null>(null);
  const [veg, setVeg] = useState(false);
  const [protein, setProtein] = useState(false);
  const [onlyFav, setOnlyFav] = useState(false);
  const [mine, setMine] = useState(true);
  const [cheap, setCheap] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const sp = useSearchParams();
  const [ing, setIng] = useState<string | null>(sp.get('ing'));

  const list = useMemo(() => {
    const needle = fold(q.trim());
    const out = RECIPES.filter((r) => {
      if (ing && !r.items.some(([i]) => i === ing)) return false;
      if (meal !== 'all' && r.meal !== meal) return false;
      const d = getDetail(r.id);
      if (time && (d ? d.prep + d.cook : r.minutes) > time) return false;
      const f = recipeFacts(r);
      if (veg && (f.flags.includes('meat') || f.flags.includes('fish') || f.flags.includes('seafood'))) return false;
      if (protein && f.protein < 25) return false;
      if (onlyFav && !fav.includes(r.id)) return false;
      if (mine && onboarded && !passesHardRules(r, answers)) return false;
      if (needle && !fold(`${r.lt} ${r.ru} ${r.items.map(([id]) => `${ingName(id, 'lt')} ${ingName(id, 'ru')}`).join(' ')}`).includes(needle)) return false;
      return true;
    });
    const cost = (r: Recipe) => recipeAtStore(r, homeStore).cost;
    return out.sort(cheap ? (a, b) => cost(a) - cost(b) : (a, b) => Number(fav.includes(b.id)) - Number(fav.includes(a.id)) || Number(isChefRecipe(b.id)) - Number(isChefRecipe(a.id)) || a[lang].localeCompare(b[lang]));
  }, [q, meal, time, veg, protein, onlyFav, mine, cheap, fav, onboarded, answers, homeStore, lang, ing]);

  const reset = () => setShown(PAGE);
  return (
    <div>
      <Card className="space-y-3 p-4">
        {ing && <Chip on onClick={() => setIng(null)}>{ingName(ing, lang)} ✕</Chip>}
        <input value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder={t('searchRecipes')} aria-label={t('searchRecipes')} className={inputCls} />
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => <Chip key={m} on={meal === m} onClick={() => { setMeal(m); reset(); }}>{m === 'all' ? t('allMeals') : t(`meal_${m}` as MessageKey)}</Chip>)}
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {([15, 30, 60] as const).map((m) => <Chip key={m} on={time === m} onClick={() => { setTime(time === m ? null : m); reset(); }}>⏱ {t('upToMin', { n: m })}</Chip>)}
          <Chip on={veg} onClick={() => { setVeg(!veg); reset(); }}>🥦 {t('vegOnly')}</Chip>
          <Chip on={protein} onClick={() => { setProtein(!protein); reset(); }}>💪 {t('highProtein')}</Chip>
          <Chip on={cheap} onClick={() => setCheap(!cheap)}>€ {t('cheapFirst')}</Chip>
          <Chip on={onlyFav} onClick={() => { setOnlyFav(!onlyFav); reset(); }}>♥ {t('favorites')} ({fav.length})</Chip>
          {onboarded && <Chip on={mine} onClick={() => { setMine(!mine); reset(); }}>✓ {t('fitsMe')}</Chip>}
        </div>
      </Card>
      <p className="mt-4 text-[13px] text-muted">{t('results', { n: list.length })} · {RETAILERS[homeStore].name} · {t('favoriteNote')}</p>
      {list.length === 0 && <p className="mt-6 text-center text-muted">{t('noResults')}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.slice(0, shown).map((r) => {
          const f = recipeFacts(r);
          const d = getDetail(r.id);
          const on = fav.includes(r.id);
          return (
            <Card key={r.id} className="group relative overflow-hidden">
              <Link href={recipeHref(r.id)}>
                <DishImage id={r.id} alt={r[lang]} className="aspect-[4/3]" sizes="(max-width: 640px) 100vw, 360px" />
                <div className="p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-leaf">{t(`meal_${r.meal}` as MessageKey)} · ⏱ {d ? d.prep + d.cook : r.minutes} {t('minutesShort')}</div>
                  <div className="mt-1 line-clamp-2 min-h-[44px] text-[15.5px] font-bold leading-snug group-hover:text-leaf">{r[lang]}</div>
                  <div className="mt-2 flex justify-between text-[13px] text-muted"><span>{num(f.kcal)} kcal · {num(f.protein)} g</span><span className="font-semibold text-ink">{eur(recipeAtStore(r, homeStore).cost)} <span className="font-normal text-muted">{t('perServing')}</span></span></div>
                </div>
              </Link>
              <button type="button" onClick={() => toggleFavorite(r.id)} aria-pressed={on} aria-label={on ? t('inFavorites') : t('addFavorite')}
                className={cx('absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-[18px] shadow-soft transition', on ? 'bg-danger text-white' : 'bg-white/90 text-ink hover:bg-white')}>{on ? '♥' : '♡'}</button>
            </Card>
          );
        })}
      </div>
      {shown < list.length && <div className="mt-6 text-center"><Button variant="secondary" onClick={() => setShown((n) => n + PAGE * 2)}>{t('loadMore')} ({list.length - shown})</Button></div>}
    </div>
  );
}

export function FavoriteButton({ id }: { id: string }) {
  const { t } = useI18n();
  const { answers, toggleFavorite } = useStore();
  const on = (answers.favorites ?? []).includes(id);
  return (
    <Button variant={on ? 'dark' : 'secondary'} size="lg" className={cx('w-full', on && 'bg-danger hover:bg-danger')} onClick={() => toggleFavorite(id)} aria-pressed={on}>
      {on ? '♥' : '♡'} {on ? t('inFavorites') : t('addFavorite')}
    </Button>
  );
}

export function CatalogPage({ inApp = false }: { inApp?: boolean }) {
  const { t } = useI18n();
  return (
    <div className={inApp ? '' : 'mx-auto w-full max-w-site px-5 py-10 md:px-8'}>
      <h1 className="font-display text-[30px] font-extrabold leading-tight md:text-[40px]">{t('catalogTitle', { n: RECIPES.length.toLocaleString('lt-LT') })}</h1>
      <p className="mb-6 mt-2 text-[15.5px] text-muted">{t('catalogSub')}</p>
      <RecipeCatalog recipeHref={inApp ? (id) => `/app/recipe/${id}` : undefined} />
    </div>
  );
}
