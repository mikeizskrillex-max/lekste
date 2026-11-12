import type { Equipment, MealType } from '../lib/types';

/**
 * Starter recipe library (per ONE serving). Nutrition, allergens, diet flags
 * and price are never stored here: they are computed from the ingredients.
 * Photos: free Unsplash photos in public/img/dishes (illustrations of the dish);
 * replace with photos of the real recipes before launch.
 */
export interface Recipe {
  id: string;
  lt: string;
  ru: string;
  emoji: string;
  meal: MealType;
  cuisine: 'home' | 'mediterranean' | 'italian' | 'asian' | 'georgian';
  minutes: number;
  equipment: Equipment[];
  spice: 0 | 1 | 2;
  breakfastStyle?: 'sweet' | 'savory';
  items: [ingredientId: string, grams: number][];
  stepsLt: string[];
  stepsRu: string[];
}

export const recipeImage = (id: string) => `/img/dishes/${id}.jpg`;

type R = Recipe;
const r = (x: R) => x;

export const RECIPES: Recipe[] = [
  // ---------- Breakfast ----------
  r({ id: 'oat_berries', lt: 'Avižinė košė su uogomis ir jogurtu', ru: 'Овсянка с ягодами и йогуртом', emoji: '🥣', meal: 'breakfast', cuisine: 'home', minutes: 10, equipment: ['stove'], spice: 0, breakfastStyle: 'sweet',
    items: [['oats', 60], ['milk', 200], ['berries', 80], ['greek_yogurt', 100]],
    stepsLt: ['Virkite dribsnius piene 5 minutes.', 'Sudėkite uogas ir pamaišykite.', 'Patiekite su jogurtu.'],
    stepsRu: ['Варите хлопья в молоке 5 минут.', 'Добавьте ягоды и перемешайте.', 'Подавайте с йогуртом.'] }),
  r({ id: 'syrniki', lt: 'Varškėčiai su medumi', ru: 'Сырники с мёдом', emoji: '🥞', meal: 'breakfast', cuisine: 'home', minutes: 20, equipment: ['stove'], spice: 0, breakfastStyle: 'sweet',
    items: [['cottage_cheese', 200], ['eggs', 50], ['oats', 30], ['greek_yogurt', 80], ['honey', 10]],
    stepsLt: ['Sumaišykite varškę, kiaušinį ir sumaltus dribsnius.', 'Kepkite be aliejaus po 3 min. iš abiejų pusių.', 'Patiekite su jogurtu ir medumi.'],
    stepsRu: ['Смешайте творог, яйцо и измельчённые хлопья.', 'Жарьте без масла по 3 минуты с каждой стороны.', 'Подавайте с йогуртом и мёдом.'] }),
  r({ id: 'omelette_veg', lt: 'Kiaušinis ant ruginės duonos su špinatais', ru: 'Яичница на ржаном тосте со шпинатом', emoji: '🍳', meal: 'breakfast', cuisine: 'home', minutes: 10, equipment: ['stove'], spice: 0, breakfastStyle: 'savory',
    items: [['eggs', 120], ['rye_bread', 60], ['spinach', 50], ['tomato', 100], ['cheese', 15]],
    stepsLt: ['Paskrudinkite duoną.', 'Iškepkite kiaušinius, šalia pakepinkite špinatus.', 'Sudėkite ant duonos, patiekite su pomidorais.'],
    stepsRu: ['Подсушите хлеб.', 'Пожарьте яйца, рядом обжарьте шпинат.', 'Выложите на хлеб, подавайте с помидорами.'] }),
  r({ id: 'curd_toast', lt: 'Skrebutis su avokadu ir varške', ru: 'Тост с авокадо и творогом', emoji: '🥑', meal: 'breakfast', cuisine: 'mediterranean', minutes: 8, equipment: [], spice: 0, breakfastStyle: 'savory',
    items: [['rye_bread', 80], ['avocado', 60], ['cottage_cheese', 120], ['tomato', 80]],
    stepsLt: ['Paskrudinkite duoną.', 'Užtepkite varškę ir sutrintą avokadą.', 'Ant viršaus dėkite pomidorus.'],
    stepsRu: ['Подсушите хлеб.', 'Намажьте творог и размятое авокадо.', 'Сверху выложите помидоры.'] }),
  r({ id: 'eggs_avocado', lt: 'Kiaušiniai su avokadu ir bulvėmis', ru: 'Яйца с авокадо и картофелем', emoji: '🥚', meal: 'breakfast', cuisine: 'mediterranean', minutes: 20, equipment: ['stove'], spice: 0, breakfastStyle: 'savory',
    items: [['eggs', 120], ['avocado', 60], ['spinach', 40], ['potatoes', 150]],
    stepsLt: ['Išvirkite bulves ir kiaušinius (8 min.).', 'Supjaustykite avokadą.', 'Patiekite su špinatais.'],
    stepsRu: ['Отварите картофель и яйца (8 минут).', 'Нарежьте авокадо.', 'Подавайте со шпинатом.'] }),
  r({ id: 'tofu_scramble', lt: 'Dubenėlis su tofu, avokadu ir ryžiais', ru: 'Боул с тофу, авокадо и рисом', emoji: '🥗', meal: 'breakfast', cuisine: 'asian', minutes: 20, equipment: ['stove'], spice: 0, breakfastStyle: 'savory',
    items: [['tofu', 180], ['avocado', 60], ['rice', 50], ['spinach', 40], ['tomato', 80]],
    stepsLt: ['Išvirkite ryžius.', 'Apkepkite tofu kubelius.', 'Sudėkite viską į dubenėlį su avokadu ir daržovėmis.'],
    stepsRu: ['Отварите рис.', 'Обжарьте кубики тофу.', 'Соберите боул с авокадо и овощами.'] }),
  r({ id: 'banana_pancakes', lt: 'Avižiniai blynai su mėlynėmis', ru: 'Овсяные блины с черникой', emoji: '🥞', meal: 'breakfast', cuisine: 'home', minutes: 15, equipment: ['stove'], spice: 0, breakfastStyle: 'sweet',
    items: [['oats', 60], ['banana', 100], ['eggs', 100], ['berries', 60], ['greek_yogurt', 80]],
    stepsLt: ['Sutrinkite bananą su kiaušiniais ir dribsniais.', 'Kepkite mažus blynelius po 2 min.', 'Patiekite su mėlynėmis ir jogurtu.'],
    stepsRu: ['Разомните банан с яйцами и хлопьями.', 'Жарьте небольшие блины по 2 минуты.', 'Подавайте с черникой и йогуртом.'] }),
  r({ id: 'buckwheat_porridge', lt: 'Grikių blynai su bananu ir uogomis', ru: 'Гречневые блины с бананом и ягодами', emoji: '🥞', meal: 'breakfast', cuisine: 'home', minutes: 20, equipment: ['stove', 'blender'], spice: 0, breakfastStyle: 'sweet',
    items: [['buckwheat', 60], ['milk', 120], ['eggs', 60], ['banana', 100], ['berries', 60]],
    stepsLt: ['Sumalkite grikius į miltus.', 'Sumaišykite su pienu ir kiaušiniu, kepkite blynelius.', 'Patiekite su bananu ir uogomis.'],
    stepsRu: ['Смелите гречку в муку.', 'Смешайте с молоком и яйцом, жарьте блинчики.', 'Подавайте с бананом и ягодами.'] }),
  r({ id: 'rice_porridge_vegan', lt: 'Ryžių blyneliai su bananu', ru: 'Рисовые блинчики с бананом', emoji: '🍌', meal: 'breakfast', cuisine: 'asian', minutes: 20, equipment: ['stove', 'blender'], spice: 0, breakfastStyle: 'sweet',
    items: [['rice', 60], ['banana', 100], ['berries', 60], ['peanut_butter', 20]],
    stepsLt: ['Sumalkite ryžius ir sumaišykite su bananu bei vandeniu.', 'Kepkite blynelius po 2 min.', 'Patiekite su uogomis ir žemės riešutų kremu.'],
    stepsRu: ['Смелите рис и смешайте с бананом и водой.', 'Жарьте блинчики по 2 минуты.', 'Подавайте с ягодами и арахисовой пастой.'] }),

  // ---------- Lunch ----------
  r({ id: 'chicken_buckwheat', lt: 'Kepta vištiena su grikiais ir daržovėmis', ru: 'Курица-гриль с гречкой и овощами', emoji: '🍗', meal: 'lunch', cuisine: 'home', minutes: 25, equipment: ['stove'], spice: 0,
    items: [['chicken_breast', 150], ['buckwheat', 70], ['broccoli', 120], ['carrot', 60], ['olive_oil', 7]],
    stepsLt: ['Išvirkite grikius (15 min.).', 'Apkepkite vištieną keptuvėje.', 'Daržoves virkite garuose 5 min.'],
    stepsRu: ['Отварите гречку (15 минут).', 'Обжарьте курицу на сковороде-гриль.', 'Овощи приготовьте на пару 5 минут.'] }),
  r({ id: 'turkey_pasta', lt: 'Makaronai su kalakutiena ir pomidorų padažu', ru: 'Паста с индейкой в томатном соусе', emoji: '🍝', meal: 'lunch', cuisine: 'italian', minutes: 25, equipment: ['stove'], spice: 0,
    items: [['pasta', 80], ['turkey_mince', 130], ['tomato', 150], ['onion', 40], ['olive_oil', 5]],
    stepsLt: ['Išvirkite makaronus.', 'Pakepinkite svogūną ir faršą.', 'Sudėkite pomidorus, troškinkite 10 min.'],
    stepsRu: ['Отварите пасту.', 'Обжарьте лук и фарш.', 'Добавьте помидоры, тушите 10 минут.'] }),
  r({ id: 'lentil_soup', lt: 'Raudonųjų lęšių sriuba', ru: 'Суп из красной чечевицы', emoji: '🍲', meal: 'lunch', cuisine: 'mediterranean', minutes: 30, equipment: ['stove'], spice: 1,
    items: [['lentils', 70], ['carrot', 80], ['onion', 50], ['tomato', 100], ['rye_bread', 50], ['olive_oil', 7]],
    stepsLt: ['Pakepinkite svogūną ir morką.', 'Sudėkite lęšius, pomidorus ir 600 ml vandens, virkite 20 min.', 'Sutrinkite, patiekite su duona.'],
    stepsRu: ['Обжарьте лук и морковь.', 'Добавьте чечевицу, помидоры и 600 мл воды, варите 20 минут.', 'Пюрируйте, подавайте с хлебом.'] }),
  r({ id: 'shrimp_rice', lt: 'Krevetės su ryžiais ir daržovėmis', ru: 'Креветки с рисом и овощами', emoji: '🍤', meal: 'lunch', cuisine: 'asian', minutes: 25, equipment: ['stove'], spice: 1,
    items: [['rice', 70], ['shrimp', 150], ['mixed_veg', 150], ['soy_sauce', 15], ['sesame', 5]],
    stepsLt: ['Išvirkite ryžius.', 'Pakepinkite daržoves ir krevetes 5 min.', 'Pagardinkite sojų padažu ir sezamu.'],
    stepsRu: ['Отварите рис.', 'Обжарьте овощи и креветки 5 минут.', 'Заправьте соевым соусом и кунжутом.'] }),
  r({ id: 'beef_potatoes', lt: 'Šiltos salotos su jautiena ir bulvėmis', ru: 'Тёплый салат с говядиной и картофелем', emoji: '🥩', meal: 'lunch', cuisine: 'home', minutes: 25, equipment: ['stove'], spice: 1,
    items: [['beef_mince', 120], ['potatoes', 200], ['spinach', 40], ['cucumber', 80], ['tomato', 80]],
    stepsLt: ['Išvirkite bulves.', 'Apkepkite jautieną.', 'Sumaišykite su špinatais ir daržovėmis.'],
    stepsRu: ['Отварите картофель.', 'Обжарьте говядину.', 'Смешайте со шпинатом и овощами.'] }),
  r({ id: 'chickpea_curry', lt: 'Avinžirnių karis su ryžiais', ru: 'Карри из нута с рисом', emoji: '🍛', meal: 'lunch', cuisine: 'asian', minutes: 25, equipment: ['stove'], spice: 2,
    items: [['chickpeas', 200], ['rice', 60], ['spinach', 60], ['tomato', 150], ['olive_oil', 7]],
    stepsLt: ['Išvirkite ryžius.', 'Troškinkite avinžirnius su pomidorais ir prieskoniais 10 min.', 'Įmaišykite špinatus.'],
    stepsRu: ['Отварите рис.', 'Тушите нут с помидорами и специями 10 минут.', 'Вмешайте шпинат.'] }),
  r({ id: 'pork_oven', lt: 'Kiaulienos iešmeliai su keptomis bulvėmis', ru: 'Шашлычки из свинины с запечённым картофелем', emoji: '🍢', meal: 'lunch', cuisine: 'georgian', minutes: 40, equipment: ['oven'], spice: 1,
    items: [['pork_loin', 130], ['potatoes', 200], ['onion', 50], ['tomato', 100]],
    stepsLt: ['Mėsą supjaustykite ir suverkite ant iešmelių.', 'Kepkite su bulvėmis 200 °C 30 min.', 'Patiekite su pomidorais.'],
    stepsRu: ['Нарежьте мясо и наденьте на шпажки.', 'Запекайте с картофелем при 200 °C 30 минут.', 'Подавайте с помидорами.'] }),

  // ---------- Snack ----------
  r({ id: 'apple_walnuts', lt: 'Obuolys, uogos ir riešutai', ru: 'Яблоко, ягоды и орехи', emoji: '🍎', meal: 'snack', cuisine: 'home', minutes: 3, equipment: [], spice: 0,
    items: [['apple', 150], ['berries', 50], ['walnuts', 15]], stepsLt: ['Supjaustykite obuolį, patiekite su uogomis ir riešutais.'], stepsRu: ['Нарежьте яблоко, подавайте с ягодами и орехами.'] }),
  r({ id: 'kefir_banana', lt: 'Kefyras su vaisiais', ru: 'Кефир с фруктами', emoji: '🍌', meal: 'snack', cuisine: 'home', minutes: 2, equipment: [], spice: 0,
    items: [['kefir', 250], ['banana', 100], ['apple', 80]], stepsLt: ['Supjaustykite vaisius ir patiekite su kefyru.'], stepsRu: ['Нарежьте фрукты и подавайте с кефиром.'] }),
  r({ id: 'curd_honey', lt: 'Varškė su medumi ir uogomis', ru: 'Творог с мёдом и ягодами', emoji: '🍓', meal: 'snack', cuisine: 'home', minutes: 3, equipment: [], spice: 0,
    items: [['cottage_cheese', 150], ['honey', 10], ['berries', 60]], stepsLt: ['Sumaišykite varškę su uogomis ir užpilkite medumi.'], stepsRu: ['Смешайте творог с ягодами и полейте мёдом.'] }),
  r({ id: 'carrot_hummus', lt: 'Daržovių lazdelės su avinžirnių užtepėle', ru: 'Овощные палочки с нутовой пастой', emoji: '🥕', meal: 'snack', cuisine: 'mediterranean', minutes: 7, equipment: ['blender'], spice: 0,
    items: [['chickpeas', 100], ['carrot', 100], ['cucumber', 80], ['olive_oil', 5]], stepsLt: ['Sutrinkite avinžirnius su aliejumi.', 'Patiekite su morkų ir agurkų lazdelėmis.'], stepsRu: ['Пюрируйте нут с маслом.', 'Подавайте с палочками моркови и огурца.'] }),
  r({ id: 'yogurt_nuts', lt: 'Graikiškas jogurtas su uogomis ir riešutais', ru: 'Греческий йогурт с ягодами и орехами', emoji: '🥛', meal: 'snack', cuisine: 'home', minutes: 2, equipment: [], spice: 0,
    items: [['greek_yogurt', 170], ['berries', 40], ['walnuts', 10]], stepsLt: ['Sudėkite uogas ir riešutus ant jogurto.'], stepsRu: ['Выложите ягоды и орехи на йогурт.'] }),

  // ---------- Dinner ----------
  r({ id: 'cod_veg', lt: 'Menkė su daržovėmis', ru: 'Треска с овощами', emoji: '🐟', meal: 'dinner', cuisine: 'home', minutes: 25, equipment: ['oven'], spice: 0,
    items: [['cod', 200], ['mixed_veg', 200], ['potatoes', 150], ['olive_oil', 7]],
    stepsLt: ['Sudėkite žuvį, daržoves ir bulves į kepimo indą.', 'Apšlakstykite aliejumi.', 'Kepkite 200 °C 20 min.'],
    stepsRu: ['Выложите рыбу, овощи и картофель в форму.', 'Сбрызните маслом.', 'Запекайте при 200 °C 20 минут.'] }),
  r({ id: 'tuna_salad', lt: 'Salotos su tunu ir kiaušiniu', ru: 'Салат с тунцом и яйцом', emoji: '🥗', meal: 'dinner', cuisine: 'mediterranean', minutes: 12, equipment: ['stove'], spice: 0,
    items: [['tuna_can', 120], ['eggs', 50], ['cucumber', 100], ['tomato', 100], ['spinach', 40], ['olive_oil', 7]],
    stepsLt: ['Išvirkite kiaušinį.', 'Supjaustykite daržoves, sudėkite tuną.', 'Pagardinkite aliejumi.'],
    stepsRu: ['Сварите яйцо.', 'Нарежьте овощи, добавьте тунец.', 'Заправьте маслом.'] }),
  r({ id: 'salmon_rice', lt: 'Lašiša su ryžiais ir daržovėmis', ru: 'Лосось с рисом и овощами', emoji: '🐟', meal: 'dinner', cuisine: 'asian', minutes: 25, equipment: ['oven'], spice: 0,
    items: [['salmon', 130], ['rice', 60], ['broccoli', 120], ['carrot', 50]],
    stepsLt: ['Kepkite lašišą 200 °C 15 min.', 'Išvirkite ryžius.', 'Daržoves virkite garuose 5 min.'],
    stepsRu: ['Запекайте лосось при 200 °C 15 минут.', 'Отварите рис.', 'Овощи приготовьте на пару 5 минут.'] }),
  r({ id: 'chicken_wrap', lt: 'Salotos su vištiena ir jogurto padažu', ru: 'Салат с курицей и йогуртовым соусом', emoji: '🥗', meal: 'dinner', cuisine: 'mediterranean', minutes: 15, equipment: ['stove'], spice: 0,
    items: [['chicken_breast', 130], ['cucumber', 100], ['tomato', 100], ['spinach', 40], ['greek_yogurt', 60], ['rye_bread', 40]],
    stepsLt: ['Apkepkite vištieną ir supjaustykite.', 'Sumaišykite su daržovėmis.', 'Užpilkite jogurto padažu.'],
    stepsRu: ['Обжарьте курицу и нарежьте.', 'Смешайте с овощами.', 'Полейте йогуртовым соусом.'] }),
  r({ id: 'tofu_buckwheat', lt: 'Grikių makaronai (soba) su tofu ir daržovėmis', ru: 'Гречневая лапша соба с тофу и овощами', emoji: '🍜', meal: 'dinner', cuisine: 'asian', minutes: 20, equipment: ['stove'], spice: 1,
    items: [['tofu', 180], ['mixed_veg', 200], ['buckwheat', 60], ['soy_sauce', 15]],
    stepsLt: ['Išvirkite grikius arba soba makaronus.', 'Apkepkite tofu ir daržoves.', 'Pagardinkite sojų padažu.'],
    stepsRu: ['Отварите гречку или лапшу соба.', 'Обжарьте тофу и овощи.', 'Заправьте соевым соусом.'] }),
  r({ id: 'bean_stew', lt: 'Ankštinių troškinys su daržovėmis', ru: 'Рагу из бобовых с овощами', emoji: '🫘', meal: 'dinner', cuisine: 'georgian', minutes: 25, equipment: ['stove'], spice: 1,
    items: [['beans', 200], ['chickpeas', 100], ['carrot', 80], ['onion', 50], ['tomato', 150]],
    stepsLt: ['Pakepinkite svogūną ir morką.', 'Sudėkite pupeles, avinžirnius ir pomidorus.', 'Troškinkite 15 min.'],
    stepsRu: ['Обжарьте лук и морковь.', 'Добавьте фасоль, нут и помидоры.', 'Тушите 15 минут.'] }),
  r({ id: 'turkey_beet', lt: 'Kalakutienos kukuliai su daržovėmis', ru: 'Тефтели из индейки с овощами', emoji: '🍽️', meal: 'dinner', cuisine: 'home', minutes: 35, equipment: ['oven'], spice: 0,
    items: [['turkey_mince', 150], ['beetroot', 150], ['potatoes', 150], ['spinach', 30], ['olive_oil', 7]],
    stepsLt: ['Suformuokite kukulius.', 'Kepkite su burokėliais ir bulvėmis 200 °C 25 min.', 'Patiekite su špinatais.'],
    stepsRu: ['Сформируйте тефтели.', 'Запекайте со свёклой и картофелем при 200 °C 25 минут.', 'Подавайте со шпинатом.'] }),
  r({ id: 'egg_bake', lt: 'Dubenėlis su kiaušiniu, brokoliais ir sūriu', ru: 'Боул с яйцом, брокколи и сыром', emoji: '🥦', meal: 'dinner', cuisine: 'home', minutes: 20, equipment: ['stove'], spice: 0,
    items: [['eggs', 120], ['broccoli', 150], ['cheese', 25], ['buckwheat', 50], ['cucumber', 80]],
    stepsLt: ['Išvirkite grikius ir kiaušinius.', 'Brokolius virkite garuose 5 min.', 'Sudėkite į dubenėlį ir pabarstykite sūriu.'],
    stepsRu: ['Отварите гречку и яйца.', 'Брокколи приготовьте на пару 5 минут.', 'Соберите боул и посыпьте сыром.'] }),
];
