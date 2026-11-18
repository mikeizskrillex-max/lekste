/**
 * Public navigation. A link appears only when its page exists (no dead links);
 * pages arrive in phase 8 — flip `ready` then.
 */
export const NAV = [
  { key: 'how', href: '/#kaip-veikia', ready: true },
  { key: 'recipes', href: '/receptai', ready: false },
  { key: 'stores', href: '/prekybos-centrai', ready: false },
  { key: 'pricing', href: '/#kainos', ready: true },
  { key: 'faq', href: '/duk', ready: false },
] as const;

export const NAV_READY = NAV.filter((n) => n.ready);
export const START_HREF = '/pradeti';
