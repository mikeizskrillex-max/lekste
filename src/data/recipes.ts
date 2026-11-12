import type { Equipment, MealType } from '../lib/types';

/**
 * Starter recipe library (per ONE serving). Nutrition, allergens, diet flags
 * and price are never stored here: they are computed from the ingredients in
 * src/lib/recipes.ts. Before launch the library should grow to 80–120 recipes.
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

export const RECIPES: Recipe[] = [
  // ---------- Breakfast ----------
  {
    id: 'oat_berries', lt: 'Avižinė košė su uogomis ir jogurtu', ru: 'Овсянка с ягодами и йогуртом', emoji: '🥣',
    meal: 'breakfast', cuisine: 'home', minutes: 10, equipment: ['stove'], spice: 0, breakfastStyle: 'sweet',
    items: [['oats', 60], ['milk', 200], ['berries', 80], ['greek_yogurt', 100]],
    stepsLt: ['Virkite dribsnius piene 5 minutes.', 'Sudėkite uogas ir pamaišykite.', 'Patiekite su jogurtu.'],
    stepsRu: ['Варите хлопья в молоке 5 минут.', 'Добавьте ягоды и перемешайте.', 'Подавайте с йогуртом.'],
  },
  {
    id: 'syrniki', lt: 'Varškėčiai su jogurtu', ru: 'Сырники с йогуртом', emoji: '🥞',
    meal: 'breakfast', cuisine: 'home', minutes: 20, equipment: ['stove'], spice: 0, breakfastStyle: 'sweet',
    items: [['cottage_cheese', 200], ['eggs', 50], ['oats', 30], ['greek_yogurt', 80], ['berries', 50]],
    stepsLt: ['Sumaišykite varškę, kiaušinį ir sumaltus dribsnius.', 'Suformuokite paplotėlius ir kepkite be aliejaus po 3 min. iš abiejų pusių.', 'Patiekite su jogurtu ir uogomis.'],
    stepsRu: ['Смешайте творог, яйцо и измельчённые хлопья.', 'Сформируйте сырники и жарьте без масла по 3 минуты с каждой стороны.', 'Подавайте с йогуртом и ягодами.'],
  },
  {
    id: 'omelette_veg', lt: 'Omletas su daržovėmis', ru: 'Омлет с овощами', emoji: '🍳',
    meal: 'breakfast', cuisine: 'home', minutes: 15, equipment: ['stove'], spice: 0, breakfastStyle: 'savory',
    items: [['eggs', 150], ['tomato', 100], ['spinach', 50], ['cheese', 20], ['rye_bread', 50]],
    stepsLt: ['Išplakite kiaušinius.', 'Pakepinkite špinatus ir pomidorus, užpilkite kiaušiniais.', 'Pabarstykite sūriu ir patiekite su duona.'],
    stepsRu: ['Взбейте яйца.', 'Обжарьте шпинат и помидоры, залейте яйцами.', 'Посыпьте сыром и подавайте с хлебом.'],
  },
  {
    id: 'curd_toast', lt: 'Skrebutis su varške ir pomidorais', ru: 'Тост с творогом и помидорами', emoji: '🥪',
    meal: 'breakfast', cuisine: 'home', minutes: 8, equipment: [], spice: 0, breakfastStyle: 'savory',
    items: [['rye_bread', 80], ['cottage_cheese', 150], ['tomato', 100], ['cucumber', 80]],
    stepsLt: ['Paskrudinkite duoną.', 'Užtepkite varškę.', 'Ant viršaus dėkite pomidorus ir agurkus.'],
    stepsRu: ['Подсушите хлеб.', 'Намажьте творог.', 'Сверху выложите помидоры и огурцы.'],
  },
  {
    id: 'tofu_scramble', lt: 'Tofu plakinys su daržovėmis', ru: 'Тофу-скрэмбл с овощами', emoji: '🍳',
    meal: 'breakfast', cuisine: 'home', minutes: 15, equipment: ['stove'], spice: 0, breakfastStyle: 'savory',
    items: [['tofu', 200], ['spinach', 50], ['tomato', 100], ['rye_bread', 60], ['olive_oil', 5]],
    stepsLt: ['Sutrupinkite tofu.', 'Pakepinkite su aliejumi, špinatais ir pomidorais 7 minutes.', 'Patiekite su duona.'],
    stepsRu: ['Раскрошите тофу.', 'Обжарьте с маслом, шпинатом и помидорами 7 минут.', 'Подавайте с хлебом.'],
  },
  {
    id: 'banana_pancakes', lt: 'Bananų ir avižų blynai', ru: 'Бананово-овсяные блины', emoji: '🥞',
    meal: 'breakfast', cuisine: 'home', minutes: 15, equipment: ['stove'], spice: 0, breakfastStyle: 'sweet',
    items: [['oats', 60], ['banana', 100], ['eggs', 100], ['greek_yogurt', 100]],
    stepsLt: ['Sutrinkite bananą su kiaušiniais ir dribsniais.', 'Kepkite mažus blynelius po 2 min. iš abiejų pusių.', 'Patiekite su jogurtu.'],
    stepsRu: ['Разомните банан с яйцами и хлопьями.', 'Жарьте небольшие блины по 2 минуты с каждой стороны.', 'Подавайте с йогуртом.'],
  },

  {
    id: 'buckwheat_porridge', lt: 'Grikių košė su pienu ir uogomis', ru: 'Гречневая каша с молоком и ягодами', emoji: '🥣',
    meal: 'breakfast', cuisine: 'home', minutes: 15, equipment: ['stove'], spice: 0, breakfastStyle: 'sweet',
    items: [['buckwheat', 60], ['milk', 200], ['berries', 80], ['cottage_cheese', 80]],
    stepsLt: ['Virkite grikius piene 12 min.', 'Sudėkite uogas.', 'Patiekite su varške.'],
    stepsRu: ['Варите гречку в молоке 12 минут.', 'Добавьте ягоды.', 'Подавайте с творогом.'],
  },
  {
    id: 'eggs_avocado', lt: 'Kiaušiniai su avokadu ir keptomis bulvėmis', ru: 'Яйца с авокадо и жареным картофелем', emoji: '🥑',
    meal: 'breakfast', cuisine: 'mediterranean', minutes: 20, equipment: ['stove'], spice: 0, breakfastStyle: 'savory',
    items: [['eggs', 120], ['avocado', 60], ['tomato', 100], ['potatoes', 150]],
    stepsLt: ['Supjaustytas bulves apkepkite keptuvėje 12 min.', 'Iškepkite kiaušinius.', 'Patiekite su avokadu ir pomidorais.'],
    stepsRu: ['Нарезанный картофель обжарьте на сковороде 12 минут.', 'Пожарьте яйца.', 'Подавайте с авокадо и помидорами.'],
  },
  {
    id: 'rice_porridge_vegan', lt: 'Ryžių košė su bananu ir žemės riešutų sviestu', ru: 'Рисовая каша с бананом и арахисовой пастой', emoji: '🍚',
    meal: 'breakfast', cuisine: 'asian', minutes: 20, equipment: ['stove'], spice: 0, breakfastStyle: 'sweet',
    items: [['rice', 60], ['banana', 100], ['peanut_butter', 20], ['berries', 60]],
    stepsLt: ['Virkite ryžius vandenyje 18 min., kol suminkštės.', 'Sudėkite bananą ir uogas.', 'Užpilkite žemės riešutų sviestu.'],
    stepsRu: ['Варите рис в воде 18 минут до мягкости.', 'Добавьте банан и ягоды.', 'Полейте арахисовой пастой.'],
  },

  // ---------- Lunch ----------
  {
    id: 'chicken_buckwheat', lt: 'Vištiena su grikiais ir brokoliais', ru: 'Курица с гречкой и брокколи', emoji: '🍗',
    meal: 'lunch', cuisine: 'home', minutes: 25, equipment: ['stove'], spice: 0,
    items: [['chicken_breast', 150], ['buckwheat', 70], ['broccoli', 150], ['olive_oil', 7]],
    stepsLt: ['Išvirkite grikius (15 min.).', 'Apkepkite vištieną su aliejumi.', 'Brokolius virkite garuose 5 min. ir viską sudėkite į lėkštę.'],
    stepsRu: ['Отварите гречку (15 минут).', 'Обжарьте курицу на масле.', 'Брокколи приготовьте на пару 5 минут и выложите всё на тарелку.'],
  },
  {
    id: 'turkey_pasta', lt: 'Makaronai su kalakutiena ir pomidorais', ru: 'Паста с индейкой и томатами', emoji: '🍝',
    meal: 'lunch', cuisine: 'italian', minutes: 25, equipment: ['stove'], spice: 0,
    items: [['pasta', 80], ['turkey_mince', 130], ['tomato', 150], ['onion', 40], ['olive_oil', 5]],
    stepsLt: ['Išvirkite makaronus.', 'Pakepinkite svogūną ir faršą.', 'Sudėkite pomidorus, troškinkite 10 min. ir sumaišykite su makaronais.'],
    stepsRu: ['Отварите пасту.', 'Обжарьте лук и фарш.', 'Добавьте помидоры, тушите 10 минут и смешайте с пастой.'],
  },
  {
    id: 'lentil_soup', lt: 'Lęšių sriuba', ru: 'Суп из красной чечевицы', emoji: '🍲',
    meal: 'lunch', cuisine: 'mediterranean', minutes: 30, equipment: ['stove'], spice: 1,
    items: [['lentils', 70], ['carrot', 80], ['onion', 50], ['tomato', 100], ['rye_bread', 50], ['olive_oil', 7]],
    stepsLt: ['Pakepinkite svogūną ir morką aliejuje.', 'Sudėkite lęšius, pomidorus ir 600 ml vandens, virkite 20 min.', 'Sutrinkite ir patiekite su duona.'],
    stepsRu: ['Обжарьте лук и морковь на масле.', 'Добавьте чечевицу, помидоры и 600 мл воды, варите 20 минут.', 'Пюрируйте и подавайте с хлебом.'],
  },
  {
    id: 'shrimp_rice', lt: 'Ryžiai su krevetėmis ir daržovėmis', ru: 'Рис с креветками и овощами', emoji: '🍤',
    meal: 'lunch', cuisine: 'asian', minutes: 25, equipment: ['stove'], spice: 1,
    items: [['rice', 70], ['shrimp', 150], ['mixed_veg', 150], ['soy_sauce', 15], ['sesame', 5]],
    stepsLt: ['Išvirkite ryžius.', 'Pakepinkite daržoves ir krevetes 5 min.', 'Sumaišykite su ryžiais, sojų padažu ir sezamu.'],
    stepsRu: ['Отварите рис.', 'Обжарьте овощи и креветки 5 минут.', 'Смешайте с рисом, соевым соусом и кунжутом.'],
  },
  {
    id: 'beef_potatoes', lt: 'Jautienos kotletai su bulvėmis ir salotomis', ru: 'Говяжьи котлеты с картофелем и салатом', emoji: '🥩',
    meal: 'lunch', cuisine: 'home', minutes: 35, equipment: ['oven'], spice: 0,
    items: [['beef_mince', 120], ['potatoes', 250], ['cucumber', 100], ['tomato', 100]],
    stepsLt: ['Suformuokite kotletus ir kepkite orkaitėje 200 °C 20 min.', 'Išvirkite bulves.', 'Patiekite su agurkų ir pomidorų salotomis.'],
    stepsRu: ['Сформируйте котлеты и запекайте в духовке при 200 °C 20 минут.', 'Отварите картофель.', 'Подавайте с салатом из огурцов и помидоров.'],
  },
  {
    id: 'chickpea_curry', lt: 'Avinžirnių troškinys su ryžiais', ru: 'Нут с овощами и рисом', emoji: '🍛',
    meal: 'lunch', cuisine: 'asian', minutes: 25, equipment: ['stove'], spice: 2,
    items: [['chickpeas', 200], ['rice', 60], ['spinach', 80], ['tomato', 150], ['olive_oil', 7]],
    stepsLt: ['Išvirkite ryžius.', 'Troškinkite avinžirnius su pomidorais ir prieskoniais 10 min.', 'Įmaišykite špinatus ir patiekite su ryžiais.'],
    stepsRu: ['Отварите рис.', 'Тушите нут с помидорами и специями 10 минут.', 'Вмешайте шпинат и подавайте с рисом.'],
  },
  {
    id: 'pork_oven', lt: 'Orkaitėje kepta kiauliena su bulvėmis', ru: 'Запечённая свинина с картофелем', emoji: '🥩',
    meal: 'lunch', cuisine: 'home', minutes: 45, equipment: ['oven'], spice: 0,
    items: [['pork_loin', 130], ['potatoes', 200], ['broccoli', 150]],
    stepsLt: ['Mėsą ir bulves supjaustykite.', 'Kepkite orkaitėje 200 °C 35 min.', 'Patiekite su brokoliais.'],
    stepsRu: ['Нарежьте мясо и картофель.', 'Запекайте в духовке при 200 °C 35 минут.', 'Подавайте с брокколи.'],
  },

  // ---------- Snack ----------
  {
    id: 'apple_walnuts', lt: 'Obuolys ir graikiniai riešutai', ru: 'Яблоко и грецкие орехи', emoji: '🍎',
    meal: 'snack', cuisine: 'home', minutes: 2, equipment: [], spice: 0,
    items: [['apple', 150], ['walnuts', 20]], stepsLt: ['Supjaustykite obuolį ir patiekite su riešutais.'], stepsRu: ['Нарежьте яблоко и подавайте с орехами.'],
  },
  {
    id: 'kefir_banana', lt: 'Kefyras ir bananas', ru: 'Кефир и банан', emoji: '🍌',
    meal: 'snack', cuisine: 'home', minutes: 1, equipment: [], spice: 0,
    items: [['kefir', 300], ['banana', 100]], stepsLt: ['Patiekite kartu arba sutrinkite kokteiliui.'], stepsRu: ['Подавайте вместе или взбейте в коктейль.'],
  },
  {
    id: 'curd_honey', lt: 'Varškė su medumi ir uogomis', ru: 'Творог с мёдом и ягодами', emoji: '🍯',
    meal: 'snack', cuisine: 'home', minutes: 3, equipment: [], spice: 0,
    items: [['cottage_cheese', 150], ['honey', 10], ['berries', 50]], stepsLt: ['Sumaišykite varškę su uogomis ir užpilkite medumi.'], stepsRu: ['Смешайте творог с ягодами и полейте мёдом.'],
  },
  {
    id: 'carrot_hummus', lt: 'Morkos su avinžirnių užtepėle', ru: 'Морковь с нутовой пастой', emoji: '🥕',
    meal: 'snack', cuisine: 'mediterranean', minutes: 7, equipment: ['blender'], spice: 0,
    items: [['chickpeas', 100], ['carrot', 150], ['olive_oil', 5]], stepsLt: ['Sutrinkite avinžirnius su aliejumi.', 'Patiekite su morkų lazdelėmis.'], stepsRu: ['Пюрируйте нут с маслом.', 'Подавайте с морковными палочками.'],
  },
  {
    id: 'yogurt_nuts', lt: 'Graikiškas jogurtas su riešutais', ru: 'Греческий йогурт с орехами', emoji: '🥛',
    meal: 'snack', cuisine: 'home', minutes: 2, equipment: [], spice: 0,
    items: [['greek_yogurt', 170], ['walnuts', 15]], stepsLt: ['Pabarstykite jogurtą riešutais.'], stepsRu: ['Посыпьте йогурт орехами.'],
  },

  // ---------- Dinner ----------
  {
    id: 'cod_veg', lt: 'Menkė su daržovėmis ir bulvėmis', ru: 'Треска с овощами и картофелем', emoji: '🐟',
    meal: 'dinner', cuisine: 'home', minutes: 30, equipment: ['oven'], spice: 0,
    items: [['cod', 200], ['mixed_veg', 200], ['potatoes', 150], ['olive_oil', 7]],
    stepsLt: ['Sudėkite žuvį, daržoves ir bulves į kepimo indą.', 'Apšlakstykite aliejumi.', 'Kepkite 200 °C 25 min.'],
    stepsRu: ['Выложите рыбу, овощи и картофель в форму.', 'Сбрызните маслом.', 'Запекайте при 200 °C 25 минут.'],
  },
  {
    id: 'tuna_salad', lt: 'Salotos su tunu ir kiaušiniu', ru: 'Салат с тунцом и яйцом', emoji: '🥗',
    meal: 'dinner', cuisine: 'mediterranean', minutes: 12, equipment: ['stove'], spice: 0,
    items: [['tuna_can', 120], ['eggs', 50], ['cucumber', 100], ['tomato', 100], ['rye_bread', 40], ['olive_oil', 7]],
    stepsLt: ['Išvirkite kiaušinį.', 'Supjaustykite daržoves, sudėkite tuną.', 'Pagardinkite aliejumi, patiekite su duona.'],
    stepsRu: ['Сварите яйцо.', 'Нарежьте овощи, добавьте тунец.', 'Заправьте маслом, подавайте с хлебом.'],
  },
  {
    id: 'salmon_rice', lt: 'Lašiša su ryžiais ir brokoliais', ru: 'Лосось с рисом и брокколи', emoji: '🐟',
    meal: 'dinner', cuisine: 'asian', minutes: 25, equipment: ['oven'], spice: 0,
    items: [['salmon', 130], ['rice', 60], ['broccoli', 150]],
    stepsLt: ['Kepkite lašišą 200 °C 15 min.', 'Išvirkite ryžius.', 'Brokolius virkite garuose 5 min.'],
    stepsRu: ['Запекайте лосось при 200 °C 15 минут.', 'Отварите рис.', 'Брокколи приготовьте на пару 5 минут.'],
  },
  {
    id: 'chicken_wrap', lt: 'Lavašas su vištiena ir daržovėmis', ru: 'Лаваш с курицей и овощами', emoji: '🌯',
    meal: 'dinner', cuisine: 'georgian', minutes: 15, equipment: ['stove'], spice: 1,
    items: [['lavash', 80], ['chicken_breast', 130], ['cucumber', 80], ['tomato', 80], ['greek_yogurt', 50]],
    stepsLt: ['Apkepkite vištieną.', 'Ant lavašo dėkite jogurtą, daržoves ir vištieną.', 'Susukite ir trumpai paskrudinkite keptuvėje.'],
    stepsRu: ['Обжарьте курицу.', 'На лаваш выложите йогурт, овощи и курицу.', 'Сверните и коротко подрумяньте на сковороде.'],
  },
  {
    id: 'tofu_buckwheat', lt: 'Tofu su daržovėmis ir grikiais', ru: 'Тофу с овощами и гречкой', emoji: '🥢',
    meal: 'dinner', cuisine: 'asian', minutes: 25, equipment: ['stove'], spice: 1,
    items: [['tofu', 200], ['mixed_veg', 200], ['buckwheat', 50], ['soy_sauce', 15]],
    stepsLt: ['Išvirkite grikius.', 'Apkepkite tofu kubelius ir daržoves.', 'Pagardinkite sojų padažu ir sumaišykite.'],
    stepsRu: ['Отварите гречку.', 'Обжарьте кубики тофу и овощи.', 'Заправьте соевым соусом и перемешайте.'],
  },
  {
    id: 'bean_stew', lt: 'Pupelių troškinys su daržovėmis', ru: 'Рагу из фасоли с овощами', emoji: '🫘',
    meal: 'dinner', cuisine: 'georgian', minutes: 25, equipment: ['stove'], spice: 1,
    items: [['beans', 250], ['carrot', 80], ['onion', 50], ['tomato', 150], ['rye_bread', 50]],
    stepsLt: ['Pakepinkite svogūną ir morką.', 'Sudėkite pupeles ir pomidorus, troškinkite 15 min.', 'Patiekite su duona.'],
    stepsRu: ['Обжарьте лук и морковь.', 'Добавьте фасоль и помидоры, тушите 15 минут.', 'Подавайте с хлебом.'],
  },
  {
    id: 'turkey_beet', lt: 'Kalakutienos kukuliai su keptais burokėliais', ru: 'Тефтели из индейки с запечённой свёклой', emoji: '🍽️',
    meal: 'dinner', cuisine: 'home', minutes: 40, equipment: ['oven'], spice: 0,
    items: [['turkey_mince', 150], ['beetroot', 150], ['potatoes', 150], ['olive_oil', 7]],
    stepsLt: ['Suformuokite kukulius.', 'Kartu su burokėliais ir bulvėmis kepkite 200 °C 30 min.', 'Patiekite karštus.'],
    stepsRu: ['Сформируйте тефтели.', 'Запекайте вместе со свёклой и картофелем при 200 °C 30 минут.', 'Подавайте горячими.'],
  },
  {
    id: 'egg_bake', lt: 'Kiaušinių apkepas su brokoliais ir sūriu', ru: 'Запеканка из яиц с брокколи и сыром', emoji: '🥦',
    meal: 'dinner', cuisine: 'home', minutes: 30, equipment: ['oven'], spice: 0,
    items: [['eggs', 150], ['broccoli', 150], ['cheese', 30], ['rye_bread', 50]],
    stepsLt: ['Brokolius sudėkite į formą.', 'Užpilkite išplaktais kiaušiniais ir pabarstykite sūriu.', 'Kepkite 190 °C 20 min.'],
    stepsRu: ['Выложите брокколи в форму.', 'Залейте взбитыми яйцами и посыпьте сыром.', 'Запекайте при 190 °C 20 минут.'],
  },
];
