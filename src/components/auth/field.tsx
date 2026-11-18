'use client';

import { useTranslations } from 'next-intl';
import { forwardRef, useId, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type Props = ComponentProps<'input'> & { label: string; error?: string; hint?: string };

/** Labelled input; the error is a key under auth.errors. */
export const Field = forwardRef<HTMLInputElement, Props>(function Field(
  { label, error, hint, className, ...props },
  ref,
) {
  const t = useTranslations('auth.errors');
  const id = useId();
  const message = error ? t(error as Parameters<typeof t>[0]) : hint;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={message ? `${id}-msg` : undefined}
        className={cn(
          'bg-surface focus:ring-accent h-12 w-full rounded-xl px-4 text-base ring-1 outline-none focus:ring-2',
          error ? 'ring-danger' : 'ring-line',
        )}
        {...props}
      />
      {message && (
        <p id={`${id}-msg`} className={cn('mt-1 text-xs', error ? 'text-danger' : 'text-muted')}>
          {message}
        </p>
      )}
    </div>
  );
});

export function FormError({ error }: { error: string | null }) {
  const t = useTranslations('auth.errors');
  if (!error) return null;
  return (
    <p role="alert" className="bg-accent-soft text-ink rounded-xl px-4 py-3 text-sm">
      {t(error as Parameters<typeof t>[0])}
    </p>
  );
}

export function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="status" className="bg-surface-2 rounded-xl p-4">
      <p className="font-semibold">{title}</p>
      <div className="text-muted mt-1 space-y-1 text-sm">{children}</div>
    </div>
  );
}
