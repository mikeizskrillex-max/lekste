# Seed data

- `ingredients_lt.csv` — стартовый каталог (149 базовых продуктов). Составлен разработчиком, **ждёт проверки владельца**. Поля:
  - `slug` — латинский ключ; `name_lt`, `name_ru`; `category`; `origin` (plant, dairy, egg, fish, seafood, meat, honey — из него выводятся диеты);
  - `unit` (g, ml, pcs), `piece_g` — вес одной штуки, `density_g_ml` — для жидкостей;
  - `allergens` — через `;`, коды: gluten, crustaceans, eggs, fish, peanuts, soy, milk, nuts, celery, mustard, sesame, sulphites, lupin, molluscs, lactose;
  - `composition_varies` — `yes`, если состав зависит от конкретного товара (добавки, «может содержать следы»). Для аллергика такой ингредиент запрещён, пока состав товара не подтверждён;
  - `usda_fdc_id`, `usda_description` — запись USDA, откуда берутся КБЖУ, пока нет этикеток;
  - `synonyms_lt`, `synonyms_ru` — через `;`, для поиска.
  - Доступность в магазинах тут не задаётся — её проверяет фаза 5 (`ingredients:verify`, Barbora и Rimi).
- `usda_sr_legacy.json` — КБЖУ на 100 г для этих записей из USDA FoodData Central, SR Legacy (public domain). Пересобирается `npm run usda:extract`.
- `demo_personas.json` — демо-семьи для главной.

Проверка: `npm run ingredients:check`. Загрузка в базу: `npm run ingredients:import` (идемпотентно).
