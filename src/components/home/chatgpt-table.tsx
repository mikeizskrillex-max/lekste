import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';

const ROWS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'] as const;

/** "Why not just ChatGPT?" — wording to be checked by a lawyer (docs/legal-todo.md). */
export function ChatgptTable() {
  const t = useTranslations('home.chatgpt');
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h2 className="text-3xl font-semibold md:text-4xl">{t('title')}</h2>
      <p className="text-muted mt-3 max-w-2xl text-lg">{t('subtitle')}</p>
      <Card className="mt-8 overflow-hidden">
        <table className="w-full table-fixed text-left text-[13px] sm:text-[15px]">
          <thead className="bg-surface-2 text-sm">
            <tr>
              <th scope="col" className="w-[30%] px-3 py-3 md:px-6">
                <span className="sr-only">{t('title')}</span>
              </th>
              <th scope="col" className="text-muted px-4 py-3 font-semibold md:px-6">
                {t('colChatgpt')}
              </th>
              <th scope="col" className="text-accent px-4 py-3 font-semibold md:px-6">
                {t('colLekste')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {ROWS.map((r) => (
              <tr key={r}>
                <th scope="row" className="px-3 py-3.5 font-semibold md:px-6">
                  {t(r)}
                </th>
                <td className="text-muted px-3 py-3.5 md:px-6">
                  <span className="inline-flex items-start gap-1.5 break-words">
                    <X className="text-danger mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {t(`${r}a`)}
                  </span>
                </td>
                <td className="px-3 py-3.5 font-medium md:px-6">
                  <span className="inline-flex items-start gap-1.5 break-words">
                    <Check className="text-savings mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {t(`${r}b`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
