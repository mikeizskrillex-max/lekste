/** Minimal robots.txt check for the "User-agent: *" group: longest matching Allow/Disallow rule wins. */
export interface Robots {
  allows(path: string): boolean;
}

export function parseRobots(text: string): Robots {
  const rules: { allow: boolean; pattern: string }[] = [];
  let inStar = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = (m[1] ?? '').toLowerCase();
    const value = (m[2] ?? '').trim();
    if (key === 'user-agent') inStar = value === '*';
    else if (inStar && (key === 'allow' || key === 'disallow') && value)
      rules.push({ allow: key === 'allow', pattern: value });
  }
  const toRe = (p: string) =>
    new RegExp(
      '^' +
        p
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '.*')
          .replace(/\\\$$/, '$'),
    );
  const compiled = rules.map((r) => ({ ...r, re: toRe(r.pattern) }));
  return {
    allows(path: string) {
      let best: { allow: boolean; len: number } | null = null;
      for (const r of compiled) {
        if (r.re.test(path) && (!best || r.pattern.length > best.len)) best = { allow: r.allow, len: r.pattern.length };
      }
      return best ? best.allow : true;
    },
  };
}
