import { cn } from '@/lib/utils';

/** Temporary mark: a plate seen from above; the tomato dot echoes the dot over "ė". */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('h-8 w-8', className)}>
      <circle cx="16" cy="16" r="14" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="var(--line)" strokeWidth="2" />
      <circle cx="20.5" cy="11.5" r="3" fill="var(--accent)" />
    </svg>
  );
}

export function Logo({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark />
      <span className="font-serif text-[22px] font-semibold tracking-tight">{label}</span>
    </span>
  );
}
