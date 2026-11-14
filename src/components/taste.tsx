'use client';

import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { RECIPE_BY_ID } from '@/data/recipeIndex';
import { recipeFacts } from '@/domain/recipeFacts';
import { mainIngredient, tasteDeck } from '@/domain/taste';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { ingName } from '@/lib/view';
import { useStore } from '@/state/store';
import { Logo } from './site';
import { Button, Container, DishImage, cx } from './ui';

type Vote = 'up' | 'down';

function SwipeCard({ id, onVote, top }: { id: string; onVote: (v: Vote) => void; top: boolean }) {
  const { t, lang, num } = useI18n();
  const { recipeById } = useRecipes();
  const r = recipeById(id)!;
  const f = recipeFacts(r);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -30], [1, 0]);
  const end = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 110 || info.velocity.x > 600) onVote('up');
    else if (info.offset.x < -110 || info.velocity.x < -600) onVote('down');
  };
  return (
    <motion.div
      className={cx('absolute inset-0 overflow-hidden rounded-xl3 bg-card shadow-lift ring-1 ring-line', top ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none')}
      style={{ x, rotate }} drag={top ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.9} onDragEnd={end}
      initial={{ scale: top ? 1 : 0.95, y: top ? 0 : 12, opacity: 1 }} animate={{ scale: top ? 1 : 0.95, y: top ? 0 : 12 }}
      exit={{ x: x.get() >= 0 ? 520 : -520, opacity: 0, transition: { duration: 0.25 } }}>
      <DishImage id={id} alt={r[lang]} className="h-[62%] [&_img]:pointer-events-none [&_img]:select-none" priority={top} sizes="420px" />
      <motion.div style={{ opacity: likeOpacity }} className="absolute left-5 top-5 -rotate-12 rounded-xl border-4 border-leaf px-3 py-1 font-display text-[26px] font-extrabold text-leaf">{t('tasteYes')}</motion.div>
      <motion.div style={{ opacity: nopeOpacity }} className="absolute right-5 top-5 rotate-12 rounded-xl border-4 border-danger px-3 py-1 font-display text-[26px] font-extrabold text-danger">{t('tasteNo')}</motion.div>
      <div className="p-5">
        <div className="text-[11.5px] font-bold uppercase tracking-wide text-leaf">{t(`meal_${r.meal}` as MessageKey)} · {ingName(mainIngredient(r), lang)}</div>
        <div className="mt-1 font-display text-[22px] font-extrabold leading-tight">{r[lang]}</div>
        <div className="mt-2 text-[13.5px] text-muted">{num(f.kcal)} kcal · {num(f.protein)} g {t('protein')} · ⏱ {r.minutes} {t('minutesShort')}</div>
      </div>
    </motion.div>
  );
}

const useRecipes = () => ({ recipeById: (id: string) => RECIPE_BY_ID[id] });

/** Tinder-style taste test: swipe right = like, left = not for me. */
export function TasteSwipe() {
  const { t, lang } = useI18n();
  const { answers, applyTaste, ready } = useStore();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') ?? '/onboarding/result';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/onboarding/result';
  const deck = useMemo(() => (ready ? tasteDeck(answers).map((r) => r.id) : []), [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const done = deck.length > 0 && i >= deck.length;
  const { recipeById } = useRecipes();

  const vote = (v: Vote) => { if (i < deck.length) { setVotes((x) => ({ ...x, [deck[i]]: v })); setI((n) => n + 1); } };
  const undo = () => { if (i > 0) { const id = deck[i - 1]; setVotes((x) => { const y = { ...x }; delete y[id]; return y; }); setI((n) => n - 1); } };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') vote('up'); if (e.key === 'ArrowLeft') vote('down'); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  const finish = () => {
    const liked = Object.keys(votes).filter((k) => votes[k] === 'up');
    const disliked = Object.keys(votes).filter((k) => votes[k] === 'down');
    if (liked.length || disliked.length) applyTaste(liked, disliked);
    router.push(safeNext);
  };
  const likedMains = [...new Set(Object.keys(votes).filter((k) => votes[k] === 'up').map((id) => ingName(mainIngredient(recipeById(id)!), lang)))];

  return (
    <div className="min-h-screen bg-paper">
      <Container className="flex h-16 items-center justify-between"><Logo /><button type="button" className="text-[14px] font-semibold text-muted hover:text-ink" onClick={finish}>{t('skip')} →</button></Container>
      <div className="h-1.5 bg-line/60"><motion.div className="h-full bg-leaf" animate={{ width: `${deck.length ? (i / deck.length) * 100 : 0}%` }} /></div>
      <Container className="max-w-[460px] py-4 md:py-6">
        <h1 className="text-center font-display text-[26px] font-extrabold leading-tight">{t('tasteTitle')}</h1>
        <p className="mt-1 text-center text-[14px] text-muted">{done ? t('tasteDone') : t('tasteSub', { a: Math.min(i + 1, deck.length), b: deck.length })}</p>
        {!done && (
          <>
            <div className="relative mx-auto mt-4 h-[min(460px,56vh)] w-full max-w-[400px] touch-pan-y select-none">
              <AnimatePresence>
                {deck.slice(i, i + 2).reverse().map((id) => <SwipeCard key={id} id={id} top={id === deck[i]} onVote={vote} />)}
              </AnimatePresence>
            </div>
            <div className="mt-5 flex items-center justify-center gap-5">
              <button type="button" aria-label={t('tasteNo')} onClick={() => vote('down')} className="grid h-16 w-16 place-items-center rounded-full bg-card text-[26px] text-danger shadow-lift ring-1 ring-line transition active:scale-95">✕</button>
              <button type="button" aria-label={t('back2')} onClick={undo} disabled={i === 0} className="grid h-11 w-11 place-items-center rounded-full bg-card text-[18px] text-muted shadow-soft ring-1 ring-line disabled:opacity-40">↶</button>
              <button type="button" aria-label={t('tasteYes')} onClick={() => vote('up')} className="grid h-16 w-16 place-items-center rounded-full bg-leaf text-[26px] text-white shadow-lift transition active:scale-95">♥</button>
            </div>
            <p className="mt-4 text-center text-[12.5px] text-muted">{t('tasteHint')}</p>
          </>
        )}
        {done && (
          <div className="mt-8 rounded-xl3 bg-card p-6 text-center shadow-soft ring-1 ring-line">
            <div className="text-[40px]">🎯</div>
            {likedMains.length > 0 && <p className="mt-2 text-[15px]">{t('tasteLikes')}: <b>{likedMains.join(', ')}</b></p>}
            <p className="mt-2 text-[13.5px] text-muted">{t('tasteApplied')}</p>
            <Button size="lg" className="mt-5 w-full" onClick={finish}>{t('continue')} →</Button>
            <button type="button" className="mt-3 text-[13px] font-semibold text-leaf" onClick={() => { setI(0); setVotes({}); }}>↻ {t('tasteAgain')}</button>
          </div>
        )}
      </Container>
    </div>
  );
}
