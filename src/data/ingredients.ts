import type { Allergen, DietFlag } from '../lib/types';

/**
 * Ingredient catalogue. Nutrition is per 100 g (typical values for the raw / dry
 * product). Real store prices live in src/data/prices.ts.
 */
export interface Ingredient {
  id: string;
  lt: string;
  ru: string;
  emoji: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  allergens: Allergen[];
  flags: DietFlag[];
  /** counts towards the daily vegetables & fruit target */
  veg?: boolean;
}

const I = (
  id: string, lt: string, ru: string, emoji: string,
  n: [number, number, number, number, number, number],
  allergens: Allergen[], flags: DietFlag[], extra: Partial<Ingredient> = {},
): Ingredient => ({
  id, lt, ru, emoji, kcal: n[0], protein: n[1], fat: n[2], carbs: n[3], fiber: n[4], sugar: n[5],
  allergens, flags, ...extra,
});

const POULTRY: DietFlag[] = ['meat', 'poultry', 'animal'];

export const INGREDIENTS: Ingredient[] = [
  I('chicken_breast', 'Vištienos krūtinėlė', 'Куриное филе', '🍗', [110, 23, 1.5, 0, 0, 0], [], POULTRY),
  I('turkey_mince', 'Kalakutienos faršas', 'Фарш индейки', '🦃', [150, 19, 8, 0, 0, 0], [], POULTRY),
  I('beef_mince', 'Jautienos faršas', 'Говяжий фарш', '🥩', [250, 17, 20, 0, 0, 0], [], ['meat', 'beef', 'animal']),
  I('pork_loin', 'Kiaulienos nugarinė', 'Свиная корейка', '🥩', [200, 21, 13, 0, 0, 0], [], ['meat', 'pork', 'animal']),
  I('cod', 'Menkės filė', 'Филе трески', '🐟', [82, 18, 0.7, 0, 0, 0], ['fish'], ['fish', 'animal']),
  I('salmon', 'Lašiša', 'Лосось', '🐟', [208, 20, 13, 0, 0, 0], ['fish'], ['fish', 'animal']),
  I('tuna_can', 'Tunas savo sultyse', 'Тунец в собственном соку', '🥫', [116, 26, 1, 0, 0, 0], ['fish'], ['fish', 'animal']),
  I('shrimp', 'Krevetės', 'Креветки', '🦐', [85, 20, 0.5, 0, 0, 0], ['crustaceans'], ['seafood', 'animal']),
  I('eggs', 'Kiaušiniai', 'Яйца', '🥚', [143, 12.6, 9.5, 0.7, 0, 0.4], ['eggs'], ['egg', 'animal']),
  I('cottage_cheese', 'Varškė 5%', 'Творог 5%', '🧀', [121, 17, 5, 1.8, 0, 1.8], ['milk'], ['dairy', 'animal']),
  I('greek_yogurt', 'Graikiškas jogurtas 2%', 'Греческий йогурт 2%', '🥛', [66, 9, 2, 3.6, 0, 3.6], ['milk'], ['dairy', 'animal']),
  I('kefir', 'Kefyras', 'Кефир', '🥛', [50, 3, 2.5, 4, 0, 4], ['milk'], ['dairy', 'animal']),
  I('milk', 'Pienas 1,5%', 'Молоко 1,5%', '🥛', [46, 3.2, 1.5, 4.8, 0, 4.8], ['milk'], ['dairy', 'animal']),
  I('cheese', 'Kietasis sūris', 'Твёрдый сыр', '🧀', [350, 25, 27, 1, 0, 0.5], ['milk'], ['dairy', 'animal']),
  I('tofu', 'Tofu', 'Тофу', '⬜', [120, 13, 7, 2, 1, 0.5], ['soy'], []),
  I('lentils', 'Raudonieji lęšiai', 'Красная чечевица', '🫘', [340, 24, 1.5, 52, 11, 2], [], []),
  I('chickpeas', 'Avinžirniai (konservuoti)', 'Нут консервированный', '🫘', [120, 7, 2.5, 18, 6, 0.5], [], []),
  I('beans', 'Raudonosios pupelės (konservuotos)', 'Красная фасоль консервированная', '🫘', [100, 7, 0.5, 15, 6, 0.3], [], []),
  I('buckwheat', 'Grikiai', 'Гречка', '🌾', [343, 13, 3.4, 62, 10, 0], [], []),
  I('oats', 'Avižiniai dribsniai', 'Овсяные хлопья', '🌾', [370, 13, 7, 58, 10, 1], ['gluten'], []),
  I('rice', 'Ryžiai', 'Рис', '🍚', [350, 7, 0.6, 78, 1, 0], [], []),
  I('pasta', 'Pilno grūdo makaronai', 'Цельнозерновая паста', '🍝', [350, 13, 2.5, 64, 9, 3], ['gluten'], []),
  I('rye_bread', 'Ruginė duona', 'Ржаной хлеб', '🍞', [220, 6, 1.5, 42, 7, 3], ['gluten'], []),
  I('lavash', 'Lavašas', 'Лаваш', '🫓', [290, 9, 2, 58, 2, 1], ['gluten'], []),
  I('potatoes', 'Bulvės', 'Картофель', '🥔', [77, 2, 0.1, 17, 2.2, 0.8], [], []),
  I('broccoli', 'Brokoliai', 'Брокколи', '🥦', [34, 2.8, 0.4, 7, 2.6, 1.7], [], [], { veg: true }),
  I('mixed_veg', 'Daržovių mišinys (šaldytas)', 'Овощная смесь (заморож.)', '🥕', [50, 2.5, 0.5, 8, 3, 3], [], [], { veg: true }),
  I('tomato', 'Pomidorai', 'Помидоры', '🍅', [18, 0.9, 0.2, 3.9, 1.2, 2.6], [], [], { veg: true }),
  I('cucumber', 'Agurkai', 'Огурцы', '🥒', [15, 0.7, 0.1, 3.6, 0.5, 1.7], [], [], { veg: true }),
  I('carrot', 'Morkos', 'Морковь', '🥕', [41, 0.9, 0.2, 10, 2.8, 4.7], [], [], { veg: true }),
  I('onion', 'Svogūnai', 'Лук', '🧅', [40, 1.1, 0.1, 9, 1.7, 4.2], [], [], { veg: true }),
  I('mushrooms', 'Pievagrybiai', 'Шампиньоны', '🍄', [22, 3.1, 0.3, 3.3, 1, 2], [], [], { veg: true }),
  I('spinach', 'Špinatai', 'Шпинат', '🥬', [23, 2.9, 0.4, 3.6, 2.2, 0.4], [], [], { veg: true }),
  I('beetroot', 'Burokėliai', 'Свёкла', '🟣', [43, 1.6, 0.2, 10, 2.8, 7], [], [], { veg: true }),
  I('apple', 'Obuoliai', 'Яблоки', '🍎', [52, 0.3, 0.2, 14, 2.4, 10], [], [], { veg: true }),
  I('banana', 'Bananai', 'Бананы', '🍌', [89, 1.1, 0.3, 23, 2.6, 12], [], [], { veg: true }),
  I('berries', 'Uogų mišinys (šaldytas)', 'Ягодная смесь (заморож.)', '🫐', [50, 1, 0.3, 12, 5, 7], [], [], { veg: true }),
  I('avocado', 'Avokadas', 'Авокадо', '🥑', [160, 2, 15, 9, 7, 0.7], [], [], { veg: true }),
  I('zucchini', 'Cukinijos', 'Кабачки', '🥒', [17, 1.2, 0.3, 3.1, 1, 2.5], [], [], { veg: true }),
  I('bell_pepper', 'Paprikos', 'Болгарский перец', '🫑', [31, 1, 0.3, 6, 2.1, 4.2], [], [], { veg: true }),
  I('cabbage', 'Baltagūžiai kopūstai', 'Белокочанная капуста', '🥬', [25, 1.3, 0.1, 5.8, 2.5, 3.2], [], [], { veg: true }),
  I('cauliflower', 'Žiediniai kopūstai', 'Цветная капуста', '🥦', [25, 1.9, 0.3, 5, 2, 1.9], [], [], { veg: true }),
  I('green_peas', 'Žalieji žirneliai (šaldyti)', 'Зелёный горошек (заморож.)', '🫛', [81, 5.4, 0.4, 14, 5, 5.7], [], [], { veg: true }),
  I('corn', 'Kukurūzai (konservuoti)', 'Кукуруза консервированная', '🌽', [81, 2.5, 1.2, 15, 2.5, 4.5], [], [], { veg: true }),
  I('pumpkin', 'Moliūgas', 'Тыква', '🎃', [26, 1, 0.1, 6.5, 0.5, 2.8], [], [], { veg: true }),
  I('sweet_potato', 'Batatai', 'Батат', '🍠', [86, 1.6, 0.1, 20, 3, 4.2], [], [], { veg: true }),
  I('garlic', 'Česnakai', 'Чеснок', '🧄', [149, 6.4, 0.5, 33, 2.1, 1], [], []),
  I('lemon', 'Citrinos', 'Лимоны', '🍋', [29, 1.1, 0.3, 9, 2.8, 2.5], [], [], { veg: true }),
  I('pear', 'Kriaušės', 'Груши', '🍐', [57, 0.4, 0.1, 15, 3.1, 10], [], [], { veg: true }),
  I('orange', 'Apelsinai', 'Апельсины', '🍊', [47, 0.9, 0.1, 12, 2.4, 9], [], [], { veg: true }),
  I('canned_tomatoes', 'Pomidorai savo sultyse', 'Томаты в собственном соку', '🥫', [21, 1, 0.2, 4, 1, 3], [], [], { veg: true }),
  I('bulgur', 'Bulguras', 'Булгур', '🌾', [342, 12, 1.3, 76, 18, 0.4], ['gluten'], []),
  I('barley', 'Perlinės kruopos', 'Перловая крупа', '🌾', [352, 10, 1.2, 78, 16, 0.8], ['gluten'], []),
  I('quinoa', 'Bolivinė balanda (kinva)', 'Киноа', '🌾', [368, 14, 6, 64, 7, 0], [], []),
  I('chicken_thigh', 'Vištienos šlaunelių mėsa', 'Куриное бедро без кожи', '🍗', [177, 20, 10, 0, 0, 0], [], POULTRY),
  I('turkey_fillet', 'Kalakutienos filė', 'Филе индейки', '🦃', [114, 24, 1.5, 0, 0, 0], [], POULTRY),
  I('sour_cream', 'Grietinė', 'Сметана', '🥛', [134, 2.8, 12, 3.6, 0, 3.6], ['milk'], ['dairy', 'animal']),
  I('feta', 'Fetos sūris', 'Сыр фета', '🧀', [264, 14, 21, 4, 0, 4], ['milk'], ['dairy', 'animal']),
  I('natural_yogurt', 'Natūralus jogurtas', 'Натуральный йогурт', '🥛', [61, 3.5, 3.3, 4.7, 0, 4.7], ['milk'], ['dairy', 'animal']),
  I('sunflower_seeds', 'Saulėgrąžos', 'Семечки подсолнечника', '🌻', [584, 21, 51, 20, 9, 2.6], [], []),
  I('walnuts', 'Graikiniai riešutai', 'Грецкие орехи', '🌰', [654, 15, 65, 14, 7, 2.6], ['nuts'], []),
  I('peanut_butter', 'Žemės riešutų sviestas', 'Арахисовая паста', '🥜', [588, 25, 50, 20, 6, 9], ['peanuts'], []),
  I('sesame', 'Sezamo sėklos', 'Кунжут', '⚪', [573, 18, 50, 23, 12, 0.3], ['sesame'], []),
  I('soy_sauce', 'Sojų padažas', 'Соевый соус', '🫙', [53, 8, 0.6, 5, 0.8, 0.4], ['soy', 'gluten'], []),
  I('olive_oil', 'Alyvuogių aliejus', 'Оливковое масло', '🫒', [884, 0, 100, 0, 0, 0], [], []),
  I('honey', 'Medus', 'Мёд', '🍯', [304, 0.3, 0, 82, 0, 82], [], ['animal']),
];

export const INGREDIENT_BY_ID: Record<string, Ingredient> = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

/** Ingredients a user can mark as disliked in the quiz. */
export const DISLIKE_OPTIONS = [
  'mushrooms', 'cottage_cheese', 'cod', 'salmon', 'shrimp', 'broccoli', 'cauliflower', 'beetroot',
  'cabbage', 'zucchini', 'bell_pepper', 'pumpkin', 'avocado', 'beans', 'chickpeas', 'lentils', 'tofu',
  'onion', 'garlic', 'kefir', 'buckwheat', 'barley', 'feta', 'sour_cream',
];
