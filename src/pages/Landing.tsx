import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CountUp, Rise, Thumb, TopBar } from '../components/ui';
import { formatEur, useI18n } from '../i18n/I18n';
import type { StringKey } from '../i18n/strings';

const BUBBLES = [
  { e: '🍳', k: 390, p: 0.8, lt: 'Omletas su daržovėmis', ru: 'Омлет с овощами', pos: 'left-[4%] top-[10%]', bg: 'bg-warm', d: 0 },
  { e: '🍗', k: 610, p: 1.8, lt: 'Vištiena su grikiais', ru: 'Курица с гречкой', pos: 'right-[3%] top-[6%]', bg: 'bg-peach', d: 1.4 },
  { e: '🥑', k: 160, p: 0.6, lt: 'Pusė avokado', ru: 'Половинка авокадо', pos: 'left-[1%] top-[56%]', bg: 'bg-leaf', d: 0.7 },
  { e: '🐟', k: 540, p: 2.4, lt: 'Lašiša su ryžiais', ru: 'Лосось с рисом', pos: 'right-[2%] top-[50%]', bg: 'bg-rose', d: 2.1 },
  { e: '🍌', k: 105, p: 0.25, lt: 'Bananas', ru: 'Банан', pos: 'left-[30%] top-[83%]', bg: 'bg-warm', d: 2.8 },
];

const EXAMPLE_DAY = [
  { e: '🥣', lt: 'Avižinė košė su uogomis', ru: 'Овсянка с ягодами', k: 420, p: 0.9 },
  { e: '🍗', lt: 'Vištiena su grikiais', ru: 'Курица с гречкой', k: 520, p: 1.8 },
  { e: '🍎', lt: 'Obuolys ir riešutai', ru: 'Яблоко и орехи', k: 210, p: 0.5 },
  { e: '🐟', lt: 'Menkė su daržovėmis', ru: 'Треска с овощами', k: 440, p: 1.4 },
];

export function Landing() {
  const { t, lang, pick } = useI18n();
  const nav = useNavigate();
  const reduce = useReducedMotion();
  const [tip, setTip] = useState<number | null>(null);
  const eur = (n: number) => formatEur(n, lang);

  return (
    <div className="min-h-screen bg-bg">
      <TopBar right={<Link to="/app" className="text-[13px] font-semibold text-muted">{t('login')}</Link>} />

      <main className="container-app pb-16">
        {/* Hero */}
        <section className="pt-2">
          <div className="relative -mx-4 h-[300px] overflow-hidden">
            <motion.div
              className="absolute left-1/2 top-1/2 grid h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-[0_20px_40px_-18px_rgba(20,61,43,.5)]"
              style={{ background: 'radial-gradient(circle at 50% 45%, rgb(var(--surface)) 0 52%, rgb(var(--leaf)) 53% 100%)' }}
              animate={reduce ? undefined : { scale: [1, 1.04, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="text-center">
                <div className="font-display text-[28px] font-extrabold leading-none"><CountUp value={1850} format={(n) => Math.round(n).toLocaleString(lang === 'lt' ? 'lt-LT' : 'ru-RU')} /></div>
                <div className="mt-1 text-[11px] font-semibold text-muted">{t('perDayLabel')}</div>
              </div>
            </motion.div>

            {BUBBLES.map((b, i) => (
              <motion.button
                key={b.e} type="button" onClick={() => setTip(i)}
                className={`absolute ${b.pos} flex items-center gap-1.5 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-3 text-[12.5px] font-bold shadow-[0_10px_24px_-14px_rgba(20,61,43,.6)]`}
                animate={reduce ? undefined : { y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: b.d }}
                whileTap={{ scale: 1.2 }}
                aria-label={`${pick(b)} ${b.k} ${t('kcal')}`}
              >
                <span className={`grid h-8 w-8 place-items-center rounded-full ${b.bg} text-[19px]`}>{b.e}</span>
                {b.k} {t('kcal')}
              </motion.button>
            ))}

            <AnimatePresence>
              {tip !== null && (
                <motion.div key={tip} role="status"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  onAnimationComplete={() => setTimeout(() => setTip((x) => (x === tip ? null : x)), 2000)}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-deep px-3.5 py-2 text-[12.5px] font-semibold text-white">
                  {pick(BUBBLES[tip])} · {BUBBLES[tip].k} {t('kcal')} · {eur(BUBBLES[tip].p)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <h1 className="h1">{t('heroTitle')}</h1>
          <p className="mt-2.5 text-muted">{t('heroSub')}</p>
          <button type="button" className="btn mt-4" onClick={() => nav('/quiz')}>{t('heroCta')}</button>
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-muted">
            <span>✓ {t('trust1')}</span><span>✓ {t('trust2')}</span><span>✓ {t('trust3')}</span>
          </div>
        </section>

        {/* How */}
        <section className="mt-12">
          <h2 className="h2 mb-3">{t('howTitle')}</h2>
          <div className="grid gap-2.5">
            {(['1', '2', '3'] as const).map((n, i) => (
              <Rise key={n} i={i}>
                <div className="card flex items-center gap-3 p-3">
                  <Thumb emoji={['📝', '🍽️', '🛒'][i]} i={[2, 0, 1][i]} size="h-12 w-12 text-[24px]" />
                  <div>
                    <div className="font-bold">{t(`how${n}t` as StringKey)}</div>
                    <div className="text-[13px] text-muted">{t(`how${n}d` as StringKey)}</div>
                  </div>
                </div>
              </Rise>
            ))}
          </div>
        </section>

        {/* Example day */}
        <section className="mt-12">
          <h2 className="h2 mb-3">{t('dayTitle')}</h2>
          <div className="grid gap-2">
            {EXAMPLE_DAY.map((m, i) => (
              <Rise key={m.e + i} i={i}>
                <div className="card flex items-center gap-3 p-2.5">
                  <Thumb emoji={m.e} i={i} size="h-11 w-11 text-[22px]" />
                  <div className="min-w-0 flex-1 font-semibold">{pick(m)}</div>
                  <div className="text-right text-[12px] text-muted"><div className="font-bold text-accent">{m.k} {t('kcal')}</div>{eur(m.p)}</div>
                </div>
              </Rise>
            ))}
            <div className="rounded-btn bg-soft px-3.5 py-2.5 font-bold text-accent">{t('dayTotal')}: 1 590 {t('kcal')} · {eur(4.6)}</div>
          </div>
        </section>

        {/* Why */}
        <section className="mt-12">
          <h2 className="h2 mb-3">{t('whyTitle')}</h2>
          <div className="grid gap-2.5">
            {(['1', '2', '3'] as const).map((n) => (
              <div key={n} className="card p-4">
                <div className="font-bold">{t(`why${n}t` as StringKey)}</div>
                <p className="mt-1 text-[14px] text-muted">{t(`why${n}d` as StringKey)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Savings example */}
        <section className="mt-12 rounded-card bg-deep p-5 text-white">
          <div className="text-[12px] font-bold uppercase tracking-[.12em] text-leaf">{t('saveTitle')}</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div><div className="text-[12px] opacity-75">{t('saveUsual')}</div><div className="font-display text-[28px] font-extrabold line-through opacity-60"><CountUp value={80} format={(n) => eur(n)} /></div></div>
            <div><div className="text-[12px] opacity-75">{t('saveOurs')}</div><div className="font-display text-[28px] font-extrabold text-leaf"><CountUp value={52} format={(n) => eur(n)} /></div></div>
          </div>
          <div className="mt-1 text-[12px] opacity-75">{t('perWeek')}</div>
        </section>

        <Pricing />

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="h2 mb-3">{t('faqTitle')}</h2>
          <div className="grid gap-2">
            {(['1', '2', '3', '4', '5'] as const).map((n) => (
              <details key={n} className="card group p-4">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">{t(`faq${n}q` as StringKey)}</summary>
                <p className="mt-2 text-[14px] text-muted">{t(`faq${n}a` as StringKey)}</p>
              </details>
            ))}
          </div>
        </section>

        <button type="button" className="btn mt-10" onClick={() => nav('/quiz')}>{t('heroCta')}</button>

        <footer className="mt-10 grid gap-1 text-center text-[12px] text-muted">
          <div className="flex justify-center gap-4"><Link to="/privacy">{t('privacy')}</Link><Link to="/terms">{t('terms')}</Link></div>
          <div>{t('notMedical')}</div>
          <div>© Lėkštė</div>
        </footer>
      </main>
    </div>
  );
}

export function Pricing({ onPick }: { onPick?: (plan: '2w' | '1m' | '3m') => void }) {
  const { t, lang } = useI18n();
  const eur = (n: number) => formatEur(n, lang);
  const [sel, setSel] = useState<'2w' | '1m' | '3m'>('1m');
  const plans = [
    { id: '2w' as const, name: t('plan2w'), note: t('plan2wNote'), price: 9.99 },
    { id: '1m' as const, name: t('plan1m'), note: t('plan1mNote'), price: 12.99, popular: true },
    { id: '3m' as const, name: t('plan3m'), note: t('plan3mNote'), price: 29.99 },
  ];
  return (
    <section className="mt-12">
      <h2 className="h2 mb-3">{onPick ? t('choosePlan') : t('pricesTitle')}</h2>
      <div className="grid gap-2.5">
        {plans.map((p) => (
          <button key={p.id} type="button" aria-pressed={sel === p.id} onClick={() => setSel(p.id)}
            className="relative rounded-btn border-2 border-line bg-surface p-3.5 text-left transition aria-pressed:border-accent aria-pressed:bg-soft">
            {p.popular && <span className="absolute -top-2.5 right-3 rounded-full bg-warm px-2 py-0.5 text-[10px] font-extrabold text-[#4a3200]">{t('popular')}</span>}
            <div className="flex items-center justify-between font-bold"><span>{p.name}</span><span className="tabular">{eur(p.price)}</span></div>
            <div className="text-[12px] text-muted">{p.note}</div>
          </button>
        ))}
      </div>
      <ul className="mt-3 grid gap-1 text-[13px]">
        <li>✓ {t('g1')}</li><li>✓ {t('g2')}</li><li>✓ {t('g3')}</li>
      </ul>
      {onPick
        ? <button type="button" className="btn mt-4" onClick={() => onPick(sel)}>{t('pay')} · {eur(plans.find((p) => p.id === sel)!.price)}</button>
        : <Link to="/quiz" className="btn mt-4">{t('heroCta')}</Link>}
    </section>
  );
}
