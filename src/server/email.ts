import 'server-only';
import { Resend } from 'resend';

export type EmailKind = 'confirmation' | 'weekly_menu' | 'shopping_list' | 'renewal_reminder' | 'cancellation';

const SUBJECT: Record<EmailKind, { lt: string; ru: string }> = {
  confirmation: { lt: 'Lėkštė: prenumerata patvirtinta', ru: 'Lėkštė: подписка подтверждена' },
  weekly_menu: { lt: 'Lėkštė: jūsų savaitės meniu', ru: 'Lėkštė: ваше меню на неделю' },
  shopping_list: { lt: 'Lėkštė: pirkinių sąrašas', ru: 'Lėkštė: список покупок' },
  renewal_reminder: { lt: 'Lėkštė: po 3 dienų atnaujinsime prenumeratą', ru: 'Lėkštė: через 3 дня продлим подписку' },
  cancellation: { lt: 'Lėkštė: prenumerata atšaukta', ru: 'Lėkštė: подписка отменена' },
};

/** Sends a transactional e-mail through Resend; without a key it only logs (development mode). */
export async function sendEmail(to: string, kind: EmailKind, lang: 'lt' | 'ru', html: string): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const subject = SUBJECT[kind][lang];
  if (!key) { console.info(`[email:dev] ${kind} → (recipient hidden) ${subject}`); return { sent: false }; }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({ from: process.env.EMAIL_FROM || 'Lėkštė <noreply@example.com>', to, subject, html });
  if (error) throw new Error(error.message);
  return { sent: true };
}
