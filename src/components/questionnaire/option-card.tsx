'use client';

import { Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  description?: string;
  icon?: LucideIcon;
  selected: boolean;
  onSelect: () => void;
  /** radio = one of many (arrow keys move inside the group); checkbox = toggle */
  role?: 'radio' | 'checkbox';
  compact?: boolean;
}

/** Big tappable answer card used on every questionnaire screen. */
export function OptionCard({ label, description, icon: Icon, selected, onSelect, role = 'radio', compact }: Props) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'group rounded-card bg-surface shadow-card relative flex w-full items-center gap-3 text-left ring-1 transition-[transform,box-shadow] duration-150 ease-out active:scale-[0.99]',
        compact ? 'min-h-14 px-4 py-3' : 'min-h-20 px-4 py-4 md:px-5',
        selected ? 'ring-accent bg-accent-soft ring-2' : 'ring-line hover:ring-ink/30',
      )}
    >
      {Icon && (
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full',
            selected ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink',
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block leading-snug font-semibold">{label}</span>
        {description && <span className="text-muted mt-0.5 block text-sm leading-snug">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full ring-1',
          selected ? 'bg-accent text-accent-ink ring-accent' : 'ring-line',
        )}
      >
        {selected && <Check className="size-4" strokeWidth={3} />}
      </span>
    </button>
  );
}
