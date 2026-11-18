'use client';

import * as T from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

/** Accessible tooltip: opens on hover and keyboard focus, content is announced by screen readers. */
export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <T.Provider delayDuration={150}>
      <T.Root>
        <T.Trigger asChild>{children}</T.Trigger>
        <T.Portal>
          <T.Content
            sideOffset={6}
            className="bg-ink text-bg shadow-card z-50 rounded-lg px-2.5 py-1.5 text-xs font-medium"
          >
            {content}
            <T.Arrow className="fill-ink" />
          </T.Content>
        </T.Portal>
      </T.Root>
    </T.Provider>
  );
}
