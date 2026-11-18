import { cn } from '@/lib/utils';

export type Macro = {
  key: string;
  label: string;
  value: number;
  unit: string;
  /** reference for a full bar, e.g. the meal's share of the daily target */ max: number;
};

/** Kcal and macros as small horizontal bars. Values come from the ingredient database, never from AI. */
export function MacroBars({ items, className }: { items: Macro[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-4 gap-2', className)}>
      {items.map((m) => {
        const pct = Math.max(4, Math.min(100, (m.value / m.max) * 100));
        return (
          <div key={m.key} className="min-w-0">
            <dt className="text-muted truncate text-[11px]">{m.label}</dt>
            <dd className="tabular text-[13px] font-semibold">
              {m.value}
              <span className="text-muted font-normal"> {m.unit}</span>
            </dd>
            <div className="bg-surface-2 mt-1 h-1.5 overflow-hidden rounded-full" aria-hidden>
              <div
                className="bg-ink/70 h-full origin-left rounded-full"
                style={{ transform: `scaleX(${pct / 100})` }}
              />
            </div>
          </div>
        );
      })}
    </dl>
  );
}
