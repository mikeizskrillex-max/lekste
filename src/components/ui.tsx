import { animate, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18n';

/** Number that counts up to its value. */
export function CountUp({ value, format = (n) => String(Math.round(n)), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) { el.textContent = format(value); from.current = value; return; }
    const c = animate(from.current, value, {
      duration: 0.9,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => { el.textContent = format(v); },
    });
    from.current = value;
    return () => c.stop();
  }, [value, format, reduce]);
  return <span ref={ref} className={`tabular ${className ?? ''}`}>{format(value)}</span>;
}

/** Circular progress ring. */
export function Ring({ frac, size = 70, stroke = 7, color, track = 'rgb(255 255 255 / .15)', children }: {
  frac: number; size?: number; stroke?: number; color: string; track?: string; children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, frac));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - f) }}
          transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

const TINTS = ['bg-warm', 'bg-peach', 'bg-leaf', 'bg-rose'];
/** Photo placeholder until real dish photos (Higgsfield) are uploaded. */
export function Thumb({ emoji, i = 0, size = 'h-14 w-14 text-[28px]' }: { emoji: string; i?: number; size?: string }) {
  return <div className={`${size} ${TINTS[i % TINTS.length]} grid shrink-0 place-items-center rounded-[14px]`} aria-hidden>{emoji}</div>;
}

export function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex rounded-full border border-line p-0.5 text-[12px] font-semibold" role="group" aria-label="Language">
      {(['lt', 'ru'] as const).map((l) => (
        <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 uppercase transition ${lang === l ? 'bg-deep text-white' : 'text-muted'}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function Logo() {
  return <Link to="/" className="font-display text-[18px] font-extrabold text-ink">Lėkš<span className="text-accent">tė</span></Link>;
}

export function TopBar({ right }: { right?: ReactNode }) {
  return (
    <header className="container-app flex items-center justify-between pb-2 pt-4">
      <Logo />
      <div className="flex items-center gap-3">{right}<LangSwitch /></div>
    </header>
  );
}

/** Stagger children in from below. Content is visible at rest for reduced motion. */
export function Rise({ children, i = 0 }: { children: ReactNode; i?: number }) {
  return (
    <motion.div initial={{ opacity: 0.001, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: i * 0.07, ease: [0.2, 0.8, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}
