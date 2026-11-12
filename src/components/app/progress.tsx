'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { recipeFacts } from '@/domain/recipeFacts';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { recipeById } from '@/lib/view';
import { useStore } from '@/state/store';
import { PageTitle } from '../appshell';
import { Button, Card, Chip, Stat, inputCls } from '../ui';
import { dateOfDay } from './meal';

const C = { forest: '#174B35', leaf: '#31966A', gold: '#F0B95B', line: '#E3E2DA', muted: '#5E6B63' };
const axis = { fontSize: 12, fill: C.muted };

export function ProgressPage() {
  const { t, eur, num, date } = useI18n();
  const { plan, targets, purchases, weights, trackWeight, addWeight, done, answers, weekEconomics } = useStore();
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [kg, setKg] = useState('');
  const since = Date.now() - range * 86400000;

  const nutrition = useMemo(() => {
    if (!plan) return null;
    const days = plan.days.map((d, i) => {
      const m = d.meals.reduce((acc, x) => {
        const r = recipeById(x.recipeId); if (!r) return acc;
        const f = recipeFacts(r);
        return { p: acc.p + f.protein * x.servings, f: acc.f + f.fat * x.servings, c: acc.c + f.carbs * x.servings };
      }, { p: 0, f: 0, c: 0 });
      return { name: t(`dayS${i}` as MessageKey), kcal: Math.round(d.kcal), ...m };
    });
    const avg = (k: 'p' | 'f' | 'c') => days.reduce((s, d) => s + d[k], 0) / days.length;
    return { days, pie: [{ name: t('protein'), v: avg('p') * 4, c: C.leaf }, { name: t('carbs'), v: avg('c') * 4, c: C.gold }, { name: t('fat'), v: avg('f') * 9, c: C.forest }] };
  }, [plan, t]);

  if (!plan || !nutrition) return null;
  const econ = weekEconomics();
  const pRange = purchases.filter((p) => Date.parse(p.date) >= since);
  const spent = pRange.reduce((s, p) => s + p.paid, 0);
  const verified = pRange.reduce((s, p) => s + Math.max(0, p.reference - p.paid), 0);
  const mealsWeek = plan.days.reduce((s, d) => s + d.meals.length, 0);
  const cooked = Object.entries(done).filter(([d]) => Date.parse(d) >= since).reduce((s, [, l]) => s + l.length, 0);
  const wRange = weights.filter((w) => Date.parse(w.date) >= since);
  const thisWeekCooked = plan.days.reduce((s, _, i) => s + (done[dateOfDay(i)]?.length ?? 0), 0);

  return (
    <>
      <PageTitle title={t('tabProgress2')} right={<div className="flex gap-2">{([7, 30, 90] as const).map((r) => <Chip key={r} on={range === r} onClick={() => setRange(r)}>{t(`range${r}` as MessageKey)}</Chip>)}</div>} />

      <h2 className="mb-3 text-[18px] font-extrabold">{t('nutritionStats')}</h2>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-4">
          <div className="mb-2 text-[13px] font-semibold text-muted">{t('kcalPerDay')} · {t('plannedLabel')}</div>
          <div className="h-[240px]">
            <ResponsiveContainer>
              <BarChart data={nutrition.days} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={C.line} />
                <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#E9F1E9' }} formatter={(v: number) => [`${num(v)} kcal`, t('plannedLabel')]} />
                <ReferenceLine y={targets.kcal} stroke={C.gold} strokeDasharray="4 4" label={{ value: t('targetLine'), fill: C.muted, fontSize: 11, position: 'insideTopRight' }} />
                <Bar dataKey="kcal" fill={C.leaf} radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-2 text-[13px] font-semibold text-muted">{t('macroSplit')}</div>
          <div className="h-[240px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={nutrition.pie} dataKey="v" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="#fff">
                  {nutrition.pie.map((p) => <Cell key={p.name} fill={p.c} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${num(v)} kcal`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-[18px] font-extrabold">{t('financeStats')}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t('estimatedSavings')} value={eur(econ.saving)} sub={t('perWeek')} />
        <Stat label={t('verifiedSavings')} value={eur(verified)} sub={t('verifiedSavingsNote')} />
        <Stat label={t('spending')} value={eur(spent)} sub={t(`range${range}` as MessageKey)} />
        <Stat label={t('costPerMeal')} value={eur(econ.best / Math.max(1, mealsWeek * answers.household))} sub={`${t('costPerPerson')}: ${eur(econ.best / answers.household)}`} />
      </div>
      <Card className="mt-4 p-4">
        {pRange.length ? (
          <div className="h-[240px]">
            <ResponsiveContainer>
              <LineChart data={pRange.map((p) => ({ d: date(p.date, { day: 'numeric', month: 'short' }), paid: +p.paid.toFixed(2), ref: +p.reference.toFixed(2) }))} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={C.line} />
                <XAxis dataKey="d" tick={axis} axisLine={false} tickLine={false} />
                <YAxis tick={axis} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => eur(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="paid" name={t('paidLabel')} stroke={C.leaf} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="ref" name={t('referenceLabel')} stroke={C.muted} strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="py-8 text-center text-[14px] text-muted">{t('noRecordsYet')}</p>}
      </Card>

      <h2 className="mb-3 mt-8 text-[18px] font-extrabold">{t('personalStats')}</h2>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-4">
          <div className="mb-2 text-[13px] font-semibold text-muted">{t('weightTracking')}</div>
          {!trackWeight ? <p className="py-8 text-center text-[14px] text-muted">{t('weightOff')}</p> : wRange.length > 1 ? (
            <div className="h-[220px]">
              <ResponsiveContainer>
                <LineChart data={wRange.map((w) => ({ d: date(w.date, { day: 'numeric', month: 'short' }), kg: w.kg }))} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={C.line} />
                  <XAxis dataKey="d" tick={axis} axisLine={false} tickLine={false} />
                  <YAxis tick={axis} axisLine={false} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip formatter={(v: number) => `${v} kg`} />
                  <Line type="monotone" dataKey="kg" stroke={C.forest} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="py-8 text-center text-[14px] text-muted">{t('noWeights')}</p>}
          {trackWeight && (
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = Number(kg.replace(',', '.')); if (n >= 30 && n <= 300) { addWeight(n); setKg(''); } }}>
              <input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="72.5" aria-label={t('weight')} className={inputCls} />
              <Button type="submit">{t('addWeightBtn')}</Button>
            </form>
          )}
        </Card>
        <div className="grid gap-3">
          <Stat label={t('mealsCooked')} value={num(cooked)} sub={t(`range${range}` as MessageKey)} />
          <Stat label={t('weekStreak')} value={`${thisWeekCooked}/${mealsWeek}`} />
        </div>
      </div>
    </>
  );
}
