import type { QuizAnswers } from '@/domain/types';

type L = { lt: string; ru: string };
export interface Program {
  id: string;
  emoji: string;
  name: L;
  /** one line under the name */
  tag: L;
  /** what the week looks like — shown when the program is open */
  how: L[];
  /** answers this program sets on top of the person's own */
  preset: Partial<QuizAnswers>;
  /** protein per kg body weight, when the program needs more than the default */
  proteinPerKg?: number;
  /** default sex for the preview (muscle gain is mostly searched by men) */
  sex?: 'f' | 'm';
  /** weekly budget per person used for the preview */
  budgetPerPerson: number;
}

export const PROGRAMS: Program[] = [
  {
    id: 'pp', emoji: '🥗', name: { lt: 'Sveika mityba', ru: 'Правильное питание (ПП)' },
    tag: { lt: 'Subalansuota kasdienė mityba be dietų', ru: 'Сбалансированно каждый день, без диет' },
    how: [
      { lt: 'Kalorijos — pagal jūsų normą, be deficito', ru: 'Калории — по вашей норме, без дефицита' },
      { lt: 'Daug daržovių, skaidulų, mažiau perdirbtų produktų', ru: 'Много овощей и клетчатки, меньше переработанного' },
      { lt: '4 valgymai: pusryčiai, pietūs, užkandis, vakarienė', ru: '4 приёма: завтрак, обед, перекус, ужин' },
    ],
    preset: { goal: 'healthy', mealsPerDay: 4, activity: 'light' }, budgetPerPerson: 45,
  },
  {
    id: 'lose', emoji: '⚖️', name: { lt: 'Lieknėjimas', ru: 'Похудение' },
    tag: { lt: '−0,5 kg per savaitę, be bado', ru: '−0,5 кг в неделю, без голода' },
    how: [
      { lt: 'Saugus 15 % kalorijų deficitas', ru: 'Безопасный дефицит калорий 15 %' },
      { lt: '2 g baltymų / kg — sotu ir raumenys išlieka', ru: '2 г белка на кг — сытно, мышцы сохраняются' },
      { lt: 'Sotūs patiekalai: varškė, grikiai, vištiena, daržovės', ru: 'Сытные блюда: творог, гречка, курица, овощи' },
    ],
    preset: { goal: 'lose', mealsPerDay: 4, activity: 'light' }, budgetPerPerson: 45,
  },
  {
    id: 'mass', emoji: '💪', name: { lt: 'Masės auginimas', ru: 'Набор массы' },
    tag: { lt: '+10 % kalorijų ir 2 g baltymų / kg', ru: '+10 % калорий и 2 г белка на кг' },
    how: [
      { lt: '5 valgymai per dieną — lengviau suvalgyti normą', ru: '5 приёмов пищи — проще добрать норму' },
      { lt: 'Daug baltymų: vištiena, kiaušiniai, varškė, jautiena', ru: 'Много белка: курица, яйца, творог, говядина' },
      { lt: 'Pigūs angliavandeniai: grikiai, ryžiai, avižos, makaronai', ru: 'Дешёвые углеводы: гречка, рис, овсянка, макароны' },
    ],
    preset: { goal: 'gain', mealsPerDay: 5, activity: 'moderate' }, sex: 'm', budgetPerPerson: 55,
  },
  {
    id: 'cut', emoji: '🔥', name: { lt: 'Sausinimas', ru: 'Сушка' },
    tag: { lt: 'Deficitas + 2,2 g baltymų / kg', ru: 'Дефицит + 2,2 г белка на кг' },
    how: [
      { lt: 'Riebalai mažėja, raumenys lieka', ru: 'Уходит жир, мышцы остаются' },
      { lt: 'Daugiausia baltymų iš visų programų', ru: 'Больше всего белка среди программ' },
      { lt: 'Tinka sportuojantiems 3+ kartus per savaitę', ru: 'Для тех, кто тренируется 3+ раза в неделю' },
    ],
    preset: { goal: 'lose', mealsPerDay: 4, activity: 'moderate' }, proteinPerKg: 2.2, sex: 'm', budgetPerPerson: 55,
  },
  {
    id: 'veg', emoji: '🌱', name: { lt: 'Vegetariška', ru: 'Вегетарианское' },
    tag: { lt: 'Be mėsos ir žuvies, bet su baltymais', ru: 'Без мяса и рыбы, но с белком' },
    how: [
      { lt: 'Baltymai iš kiaušinių, varškės, lęšių, pupelių', ru: 'Белок из яиц, творога, чечевицы, фасоли' },
      { lt: 'Nė vieno patiekalo su mėsa ar žuvimi', ru: 'Ни одного блюда с мясом или рыбой' },
      { lt: 'Paprastai pigiau už įprastą krepšelį', ru: 'Обычно дешевле обычной корзины' },
    ],
    preset: { goal: 'healthy', dietType: 'vegetarian', mealsPerDay: 4, activity: 'light' }, budgetPerPerson: 40,
  },
  {
    id: 'lowcarb', emoji: '🥩', name: { lt: 'Mažai angliavandenių', ru: 'Мало углеводов' },
    tag: { lt: 'Mažiau duonos ir cukraus, daugiau baltymų', ru: 'Меньше хлеба и сахара, больше белка' },
    how: [
      { lt: 'Pirmenybė mėsai, žuviai, kiaušiniams, daržovėms', ru: 'В приоритете мясо, рыба, яйца, овощи' },
      { lt: 'Su nedideliu kalorijų deficitu', ru: 'С небольшим дефицитом калорий' },
      { lt: 'Ne keto — be kraštutinumų', ru: 'Не кето — без крайностей' },
    ],
    preset: { goal: 'lose', dietType: 'low_carb', mealsPerDay: 4, activity: 'light' }, budgetPerPerson: 55,
  },
  {
    id: 'budget', emoji: '💶', name: { lt: 'Taupi savaitė', ru: 'Экономная неделя' },
    tag: { lt: 'Sveikai už ~30 € žmogui', ru: 'Правильно за ~30 € на человека' },
    how: [
      { lt: 'Meniu dėliojamas pagal pigiausias prekes ir akcijas', ru: 'Меню собирается из самых дешёвых товаров и акций' },
      { lt: 'Vienos pakuotės naudojamos keliems patiekalams', ru: 'Одна упаковка идёт в несколько блюд' },
      { lt: 'Kalorijos ir baltymai — vis tiek pagal normą', ru: 'Калории и белок — всё равно по норме' },
    ],
    preset: { goal: 'keep', mealsPerDay: 4, activity: 'light' }, budgetPerPerson: 30,
  },
  {
    id: 'quick', emoji: '⏱', name: { lt: 'Greita (iki 15 min.)', ru: 'Быстро (до 15 мин)' },
    tag: { lt: 'Kiekvienas patiekalas — per 15 minučių', ru: 'Каждое блюдо — за 15 минут' },
    how: [
      { lt: 'Tik receptai, kuriems užtenka 15 minučių', ru: 'Только рецепты, на которые хватает 15 минут' },
      { lt: 'Mažai indų, paprasti žingsniai', ru: 'Мало посуды, простые шаги' },
      { lt: 'Kalorijos — pagal jūsų normą', ru: 'Калории — по вашей норме' },
    ],
    preset: { goal: 'keep', cookingTimeMax: 15, mealsPerDay: 4, activity: 'light' }, budgetPerPerson: 45,
  },
];
export const PROGRAM_BY_ID = Object.fromEntries(PROGRAMS.map((p) => [p.id, p])) as Record<string, Program>;

/** The person's answers with a program applied (their allergies, store and dislikes stay). */
export function withProgram(base: QuizAnswers, p: Program, who: { sex: 'f' | 'm'; weightKg: number; household: number; store: 'barbora' | 'rimi' }): QuizAnswers {
  const heightCm = base.heightCm || (who.sex === 'm' ? 180 : 168);
  return {
    ...base,
    goal: 'keep', dietType: base.dietType === 'low_carb' ? 'any' : base.dietType, cookingTimeMax: Math.max(30, base.cookingTimeMax) as 30 | 60,
    ...p.preset,
    sex: who.sex, weightKg: who.weightKg, heightCm,
    targetWeightKg: p.preset.goal === 'lose' ? who.weightKg - 5 : p.preset.goal === 'gain' ? who.weightKg + 4 : who.weightKg,
    household: who.household, homeStore: who.store, stores: [who.store],
    weeklyBudget: p.budgetPerPerson * who.household,
    overrides: p.proteinPerKg ? { protein: Math.round(who.weightKg * p.proteinPerKg) } : {},
  };
}
