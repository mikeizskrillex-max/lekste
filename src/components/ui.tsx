'use client';

import { animate, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { recipeImage } from '@/data/recipes';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'gold';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-leaf text-white hover:bg-[#2a855d] shadow-soft',
  secondary: 'bg-card text-ink ring-1 ring-line hover:ring-leaf/50',
  ghost: 'text-ink hover:bg-sage',
  dark: 'bg-forest text-white hover:bg-[#123c2a]',
  gold: 'bg-gold text-ink hover:brightness-105',
};
const SIZE = { sm: 'h-9 px-3.5 text-[13px]', md: 'h-11 px-5 text-[15px]', lg: 'h-14 px-7 text-[16px]' };

export function Button({ variant = 'primary', size = 'md', className, ...p }: ComponentProps<'button'> & { variant?: BtnVariant; size?: keyof typeof SIZE }) {
  return <button type="button" {...p} className={cx('inline-flex items-center justify-center gap-2 rounded-2xl text-center font-semibold leading-tight transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-45', BTN[variant], SIZE[size], className)} />;
}

export function ButtonLink({ variant = 'primary', size = 'md', className, ...p }: ComponentProps<typeof Link> & { variant?: BtnVariant; size?: keyof typeof SIZE }) {
  return <Link {...p} className={cx('inline-flex items-center justify-center gap-2 rounded-2xl text-center font-semibold leading-tight transition active:scale-[.98]', BTN[variant], SIZE[size], className)} />;
}

export function Card({ className, ...p }: ComponentProps<'div'>) {
  return <div {...p} className={cx('rounded-xl2 bg-card shadow-soft ring-1 ring-line/70', className)} />;
}

type Tone = 'leaf' | 'gold' | 'sage' | 'ink' | 'danger' | 'line';
const TONE: Record<Tone, string> = {
  leaf: 'bg-leaf/12 text-forest', gold: 'bg-gold/30 text-[#6b4a0c]', sage: 'bg-sage text-forest', ink: 'bg-ink text-white', danger: 'bg-danger/10 text-danger', line: 'bg-paper text-muted ring-1 ring-line',
};
export function Badge({ tone = 'sage', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold', TONE[tone], className)}>{children}</span>;
}

/** Marks figures that are demo or illustrative so they can never pass as real data. */
export function DemoBadge({ label }: { label: string }) {
  return <Badge tone="gold" className="uppercase tracking-wide">◎ {label}</Badge>;
}

export function Chip({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cx('inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13.5px] font-semibold ring-1 transition', on ? 'bg-forest text-white ring-forest' : 'bg-card text-ink ring-line hover:ring-leaf/60', className)}>
      {children}
    </button>
  );
}

export function Option({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cx('flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-semibold ring-1 transition active:scale-[.99]', on ? 'bg-sage ring-2 ring-leaf' : 'bg-card ring-line hover:ring-leaf/50', className)}>
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13.5px] font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}
export const inputCls = 'w-full rounded-xl bg-card px-3.5 py-3 text-[15px] ring-1 ring-line outline-none transition focus:ring-2 focus:ring-leaf';

export function Slider({ id, label, value, min, max, step = 1, suffix = '', onChange }: { id: string; label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-[13.5px] font-semibold">
        <span>{label}</span><output htmlFor={id} className="font-display text-[17px] font-bold text-forest tabular-nums">{value}{suffix}</output>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#31966A]" />
    </div>
  );
}

export function Container({ className, ...p }: ComponentProps<'div'>) {
  return <div {...p} className={cx('mx-auto w-full max-w-site px-5 md:px-8', className)} />;
}

export function SectionTitle({ kicker, title, sub, center }: { kicker?: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={cx('max-w-[720px]', center && 'mx-auto text-center')}>
      {kicker && <div className="mb-3 text-[12px] font-bold uppercase tracking-[.14em] text-leaf">{kicker}</div>}
      <h2 className="font-display text-[30px] font-extrabold leading-[1.08] tracking-tight text-ink md:text-[44px]">{title}</h2>
      {sub && <p className="mt-4 text-[16px] leading-relaxed text-muted md:text-[18px]">{sub}</p>}
    </div>
  );
}

/** Slide-up on scroll. Content is never hidden (no opacity 0), so it stays readable without JS. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={{ y: 18 }} whileInView={{ y: 0 }} viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.8, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

export function CountUp({ value, format = (n) => String(Math.round(n)), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) { el.textContent = format(value); from.current = value; return; }
    const c = animate(from.current, value, { duration: 0.8, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => { el.textContent = format(v); } });
    from.current = value;
    return () => c.stop();
  }, [value, format, reduce]);
  return <span ref={ref} className={cx('tabular-nums', className)}>{format(value)}</span>;
}

export function Ring({ frac, size = 64, stroke = 7, color = '#31966A', track = '#E9F1E9', children }: { frac: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(1, frac))) }} transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-xl bg-line/60', className)} />;
}

export function Stat({ label, value, sub, className }: { label: string; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <Card className={cx('p-4 md:p-5', className)}>
      <div className="text-[12.5px] font-semibold text-muted">{label}</div>
      <div className="mt-1 font-display text-[24px] font-extrabold tracking-tight md:text-[28px]">{value}</div>
      {sub && <div className="mt-0.5 text-[12.5px] text-muted">{sub}</div>}
    </Card>
  );
}

/** Real food photograph (illustration of the dish), optimised by next/image. */
export function DishImage({ id, alt, className, sizes = '(max-width: 768px) 100vw, 400px', priority = false }: { id: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  return (
    <div className={cx('relative overflow-hidden bg-sage', className)}>
      <Image src={recipeImage(id)} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}

export { cx };
