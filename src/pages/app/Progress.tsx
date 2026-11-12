import { useState } from 'react';
import { CountUp } from '../../components/ui';
import { formatEur, useI18n } from '../../i18n/I18n';
import { useStore } from '../../lib/store';

export function Progress() {
  const { t, lang } = useI18n();
  const { weights, addWeight, eaten, answers } = useStore();
  const last = weights[weights.length - 1]?.kg ?? answers.weightKg;
  const [kg, setKg] = useState(last);
  const first = weights[0]?.kg ?? last;
  const diff = Math.round((last - first) * 10) / 10;
  const cooked = Object.values(eaten).reduce((s, l) => s + l.length, 0);

  // simple SVG chart; y scaled to the data range with padding
  const pts = weights.length > 1 ? weights : [{ date: '', kg: first }, { date: '', kg: last }];
  const min = Math.min(...pts.map((p) => p.kg)) - 1;
  const max = Math.max(...pts.map((p) => p.kg)) + 1;
  const W = 300, H = 120;
  const xy = pts.map((p, i) => [12 + (i / (pts.length - 1)) * (W - 24), 10 + (1 - (p.kg - min) / (max - min)) * (H - 30)]);

  return (
    <div className="max-w-[720px]">
      <h1 className="font-display text-[26px] font-extrabold md:text-[32px]">{t('progressTitle')}</h1>
      <section className="card mt-3 p-4">
        <div className="flex justify-between font-bold"><span>{t('weight')}</span><span className="text-accent tabular">{diff > 0 ? '+' : ''}{diff} kg <span className="text-[12px] font-normal text-muted">{t('sinceStart')}</span></span></div>
        <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label={t('weight')}>
          <line x1="12" x2={W - 12} y1={H - 20} y2={H - 20} stroke="rgb(var(--line))" />
          <polyline fill="none" stroke="rgb(var(--accent))" strokeWidth="3" points={xy.map((p) => p.join(',')).join(' ')} />
          {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 5 : 3.5} fill="rgb(var(--accent))" />)}
          <text x="12" y={H - 4} fontSize="10" fill="rgb(var(--muted))">{first} kg</text>
          <text x={W - 12} y={H - 4} fontSize="10" fill="rgb(var(--muted))" textAnchor="end">{last} kg</text>
        </svg>
        <div className="mt-3 flex items-center gap-2">
          <input type="number" inputMode="decimal" step="0.1" value={kg} onChange={(e) => setKg(+e.target.value)} aria-label={t('weight')}
            className="w-24 rounded-xl border-2 border-line bg-surface px-3 py-2.5 text-[16px] font-bold tabular outline-none focus:border-accent" />
          <button type="button" className="btn flex-1 !py-3" onClick={() => kg > 30 && kg < 300 && addWeight(Math.round(kg * 10) / 10)}>{t('addWeight')}</button>
        </div>
      </section>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <div className="card p-3"><div className="text-[12px] text-muted">{t('cooked')}</div><div className="font-display text-[22px] font-extrabold"><CountUp value={cooked} /></div></div>
        <div className="card p-3"><div className="text-[12px] text-muted">{t('budget')}</div><div className="font-display text-[22px] font-extrabold">{formatEur(answers.weeklyBudget, lang)}</div></div>
      </div>
    </div>
  );
}
