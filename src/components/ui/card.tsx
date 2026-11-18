import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-card bg-surface shadow-card ring-line/70 ring-1', className)} {...props} />;
}
