# Lėkštė v2 — план (фаза 0: планирование)

## Context
v1 (finoraai.solutions) не взлетела. Главная причина по оценке владельца — недоверие и баги: глючные письма, вход, «сырой» вид. Делаем v2 по SPEC.md с нуля: новый дизайн и новый код. Из v1 берём только суть, тексты лендинга (раздел 13 ТЗ) и фото блюд (как ассеты, не код). Приоритет — надёжность: каждая цена с источником и временем проверки, аллергены проверяет код, письма и вход работают на любом устройстве, тесты на все критичные пути.

## Решения владельца (по вопросам фазы 0)
| Тема | Решение |
|---|---|
| Репозиторий | Перезаписываем `mikeizskrillex-max/lekste`. Сначала тег `v1-final` для отката, потом чистый `main`. finoraai.solutions покажет недоделанную v2 сразу после первого пуша (решение владельца). |
| Домен | Оставляем finoraai.solutions |
| Магазины | **Только Barbora (Maxima e-parduotuvė) и Rimi.** Lidl, Iki и Maxima-магазин убираются отовсюду: анкета, сравнение, тексты, «Tik Lidl» → «Tik Rimi». Правило доступности: ингредиент продаётся и в Barbora, и в Rimi (`availability_level = both_stores`). Модель данных `stores` оставляем расширяемой. |
| Цены | Публичные страницы товаров Barbora/Rimi раз в неделю, вежливо (1 запрос / 2 с, User-Agent с контактом), плюс CSV-импорт. Владелец пишет магазинам про партнёрский фид (черновик письма готовлю я). Юр. оценка — `TODO: проверить юристом`. |
| Расписание | GitHub Actions, по понедельникам → запись в Supabase → пересчёт демо-корзин |
| Свежесть цены | 14 дней. Старше — не идёт в корзину. Аномалии (> 50 % или пропажа товара) → очередь проверки. |
| Оплата | Только Stripe. 3 тарифа (9 € / 20 € / 80 €, с PVM). Налоги считает Stripe (Managed Payments / Tax). |
| Пробная неделя | **Без карты**: 7 дней доступа, потом всё закрывается до оплаты. Письмо за 2 дня до конца. |
| Бесплатно | Анкета + норма + **1-й день своего меню** + сумма недельной корзины. Остальные дни, список покупок, AI и «Kita savaitė» — по подписке или пробной неделе. |
| Языки | lt (эталон) + ru. Без en/uk на старте, структура позволяет добавить. |
| Аналитика | Своя анонимная (без cookies, суточный хэш) + дашборд в админке. Meta Pixel — только после согласия. |
| AI | Чат: `AI_MODEL=claude-sonnet-5-5`. Генерация рецептов и переводы: `AI_RECIPE_MODEL=claude-opus-5-5`. Только с сервера, structured output по Zod. |
| Приёмы пищи | Вопрос в анкете. В фазе 3 предложу объединить его со временем на готовку, чтобы анкета осталась на 9 экранах. |
| Рецепты | AI-оригиналы только из каталога `both_stores` + строгая автопроверка. В меню идут `auto_checked` и `reviewed`; вручную проверяется каждый 10-й и все отмеченные. Публично ~300 целиком, у остальных без шагов. «Бюджетная» порция ≤ 1,50 €. |
| БД | SQL-миграции Supabase + генерация типов, RLS на всех таблицах, тесты RLS через pgTAP. **Тот же проект Supabase**, таблицы v1 удаляются миграцией `0000_drop_v1.sql`. |
| Алгоритм | Жадная сборка + локальный поиск (`lib/planner`, `lib/basket`), на сервере |
| Корзина | Один магазин (выбранный или «где дешевле») + сравнение с другим |
| Письма | Понедельничное «Naujos akcijos» для подписчиков, отключается в настройках. Resend + react-email. |
| Фото | Фото блюд v1 (69 шт.) как иллюстрации с пометкой; для остальных — плейсхолдеры по категориям. Права на фото v1 — `TODO`. |
| Реквизиты | Есть фирма, данные будут позже. Пустые поля в `lib/config.ts` не показываются. |
| CSV ингредиентов | Владелец пришлёт `data/seed/ingredients_lt.csv`. До этого фаза 2 не стартует. |

## Структура репозитория
```
lekste/
  SPEC.md                 ТЗ (текст владельца, без правок)
  CLAUDE.md               правила проекта
  docs/                   db.md (Mermaid ER), decisions.md, legal-todo.md, store-letter.md
  data/seed/              ingredients_lt.csv, demo personas, test prices
  messages/               lt.json (эталон), ru.json
  supabase/migrations/    0000_drop_v1.sql, 0001_core.sql …; supabase/tests/ (pgTAP)
  scripts/                prices-scrape.ts, ingredients-verify.ts, recipes-generate.ts, recipes-check.ts, i18n-check.ts
  .github/workflows/      ci.yml, prices-weekly.yml
  public/images/          dishes/ (из v1), placeholder/
  src/
    app/[locale]/         (public) главная, pradeti, receptai, prekybos-centrai, kainos, kaip-veikia, duk, kontaktai, политики
                          (account) savaite, pirkiniai, istorija, megstami, profilis, prenumerata, nustatymai
                          admin/…
    app/api/              stripe/webhook, ai/assistant, plan/generate, track, cron/…
    components/ui/        shadcn
    components/…          по фичам, ≤ ~200 строк
    lib/                  config.ts, plans.ts, nutrition/{targets,safety}.ts, planner/, basket/,
                          prices/, recipes/sanity.ts, ai/{client,schemas,prompts/}, allergens/, i18n/, supabase/
  tests/                  unit (Vitest), e2e (Playwright)
```

## Схема БД (кратко, полная Mermaid ER — в `docs/db.md`)
- **Справочники:** `stores`; `ingredients` (slug, name jsonb{lt,ru}, category, unit, piece_g, density, allergens[], diet_tags[], kbju/100 g + usda_id, availability_level); `ingredient_synonyms`.
- **Цены:** `store_products` (store, external_id, url, title, brand, pack_size + unit, price, unit_price, promo_price, promo_from/to, loyalty, in_stock, checked_at, source); `ingredient_store_matches` (ingredient ↔ product, priority, confidence, verified_by_admin); `price_history`; `price_anomalies`; `scrape_runs`; `csv_imports` (с откатом).
- **Рецепты:** `recipes` (slug, title/description/steps jsonb, servings, time active/total, difficulty, equipment[], meal, cuisine, season, kid_friendly, photo, is_public, source, status, prompt_version, reviewed_by); `recipe_ingredients` (recipe, ingredient, grams); представление `recipe_facts`: КБЖУ, аллергены и диеты считаются из ингредиентов.
- **Пользователи:** `profiles` (locale, role, consents); `household_members`; `questionnaires` (данные о здоровье, отдельное согласие); `meal_plans` (week_start, status) → `plan_meals` (day, slot, recipe, servings, locked); `baskets` (store, total, computed_at) → `basket_lines` (product, packs, price, source, checked_at); `favorites`; `pantry_leftovers`.
- **Подписки:** `subscriptions` (зеркало Stripe через webhook), `payment_events` (идемпотентность).
- **Служебные:** `ai_requests` (обезличенный лог, prompt_version, cost), `events` (анонимная аналитика), `admin_audit`, `demo_personas` (+ кэш пересчитанных демо).
- RLS: пользовательские таблицы — только владелец; справочники — чтение для всех, запись — сервис/админ; служебные — только сервис.

## Зависимости
next, react, typescript (strict), tailwindcss, shadcn/ui (radix), framer-motion, next-intl, react-hook-form, zod, @hookform/resolvers, @supabase/supabase-js, @supabase/ssr, @anthropic-ai/sdk, stripe, resend, @react-email/components, @marsidev/react-turnstile, recharts (админка), papaparse (CSV); dev: vitest, @playwright/test, eslint, prettier, supabase CLI, pgTAP (через CLI), tsx.

## Фазы (каждая: вопросы → работа → lint/typecheck/build/тесты → коммит `feat(phase-N)` → отчёт со скриншотами 360/1440 → вопросы → стоп)
0. **Планирование** (эта фаза). После «ок»: тег `v1-final`, очистка `main`, SPEC.md, CLAUDE.md, `docs/db.md`, `docs/decisions.md`, `docs/legal-todo.md`, черновик письма магазинам, `.env.example`, коммит `chore(phase-0)`.
1. Каркас и дизайн-система: 3 визуальных направления → выбор → токены, темы, шрифты (диакритика + кириллица), next-intl (lt/ru), layout, Supabase-клиенты, `0000_drop_v1` + базовые миграции, seed, CI.
2. Ингредиенты: импорт CSV, КБЖУ из USDA, аллергены (14 ЕС + лактоза), синонимы, поиск `pg_trgm`, тесты аллергенов.
3. Анкета и норма: 9 экранов без регистрации (localStorage), формулы, `safety.ts`, экран «Jūsų norma».
4. Магазины и цены: модель, сборщики Barbora и Rimi, CSV-импорт, сопоставление, cron, аномалии, 14-дневная свежесть.
5. Доступность: `ingredients:verify` по Barbora + Rimi, статусы `both_stores` / `missing`, CI-правило.
6. Рецепты 2000+: генерация (Opus), автопроверка, дедупликация, перевод на ru, очередь проверки, отчёт баланса.
7. Планировщик и корзина: алгоритм, упаковки и остатки, сравнение двух магазинов, список покупок, «Kita savaitė», бюджетный минимум.
8. Главная и публичные страницы: все блоки раздела 13 с живой демо, рецепты, prekybos-centrai, kainos, DUK.
9. Auth и аккаунт: e-mail + пароль, ссылки из писем работают на любом устройстве (token_hash), перенос данных гостя, литовские шаблоны писем.
10. AI-ассистент: разбор запроса → параметры → детерминированный пересчёт, демо на главной, лимиты, защита от промпт-инъекций.
11. Подписка: Stripe, пробная неделя без карты, 3 тарифа, портал, письма, вебхуки, жёсткое закрытие доступа.
12. Админка: дашборд, цены и аномалии, сопоставление, ингредиенты, рецепты, демо-персоны, пользователи, AI-лог, журнал.
13. SEO, cookies, GDPR, доступность, безопасность (CSP, Turnstile, rate limit).
14. Тесты, Lighthouse, правки, README и инструкции.

## Отклонения от ТЗ (по решениям владельца)
- Магазины: только Barbora и Rimi; правило `all_chains` → `both_stores`; статусы Maxima/Lidl/Iki из 7.3 не показываем.
- Языки: lt + ru (en/uk позже).
- Пробная неделя без карты; бесплатно ещё и 1-й день своего меню.
- Аналитика своя, без внешнего сервиса.
- Демо-чип «Tik Lidl» → «Tik Rimi»; Playwright-сценарий «импорт CSV Lidl» → «импорт CSV Rimi/Barbora».

## Что нужно от владельца
- `data/seed/ingredients_lt.csv` — до фазы 2.
- Доступ к Supabase для миграций: access token или пароль БД через защищённую форму (объясню перед запросом). Или выполнение SQL вручную в SQL Editor.
- Ключи `ANTHROPIC_API_KEY`, Stripe (test), Resend, Turnstile — по мере фаз, через защищённую форму.
- Реквизиты фирмы — до фазы 11.
- Решение юриста по сбору цен — до запуска (TODO не блокирует разработку).

## Проверка
- После фазы 0: в репозитории есть тег `v1-final`; в `main` только SPEC.md, CLAUDE.md, docs/, `.env.example`; `docs/db.md` рендерится в GitHub (Mermaid).
- Каждая следующая фаза: `npm run lint && npm run typecheck && npm run build && npm test` (+ `test:e2e`, `i18n:check`, pgTAP для RLS) зелёные; скриншоты Playwright 360/768/1440 в светлой и тёмной темах; тесты фильтра аллергенов проходят всегда; ни одной цены без `source` и свежего `checked_at`.
