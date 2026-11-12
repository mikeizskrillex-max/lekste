'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { RetailerId } from '@/config/markets';
import { effectiveTargets } from '@/domain/nutrition';
import { buildPlan, weeklyNeed } from '@/domain/planner';
import { strategies } from '@/domain/pricing';
import type { Goal, QuizAnswers } from '@/domain/types';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { EXCLUSIONS, exclusionOn, recipeName, SAMPLE_ANSWERS, toggleExclusion } from '@/lib/view';
import { DEFAULT_CATALOG, retailersWithData, SNAPSHOT_RECORDS } from '@/retail/catalog';
import { RETAILER_ORDER, RETAILERS } from '@/retail/retailers';
import { Faq, PricesChecked, PricingCards, StoreComparisonTable } from './marketing';
import { AssistantPreview } from './landing';
import { Badge, ButtonLink, Card, Chip, Container, DemoBadge, DishImage, SectionTitle, Slider, Stat, cx } from './ui';

export function PageHero({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) {
  return <Container className="pb-6 pt-12 md:pt-16"><SectionTitle kicker={kicker} title={title} sub={sub} /></Container>;
}

export function HowItWorksPage() {
  const { t } = useI18n();
  const img = ['/img/site/bowl.jpg', '/img/site/veggies.jpg', '/img/site/mealbowl.jpg', '/img/site/supermarket.jpg'];
  return (
    <>
      <PageHero kicker={t('navHow')} title={t('howTitle2')} sub={t('howPageSub')} />
      <Container className="space-y-6">
        {([1, 2, 3, 4] as const).map((n, i) => (
          <Card key={n} className={cx('grid overflow-hidden md:grid-cols-2', i % 2 === 1 && 'md:[&>div:first-child]:order-2')}>
            <div className="relative min-h-[220px]"><Image src={img[i]} alt="" fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" /></div>
            <div className="p-6 md:p-10">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-forest font-display font-extrabold text-white">{n}</div>
              <h2 className="mt-4 font-display text-[26px] font-extrabold">{t(`how${n}` as MessageKey)}</h2>
              <p className="mt-2 text-[16px] text-muted">{t(`how${n}d` as MessageKey)}</p>
              <p className="mt-4 text-[15px] leading-relaxed">{t(`howDeep${n}` as MessageKey)}</p>
            </div>
          </Card>
        ))}
        <div className="pt-6 text-center"><ButtonLink href="/onboarding" size="lg">{t('ctaCreate')} →</ButtonLink></div>
        <p className="text-center text-[12.5px] text-muted">{t('medicalDisclaimer')}</p>
      </Container>
    </>
  );
}

export function PricingPage() {
  const { t } = useI18n();
  return (
    <>
      <PageHero kicker={t('navPricing')} title={t('pricingTitle2')} sub={t('pricingSub2')} />
      <Container><PricingCards /><div className="mt-12"><Faq /></div></Container>
    </>
  );
}

export function FaqPage() {
  const { t } = useI18n();
  return (<><PageHero kicker={t('navFaq')} title={t('faqTitle')} /><Container className="max-w-[860px]"><Faq /></Container></>);
}

export function SupermarketsPage() {
  const { t, pick, num, date } = useI18n();
  const withData = retailersWithData(DEFAULT_CATALOG);
  return (
    <>
      <PageHero kicker={t('navSupermarkets')} title={t('compareTitle2')} sub={t('supermarketsSub')} />
      <Container className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {RETAILER_ORDER.map((id) => {
            const r = RETAILERS[id];
            const recs = SNAPSHOT_RECORDS.filter((x) => x.retailer === id);
            const last = recs.map((x) => x.retrievedAt).sort().pop();
            return (
              <Card key={id} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5"><span className="h-3 w-3 rounded-full" style={{ background: r.color }} /><h2 className="text-[19px] font-extrabold">{r.name}</h2></div>
                  <Badge tone={r.status === 'snapshot' ? 'leaf' : 'line'}>{t(`status_${r.status}` as MessageKey)}</Badge>
                </div>
                <p className="mt-3 text-[14px] text-muted">{pick(r.note)}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-[13px]">
                  <dt className="text-muted">{t('productsWithPrice')}</dt><dd className="text-right font-semibold">{num(recs.length)}</dd>
                  <dt className="text-muted">{t('lastUpdate')}</dt><dd className="text-right font-semibold">{last ? date(last, { day: 'numeric', month: 'short', year: 'numeric' }) : t('never')}</dd>
                  <dt className="text-muted">{t('source')}</dt><dd className="text-right font-semibold">{r.method === 'public_catalog' ? t('srcPublic') : t('srcCsv')}</dd>
                </dl>
                <a href={r.website} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-[13.5px] font-semibold text-leaf hover:underline">{r.website.replace('https://', '')} ↗</a>
              </Card>
            );
          })}
        </div>
        <div>
          <h2 className="mb-4 font-display text-[24px] font-extrabold">{t('compareTitle')}</h2>
          <StoreComparisonTable />
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-[12.5px] text-muted"><span>{t('snapshotNote')}</span><PricesChecked /></div>
          <p className="mt-2 text-[12.5px] text-muted">{withData.length}/{RETAILER_ORDER.length} · {t('noOrdering')}</p>
        </div>
      </Container>
    </>
  );
}

export function DemoPage() {
  const { t, lang, eur, num } = useI18n();
  const [a, setA] = useState<QuizAnswers>(SAMPLE_ANSWERS);
  const [day, setDay] = useState(0);
  const set = (p: Partial<QuizAnswers>) => setA((x) => ({ ...x, ...p }));
  const res = useMemo(() => {
    const targets = effectiveTargets(a);
    const plan = buildPlan(a, targets, 3);
    const st = strategies(weeklyNeed(plan, a.household), RETAILER_ORDER, a.stores as RetailerId[], a.travelCost ?? 0, DEFAULT_CATALOG);
    return { targets, plan, st };
  }, [a]);
  const d = res.plan.days[day];
  const best = res.st.multi;
  return (
    <>
      <PageHero kicker={t('navDemo')} title={t('demoTitle')} sub={t('demoSub')} />
      <Container className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit space-y-6 p-5 lg:sticky lg:top-24">
          <div>
            <div className="mb-2 text-[13.5px] font-semibold">{t('qGoal')}</div>
            <div className="flex flex-wrap gap-2">{(['lose', 'keep', 'gain', 'healthy'] as Goal[]).map((g) => <Chip key={g} on={a.goal === g} onClick={() => set({ goal: g })}>{t(`goal_${g}` as MessageKey)}</Chip>)}</div>
          </div>
          <Slider id="d-budget" label={t('weeklyBudgetLabel')} value={a.weeklyBudget} min={30} max={150} step={5} suffix=" €" onChange={(v) => set({ weeklyBudget: v })} />
          <Slider id="d-hh" label={t('household')} value={a.household} min={1} max={6} onChange={(v) => set({ household: v })} />
          <div>
            <div className="mb-2 text-[13.5px] font-semibold">{t('q8')}</div>
            <div className="flex flex-wrap gap-2">{EXCLUSIONS.map((e) => <Chip key={e} on={exclusionOn(a, e)} onClick={() => set(toggleExclusion(a, e))}>{t(`ex_${e}` as MessageKey)}</Chip>)}</div>
          </div>
          <DemoBadge label={t('demoData')} />
        </Card>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label={t('dailyTarget')} value={`${num(res.targets.kcal)}`} sub="kcal" />
            <Stat label={t('proteinG')} value={num(res.targets.protein)} sub="g" />
            <Stat label={t('bestBasket')} value={best ? eur(best.total) : '—'} sub={best ? t('visits', { n: best.visits }) : t('noData')} />
            <Stat label={t('weeklyBudgetLabel')} value={eur(a.weeklyBudget)} sub={best && best.total > a.weeklyBudget ? <span className="text-danger">+{eur(best.total - a.weeklyBudget)}</span> : '✓'} />
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {res.plan.days.map((_, i) => <Chip key={i} on={day === i} onClick={() => setDay(i)}>{t(`dayS${i}` as MessageKey)}</Chip>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {d.meals.map((m) => (
              <Card key={m.recipeId + m.meal} className="flex gap-3 overflow-hidden p-2.5">
                <DishImage id={m.recipeId} alt={recipeName(m.recipeId, lang)} className="h-20 w-20 shrink-0 rounded-xl" sizes="80px" />
                <div className="min-w-0 py-1">
                  <div className="text-[11px] font-bold uppercase text-leaf">{t(`meal_${m.meal}` as MessageKey)}</div>
                  <div className="line-clamp-2 text-[14.5px] font-bold leading-snug">{recipeName(m.recipeId, lang)}</div>
                  <div className="mt-1 text-[12.5px] text-muted">{num(m.kcal)} kcal · {num(m.protein)} g · {eur(m.cost)}</div>
                </div>
              </Card>
            ))}
          </div>
          {res.plan.issues.length > 0 && <p className="rounded-2xl bg-gold/20 p-3 text-[13.5px]">{t('infeasibleRecipes')}</p>}
          <div className="text-center"><ButtonLink href="/onboarding" size="lg">{t('ctaCreate')} →</ButtonLink></div>
        </div>
      </Container>
      <div className="mt-16"><AssistantPreview /></div>
    </>
  );
}

const LEGAL: Record<'privacy' | 'terms', Record<'lt' | 'ru', [string, string][]>> = {
  privacy: {
    lt: [
      ['Duomenų valdytojas', 'Paslaugos teikėjas: [įmonės pavadinimas, kodas, adresas — bus nurodyta prieš paleidimą]. Kontaktai: [el. paštas].'],
      ['Kokius duomenis tvarkome', 'El. paštas; anketos atsakymai (tikslas, lytis, amžius, ūgis, svoris, aktyvumas, alergijos ir mitybos apribojimai); meniu, pirkinių ir apsipirkimų įrašai; prenumeratos būsena (mokėjimus tvarko Stripe, kortelės duomenų nesaugome).'],
      ['Sveikatos duomenys (BDAR 9 str.)', 'Ūgis, svoris, tikslas ir alergijos gali būti laikomi sveikatos duomenimis. Juos tvarkome tik gavę jūsų aiškų atskirą sutikimą ir tik mitybos planui sudaryti. Sutikimą galite bet kada atšaukti nustatymuose — tuomet planas ištrinamas.'],
      ['AI tiekėjai', 'AI asistentui siunčiame tik jūsų žinutę ir bendrus pageidavimus (valgymų skaičius, žmonių skaičius, mitybos tipas, parduotuvės). Svorio, ūgio, amžiaus ar sveikatos duomenų AI tiekėjams nesiunčiame.'],
      ['Saugojimo terminas', 'Kol turite paskyrą. Ištrynus paskyrą duomenys pašalinami per 30 dienų, išskyrus apskaitos dokumentus, kuriuos privalome saugoti pagal įstatymą.'],
      ['Jūsų teisės', 'Susipažinti, ištaisyti, ištrinti, apriboti, perkelti (JSON eksportas nustatymuose), nesutikti ir pateikti skundą Valstybinei duomenų apsaugos inspekcijai (vdai.lrv.lt).'],
      ['Slapukai', 'Naudojame tik būtinus slapukus (prisijungimas, kalba). Analitikos ar reklamos slapukų nenaudojame.'],
    ],
    ru: [
      ['Контролёр данных', 'Поставщик услуги: [название компании, код, адрес — будет указано до запуска]. Контакты: [email].'],
      ['Какие данные мы обрабатываем', 'Email; ответы анкеты (цель, пол, возраст, рост, вес, активность, аллергии и ограничения питания); меню, списки и записи покупок; статус подписки (платежи обрабатывает Stripe, данные карты мы не храним).'],
      ['Данные о здоровье (ст. 9 GDPR)', 'Рост, вес, цель и аллергии могут считаться данными о здоровье. Мы обрабатываем их только с вашего явного отдельного согласия и только для плана питания. Согласие можно отозвать в настройках — тогда план удаляется.'],
      ['AI-провайдеры', 'AI-ассистенту передаём только ваше сообщение и общие предпочтения (число приёмов пищи, людей, тип питания, магазины). Вес, рост, возраст и данные о здоровье AI-провайдерам не передаются.'],
      ['Срок хранения', 'Пока у вас есть аккаунт. После удаления аккаунта данные удаляются в течение 30 дней, кроме бухгалтерских документов, которые мы обязаны хранить по закону.'],
      ['Ваши права', 'Доступ, исправление, удаление, ограничение, перенос (экспорт JSON в настройках), возражение и жалоба в Государственную инспекцию по защите данных (vdai.lrv.lt).'],
      ['Cookies', 'Используем только необходимые cookies (вход, язык). Аналитических и рекламных cookies нет.'],
    ],
  },
  terms: {
    lt: [
      ['Paslauga', 'Lėkštė sudaro asmeninį savaitės meniu, pirkinių sąrašą ir lygina prekybos centrų kainas. Prekių užsakymų už jus neteikiame.'],
      ['Ne medicininė paslauga', 'Paslauga nėra medicininė diagnozė ar gydymas. Sergant, esant nėštumui, žindant ar turint valgymo sutrikimą, pasitarkite su gydytoju.'],
      ['Kainos', 'Prekybos centrų kainos rodomos su šaltiniu ir patikrinimo data. Tai nėra realaus laiko kainos — parduotuvėje kaina gali skirtis. Alergenų informaciją visada patikrinkite ant pakuotės.'],
      ['Prenumerata', 'Prenumerata atsinaujina automatiškai, kol jos neatšaukiate. Prieš kiekvieną nuskaitymą primename el. paštu prieš 3 dienas. Atšaukus prieiga lieka iki apmokėto laikotarpio pabaigos.'],
      ['Teisė atsisakyti', 'Vartotojai turi 14 dienų teisę atsisakyti. Jei prašote paslaugą pradėti iš karto ir gaunate meniu, ši teisė gali būti prarasta (Civilinio kodekso 6.228¹⁰ str.).'],
      ['Grąžinimai', 'Grąžinimo prašymą galite pateikti paskyroje; atsakome per 14 dienų.'],
    ],
    ru: [
      ['Услуга', 'Lėkštė составляет личное меню на неделю, список покупок и сравнивает цены супермаркетов. Мы не оформляем заказы за вас.'],
      ['Не медицинская услуга', 'Услуга не является медицинской диагностикой или лечением. При заболеваниях, беременности, кормлении грудью или расстройстве пищевого поведения посоветуйтесь с врачом.'],
      ['Цены', 'Цены супермаркетов показываются с источником и датой проверки. Это не цены в реальном времени — в магазине цена может отличаться. Информацию об аллергенах всегда проверяйте на упаковке.'],
      ['Подписка', 'Подписка продлевается автоматически, пока вы её не отмените. Перед каждым списанием напоминаем на email за 3 дня. После отмены доступ сохраняется до конца оплаченного периода.'],
      ['Право отказа', 'Потребители имеют 14-дневное право отказа. Если вы просите начать услугу сразу и получаете меню, это право может быть утрачено (ст. 6.228¹⁰ Гражданского кодекса ЛР).'],
      ['Возвраты', 'Запрос на возврат можно отправить в кабинете; отвечаем в течение 14 дней.'],
    ],
  },
};

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const { t, lang } = useI18n();
  return (
    <>
      <PageHero title={t(kind)} sub="2026-11-12" />
      <Container className="max-w-[820px] space-y-6">
        <p className="rounded-2xl bg-gold/20 p-4 text-[13.5px]">{lang === 'lt' ? 'Juodraštis: prieš paleidimą turi peržiūrėti teisininkas.' : 'Черновик: перед запуском должен проверить юрист.'}</p>
        {LEGAL[kind][lang].map(([h, p]) => (<section key={h}><h2 className="text-[20px] font-extrabold">{h}</h2><p className="mt-2 text-[15.5px] leading-relaxed text-ink/85">{p}</p></section>))}
      </Container>
    </>
  );
}

