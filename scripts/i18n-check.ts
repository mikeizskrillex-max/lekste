/**
 * i18n check: (1) every key in lt.json exists in ru.json and vice versa, (2) the same {placeholders},
 * (3) no hard-coded interface text in components (JSX text or aria-label/title/alt/placeholder literals).
 * Exit code 1 on any problem. A line can opt out with the comment `i18n-ignore` (use sparingly).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

type Tree = { [k: string]: string | Tree };
const load = (l: string) => JSON.parse(readFileSync(`messages/${l}.json`, 'utf8')) as Tree;
const flat = (t: Tree, p = ''): Map<string, string> => {
  const m = new Map<string, string>();
  for (const [k, v] of Object.entries(t)) {
    if (k === '_meta') continue;
    const key = p ? `${p}.${k}` : k;
    if (typeof v === 'string') m.set(key, v);
    else for (const [kk, vv] of flat(v, key)) m.set(kk, vv);
  }
  return m;
};
const placeholders = (s: string) =>
  [...s.matchAll(/\{(\w+)/g)]
    .map((x) => x[1])
    .sort()
    .join(',');

const problems: string[] = [];
const ref = flat(load('lt'));
for (const locale of ['ru']) {
  const other = flat(load(locale));
  for (const [k, v] of ref) {
    if (!other.has(k)) problems.push(`${locale}: missing key ${k}`);
    else if (placeholders(v) !== placeholders(other.get(k)!)) problems.push(`${locale}: placeholders differ in ${k}`);
    else if (!other.get(k)!.trim()) problems.push(`${locale}: empty value ${k}`);
  }
  for (const k of other.keys()) if (!ref.has(k)) problems.push(`${locale}: extra key ${k} (not in lt.json)`);
}

const files: string[] = [];
const walk = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) files.push(p);
  }
};
walk('src');
const LETTER = /[A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūžА-Яа-яЁё]{2,}/;
for (const file of files) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (line.includes('i18n-ignore') || line.trim().startsWith('//') || line.trim().startsWith('*')) return;
      // text right after a JSX opening/closing tag, up to the next tag or {expression}
      for (const m of line.matchAll(/<\/?[A-Za-z][\w.]*(?:\s[^<>]*)?>([^<>{}]+)(?=[<{]|$)/g))
        // "useState<string | null>(null)" and "t(x as Parameters<typeof t>[0])" are TypeScript generics, not JSX
        if (LETTER.test(m[1]!) && !/^[([]/.test(m[1]!)) problems.push(`${file}:${i + 1}: JSX text "${m[1]!.trim()}"`);
      for (const m of line.matchAll(/\b(aria-label|title|alt|placeholder)="([^"]+)"/g))
        if (LETTER.test(m[2]!)) problems.push(`${file}:${i + 1}: ${m[1]}="${m[2]}"`);
    });
}

if (problems.length) {
  console.error(`i18n:check — ${problems.length} problem(s):\n` + problems.map((p) => `  • ${p}`).join('\n'));
  process.exit(1);
}
console.log(`i18n:check — OK (${ref.size} keys, lt + ru, ${files.length} components scanned)`);
