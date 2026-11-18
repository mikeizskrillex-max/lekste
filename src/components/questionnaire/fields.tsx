'use client';

import { Minus, Plus } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** −/+ counter for people and ages. */
export function Counter({
  label,
  value,
  min,
  max,
  onChange,
  lessLabel,
  moreLabel,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  lessLabel: string;
  moreLabel: string;
  suffix?: string;
}) {
  const round =
    'bg-surface ring-line hover:ring-ink/30 flex size-11 items-center justify-center rounded-full ring-1 disabled:opacity-40';
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-semibold">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={round}
          aria-label={`${lessLabel}: ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <output className="tabular w-12 text-center text-lg font-semibold" aria-live="polite">
          {value}
          {suffix ? ` ${suffix}` : ''}
        </output>
        <button
          type="button"
          className={round}
          aria-label={`${moreLabel}: ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/** Number input with a unit; reports undefined while empty or out of range. */
export function NumberField({
  label,
  unit,
  value,
  min,
  max,
  hint,
  decimal,
  disabled,
  onChange,
}: {
  label: string;
  unit: string;
  value: number | undefined;
  min: number;
  max: number;
  hint: string;
  decimal?: boolean;
  disabled?: boolean;
  onChange: (n: number | undefined) => void;
}) {
  const id = useId();
  const [text, setText] = useState(value === undefined ? '' : String(value).replace('.', ','));
  const n = Number(text.replace(',', '.'));
  const invalid = text !== '' && (!Number.isFinite(n) || n < min || n > max);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div
        className={cn(
          'bg-surface focus-within:ring-accent flex h-12 items-center rounded-xl px-4 ring-1 focus-within:ring-2',
          invalid ? 'ring-danger' : 'ring-line',
          disabled && 'opacity-50',
        )}
      >
        <input
          id={id}
          inputMode={decimal ? 'decimal' : 'numeric'}
          autoComplete="off"
          disabled={disabled}
          className="tabular w-full bg-transparent text-lg outline-none"
          value={text}
          aria-invalid={invalid}
          aria-describedby={`${id}-hint`}
          onChange={(e) => {
            const t = e.target.value.replace(/[^\d.,]/g, '');
            setText(t);
            const v = Number(t.replace(',', '.'));
            onChange(
              t !== '' && Number.isFinite(v) && v >= min && v <= max ? (decimal ? v : Math.round(v)) : undefined,
            );
          }}
        />
        <span className="text-muted ml-2 text-sm">{unit}</span>
      </div>
      <p id={`${id}-hint`} className={cn('mt-1 text-xs', invalid ? 'text-danger' : 'text-muted')}>
        {hint}
      </p>
    </div>
  );
}

export function StepHeading({ title, hint, id }: { title: string; hint: string; id: string }) {
  return (
    <header className="mb-6 text-center md:mb-8">
      <h1 id={id} tabIndex={-1} className="text-3xl leading-tight font-semibold outline-none md:text-4xl">
        {title}
      </h1>
      <p className="text-muted mt-2">{hint}</p>
    </header>
  );
}

export function Group({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('grid gap-3', className)}>
      {children}
    </div>
  );
}
