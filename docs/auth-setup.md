# Регистрация и вход — что включить (владельцу)

Код готов. Чтобы регистрация заработала на finoraai.solutions, нужно пять настроек. Секреты вводятся в панелях сервисов, не в чат.

## 1. База данных (GitHub → Settings → Secrets and variables → Actions)
- Секрет **`SUPABASE_DB_URL`**: Supabase → проект → **Connect** → **Session pooler** → строка `postgresql://postgres.<id>:<пароль>@...pooler.supabase.com:5432/postgres` (вставить пароль базы).
- После этого каждый пуш в `main` применяет миграции (`0000`–`0007`), загружает каталог и рецепты. **Первая миграция удаляет таблицы v1** (аккаунты сохраняются).

## 2. Ключи сайта (Vercel → проект → Settings → Environment Variables)
| Переменная | Где взять |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | там же → Publishable key (или anon key) |
| `NEXT_PUBLIC_SITE_URL` | `https://finoraai.solutions` |
Затем Redeploy. Пока их нет, страницы входа показывают «Paskyros dar ruošiamos».

## 3. Supabase → Authentication → URL Configuration
- **Site URL:** `https://finoraai.solutions`
- **Redirect URLs:** `https://finoraai.solutions/api/auth/confirm**` и `https://finoraai.solutions/api/auth/callback**`

## 4. Письма через Resend (Authentication → Emails → SMTP Settings)
1. resend.com → Domains → Add `finoraai.solutions` → добавить показанные DNS-записи (SPF, DKIM) у регистратора домена → дождаться «Verified».
2. Resend → API Keys → Create (права «Sending access»).
3. Supabase → Authentication → Emails → **SMTP Settings** → Enable custom SMTP:
   host `smtp.resend.com`, port `465`, user `resend`, password = ключ Resend, sender `Lėkštė <labas@finoraai.solutions>`.
4. Authentication → Emails → **Templates**: вставить HTML из `supabase/templates/` — Confirm signup ← `confirm_signup.html`, Magic Link ← `magic_link.html`, Reset Password ← `recovery.html`, Change Email ← `email_change.html`. Темы писем: «Patvirtinkite el. paštą», «Prisijungimo nuoroda», «Naujas slaptažodis», «Naujas el. paštas».
   Ссылки в шаблонах ведут на `/api/auth/confirm?token_hash=…` — работают на любом устройстве.

## 5. Вход через Google
1. console.cloud.google.com → APIs & Services → OAuth consent screen (External, название «Lėkštė», домен finoraai.solutions).
2. Credentials → Create OAuth client ID → Web application. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` (точный адрес показан в Supabase → Authentication → Providers → Google).
3. Supabase → Authentication → Providers → **Google** → Enable → вставить Client ID и Client Secret.

## Как проверить
1. finoraai.solutions/registracija → e-mail + пароль → письмо от Lėkštė (не в спаме) → ссылка → /paskyra.
2. Открыть ссылку на телефоне, хотя регистрировались на компьютере — тоже должно войти.
3. /prisijungti → «Nuoroda el. paštu» и «Pamiršote slaptažodį?».
4. «Tęsti su Google».
5. Заполнить анкету без входа → зарегистрироваться → в /paskyra видна норма.
