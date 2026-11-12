'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { applyIntent, type Note } from '@/ai/apply';
import { parseRules } from '@/ai/rules';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { recipeName, SAMPLE_ANSWERS } from '@/lib/view';
import { Badge, ButtonLink, Card, Container, CountUp, DemoBadge, DishImage, Reveal, SectionTitle, Slider, cx } from './ui';
import { Faq, PricesChecked, PricingCards, StoreComparisonTable, useSamplePlan, useStoreRows } from './marketing';

function Hero() {
  const { t, eur, num } = useI18n();
  const { t: targets, plan } = useSamplePlan();
  const { min, max } = useStoreRows();
  const reduce = useReducedMotion();
  const dishes = plan.days[0].meals.slice(0, 3);
  return (
    <section className="relative overflow-hidden">
      <Container className="grid items-center gap-12 pb-16 pt-10 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-24">
        <div>
          <Badge tone="sage" className="mb-5">✦ {t('heroKicker2')}</Badge>
          <h1 className="font-display text-[44px] font-extrabold leading-[1.02] tracking-tight text-forest md:text-[68px]">{t('heroTitle3')}</h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink/75 md:text-[19px]">{t('brandSub')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/onboarding" size="lg">{t('ctaCreate')} →</ButtonLink>
            <ButtonLink href="/how-it-works" size="lg" variant="secondary">{t('ctaHow')}</ButtonLink>
          </div>
          <p className="mt-5 max-w-lg text-[13.5px] text-muted">{t('heroNote3')}</p>
        </div>
        <div className="relative mx-auto w-full max-w-[520px]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl3 shadow-lift">
            <Image src="/img/site/mealbowl.jpg" alt="" fill priority sizes="(max-width: 1024px) 100vw, 520px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex gap-2">
              {dishes.map((m) => (
                <div key={m.recipeId} className="flex-1 overflow-hidden rounded-2xl bg-white/95 p-1.5 shadow-soft">
                  <DishImage id={m.recipeId} alt={recipeName(m.recipeId, 'lt')} className="aspect-square rounded-xl" sizes="120px" />
                </div>
              ))}
            </div>
          </div>
          <motion.div initial={reduce ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="absolute -left-3 top-8 rounded-2xl bg-card px-4 py-3 shadow-lift ring-1 ring-line md:-left-10">
            <div className="text-[11.5px] font-semibold text-muted">{t('heroChipKcal')}</div>
            <div className="font-display text-[22px] font-extrabold text-forest"><CountUp value={targets.kcal} format={(n) => num(Math.round(n))} /> kcal</div>
          </motion.div>
          <motion.div initial={reduce ? false : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            className="absolute -right-3 top-1/3 rounded-2xl bg-card px-4 py-3 shadow-lift ring-1 ring-line md:-right-8">
            <div className="text-[11.5px] font-semibold text-muted">{t('heroChipBasket')}</div>
            <div className="font-display text-[22px] font-extrabold">{eur(min)}</div>
            {max > min && <div className="text-[12px] font-semibold text-leaf">{t('heroChipSave')} {eur(max - min)}</div>}
          </motion.div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><DemoBadge label={t('heroSampleTag')} /><PricesChecked /></div>
        </div>
      </Container>
    </section>
  );
}

function How() {
  const { t } = useI18n();
  const steps = [1, 2, 3, 4] as const;
  return (
    <section id="how" className="py-16 md:py-24">
      <Container>
        <SectionTitle kicker={t('navHow')} title={t('howTitle2')} />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((n, i) => (
            <Reveal key={n} delay={i * 0.06}>
              <Card className="h-full p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-forest font-display text-[18px] font-extrabold text-white">{n}</div>
                <h3 className="mt-4 text-[19px] font-extrabold">{t(`how${n}` as MessageKey)}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{t(`how${n}d` as MessageKey)}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function WeekPreview() {
  const { t, lang, eur, num } = useI18n();
  const { plan } = useSamplePlan();
  const [day, setDay] = useState(0);
  const d = plan.days[day];
  return (
    <section className="bg-sage/60 py-16 md:py-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle kicker={t('navDemo')} title={t('weekPreviewTitle')} sub={t('weekPreviewSub')} />
          <DemoBadge label={t('heroSampleTag')} />
        </div>
        <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1" role="tablist">
          {plan.days.map((_, i) => (
            <button key={i} role="tab" aria-selected={day === i} type="button" onClick={() => setDay(i)}
              className={cx('shrink-0 rounded-2xl px-4 py-2.5 text-[14px] font-bold transition', day === i ? 'bg-forest text-white' : 'bg-card text-ink ring-1 ring-line hover:ring-leaf')}>
              {t(`dayS${i}` as MessageKey)}
            </button>
          ))}
        </div>
        <motion.div key={day} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.meals.map((m) => (
            <Link key={m.recipeId + m.meal} href={`/recipe/${m.recipeId}?back=/`} className="group"><Card className="h-full overflow-hidden transition group-hover:ring-leaf">
              <DishImage id={m.recipeId} alt={recipeName(m.recipeId, lang)} className="aspect-[4/3]" sizes="(max-width: 640px) 100vw, 300px" />
              <div className="p-4">
                <div className="text-[11.5px] font-bold uppercase tracking-wide text-leaf">{t(`meal_${m.meal}` as MessageKey)}</div>
                <div className="mt-1 line-clamp-2 min-h-[44px] text-[15.5px] font-bold leading-snug">{recipeName(m.recipeId, lang)}</div>
                <div className="mt-2 flex justify-between text-[13px] text-muted"><span>{num(m.kcal)} kcal · {num(m.protein)} g</span><span className="font-semibold text-ink">{eur(m.cost)}</span></div>
                <div className="mt-2 text-[12.5px] font-bold text-leaf">{t('openRecipeCta')} →</div>
              </div>
            </Card></Link>
          ))}
        </motion.div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[14px]">
          <span><b>{t('dayTotals')}:</b> {num(d.kcal)} kcal · {num(d.protein)} g {t('protein')}</span>
          <span>{t('dayCost')}: <b>{eur(d.cost)}</b> / {t('people2')}</span>
        </div>
      </Container>
    </section>
  );
}

function Compare() {
  const { t } = useI18n();
  return (
    <section className="py-16 md:py-24">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
        <div>
          <SectionTitle kicker={t('navSupermarkets')} title={t('compareTitle')} sub={t('compareSub')} />
          <p className="mt-4 text-[13px] text-muted">{t('snapshotNote')}</p>
          <Link href="/supermarkets" className="mt-5 inline-block font-semibold text-leaf hover:underline">{t('navSupermarkets')} →</Link>
        </div>
        <div><StoreComparisonTable /><div className="mt-2 text-right"><PricesChecked /></div></div>
      </Container>
    </section>
  );
}

function Calculator() {
  const { t, eur } = useI18n();
  const { min, max } = useStoreRows();
  const [spend, setSpend] = useState(80);
  const rate = max > 0 ? (max - min) / max : 0;
  const week = spend * rate;
  return (
    <section className="py-16 md:py-24">
      <Container>
        <Card className="grid gap-8 overflow-hidden bg-forest p-6 text-white md:grid-cols-2 md:p-12">
          <div>
            <h2 className="font-display text-[30px] font-extrabold leading-tight md:text-[40px]">{t('calcTitle')}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/75">{t('calcSub')}</p>
            <div className="mt-8 rounded-2xl bg-white/10 p-5 [&_label]:text-white [&_output]:text-gold">
              <Slider id="spend" label={t('calcSpend')} value={spend} min={30} max={200} step={5} suffix=" €" onChange={setSpend} />
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-white p-6 text-ink md:p-8">
            <div className="text-[14px] font-semibold text-muted">{t('calcResultWeek')}</div>
            <div className="font-display text-[48px] font-extrabold tracking-tight text-leaf md:text-[60px]"><CountUp value={week} format={(n) => eur(n)} /></div>
            <div className="text-[15px] text-muted">≈ <b className="text-ink"><CountUp value={week * 52} format={(n) => eur(Math.round(n))} /></b> {t('calcResultYear')}</div>
            <div className="mt-4 flex items-center gap-2"><DemoBadge label={t('illustrative')} /><span className="text-[12px] text-muted">{Math.round(rate * 100)}%</span></div>
          </div>
        </Card>
      </Container>
    </section>
  );
}

const SUGGEST: Record<'lt' | 'ru', string[]> = {
  lt: ['Pakeisk šiandienos vakarienę pigesne', 'Daugiau baltymų', 'Vegetariškai', 'Tik Lidl', 'Dviem žmonėms'],
  ru: ['Замени сегодняшний ужин на дешевле', 'Больше белка', 'Вегетарианское меню', 'Только Lidl', 'На двоих'],
};

export function AssistantPreview() {
  const { t, lang, eur } = useI18n();
  const { plan } = useSamplePlan();
  const [text, setText] = useState('');
  const [state, setState] = useState<{ notes: Note[]; day: number; plan: typeof plan } | null>(null);
  const run = (msg: string) => {
    setText(msg);
    const intent = parseRules(msg, 0);
    const r = applyIntent(SAMPLE_ANSWERS, plan, intent, [], 5);
    const changedDay = intent.actions.find((a) => a.day !== null)?.day ?? 0;
    setState({ notes: r.notes, day: changedDay, plan: r.plan ?? plan });
  };
  const before = useMemo(() => plan.days[state?.day ?? 0], [plan, state]);
  const after = state?.plan.days[state.day];
  return (
    <section className="bg-sage/60 py-16 md:py-24">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <div>
          <SectionTitle kicker={t('aiAssistant')} title={t('assistantTitle')} sub={t('assistantSub')} />
          <div className="mt-6 flex flex-wrap gap-2">
            {SUGGEST[lang].map((s) => <button key={s} type="button" onClick={() => run(s)} className="rounded-full bg-card px-3.5 py-2 text-[13.5px] font-semibold ring-1 ring-line hover:ring-leaf">{s}</button>)}
          </div>
          <p className="mt-4 text-[12.5px] text-muted">{t('aiDemoNote')}</p>
        </div>
        <Card className="p-4 md:p-6">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) run(text.trim()); }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('assistantPlaceholder')} aria-label={t('assistantPlaceholder')}
              className="min-w-0 flex-1 rounded-xl bg-paper px-3.5 py-3 text-[15px] ring-1 ring-line outline-none focus:ring-2 focus:ring-leaf" />
            <button type="submit" className="rounded-xl bg-leaf px-4 font-semibold text-white">{t('send')}</button>
          </form>
          {!state && <p className="mt-5 rounded-2xl bg-paper p-4 text-[14.5px] text-muted">{t('assistantHello')}</p>}
          {state && (
            <div className="mt-5 space-y-3">
              {state.notes.length === 0 && <p className="rounded-2xl bg-paper p-4 text-[14.5px]">{t('assistantNothing')}</p>}
              {state.notes.map((n, i) => (
                <p key={i} className={cx('rounded-2xl p-3.5 text-[14.5px]', n.kind === 'ok' ? 'bg-sage text-forest' : 'bg-danger/10 text-danger')}>{n.kind === 'ok' ? '✓ ' : '! '}{t(n.key as MessageKey, n.vars)}</p>
              ))}
              {after && (
                <div className="rounded-2xl ring-1 ring-line">
                  <div className="border-b border-line px-4 py-2 text-[12px] font-bold uppercase text-muted">{t(`day${state.day}` as MessageKey)}</div>
                  {after.meals.map((m, i) => {
                    const old = before.meals[i];
                    const changed = old && old.recipeId !== m.recipeId;
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-2.5 text-[14px] last:border-0">
                        <span className="min-w-0"><span className="mr-2 text-[11px] font-bold uppercase text-leaf">{t(`meal_${m.meal}` as MessageKey)}</span>
                          {changed && <s className="mr-1 text-muted">{recipeName(old.recipeId, lang)}</s>}<b className={changed ? 'text-forest' : ''}>{recipeName(m.recipeId, lang)}</b></span>
                        <span className="shrink-0 tabular-nums text-muted">{eur(m.cost)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Card>
      </Container>
    </section>
  );
}

function Benefits() {
  const { t } = useI18n();
  const icons = ['🍽️', '🏷️', '💶', '🛡️', '👨‍👩‍👧', '🌐'];
  return (
    <section className="py-16 md:py-24">
      <Container>
        <SectionTitle kicker="Lėkštė" title={t('benefitsTitle')} />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {([1, 2, 3, 4, 5, 6] as const).map((n, i) => (
            <Reveal key={n} delay={i * 0.04}>
              <Card className="h-full p-6">
                <div className="text-[28px]" aria-hidden>{icons[i]}</div>
                <h3 className="mt-3 text-[18px] font-extrabold">{t(`b${n}` as MessageKey)}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{t(`b${n}d` as MessageKey)}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Pricing() {
  const { t } = useI18n();
  return (
    <section id="pricing" className="bg-sage/60 py-16 md:py-24">
      <Container>
        <SectionTitle center kicker={t('navPricing')} title={t('pricingTitle2')} sub={t('pricingSub2')} />
        <div className="mt-10"><PricingCards /></div>
      </Container>
    </section>
  );
}

function FaqSection() {
  const { t } = useI18n();
  return (
    <section className="py-16 md:py-24">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <SectionTitle kicker={t('navFaq')} title={t('faqTitle')} />
          <Link href="/faq" className="mt-5 inline-block font-semibold text-leaf hover:underline">{t('faqMore')} →</Link>
        </div>
        <Faq limit={6} />
      </Container>
    </section>
  );
}

function FinalCta() {
  const { t } = useI18n();
  return (
    <Container>
      <div className="relative overflow-hidden rounded-xl3 bg-ink px-6 py-14 text-center text-white md:py-20">
        <Image src="/img/site/produce.jpg" alt="" fill sizes="1200px" className="object-cover opacity-25" />
        <div className="relative">
          <h2 className="font-display text-[34px] font-extrabold leading-tight md:text-[52px]">{t('brandPromise')}</h2>
          <ButtonLink href="/onboarding" size="lg" variant="gold" className="mt-8">{t('ctaCreate')} →</ButtonLink>
        </div>
      </div>
    </Container>
  );
}

export function Landing() {
  return (<><Hero /><How /><WeekPreview /><Compare /><Calculator /><AssistantPreview /><Benefits /><Pricing /><FaqSection /><FinalCta /></>);
}
