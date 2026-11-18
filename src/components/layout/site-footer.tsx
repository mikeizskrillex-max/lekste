import { useTranslations } from 'next-intl';
import { company } from '@/lib/config';
import { Logo } from './logo';

/** Footer: medical disclaimer, price note, company details (only the filled ones). */
export function SiteFooter() {
  const t = useTranslations();
  const details = (
    [
      ['footer.company', company.legalName],
      ['footer.code', company.code],
      ['footer.vat', company.vatCode],
      ['footer.address', company.address],
      ['footer.support', company.supportEmail],
    ] as const
  ).filter(([, v]) => v);
  return (
    <footer className="border-line/70 mt-24 border-t pb-28 md:pb-10">
      <div className="text-muted mx-auto grid max-w-6xl gap-6 px-4 pt-10 text-sm md:grid-cols-[1fr_1.4fr] md:px-6">
        <div className="space-y-3">
          <Logo label={t('common.brand')} />
          <p className="text-ink font-semibold">{t('common.medicalDisclaimer')}</p>
        </div>
        <div className="space-y-3">
          <p>{t('footer.pricesNote')}</p>
          {details.length > 0 && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              {details.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt>{t(k)}</dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <p>{t('footer.rights', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
