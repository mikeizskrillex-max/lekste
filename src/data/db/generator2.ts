/**
 * Recipe database, part 2: ~400 more dishes in new families (wraps, warm
 * salads, oven bakes, one-pot grains, toasts, smoothies, cream soups,
 * overnight oats, stuffed potatoes, fritters, legume stews, scrambled eggs).
 * Same rules as generator.ts: only ingredients with real store prices,
 * grammatical forms written per ingredient (LT / RU), nutrition and price
 * computed from ingredients, deterministic ids.
 */
import type { Equipment, MealType } from '../../domain/types';
import type { RecipeDetail, Step } from '../recipeDetails';
import type { Recipe } from '../recipes';

type L = [ru: string, lt: string];
export interface Gen { recipe: Recipe; detail: RecipeDetail; photo: string }

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const pickBy = <T,>(key: string, arr: T[]): T => arr[hash(key) % arr.length];
const S = (minutes: number, ru: string, lt: string): Step => [minutes, ru, lt];
/** "a, b и c" without doubling the conjunction */
const and = (a: string, b: string, lang: 0 | 1) => (b.includes(lang ? ' ir ' : ' и ') ? `${a}, ${b}` : `${a} ${lang ? 'ir' : 'и'} ${b}`);
const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function make(o: {
  id: string; ru: string; lt: string; emoji: string; meal: MealType; cuisine?: Recipe['cuisine']; prep: number; cook: number;
  equipment: Equipment[]; items: [string, number][]; steps: Step[]; tip: L; photo: string; level?: 1 | 2 | 3; breakfastStyle?: 'sweet' | 'savory';
}): Gen {
  return {
    photo: o.photo,
    recipe: {
      id: o.id, ru: o.ru, lt: o.lt, emoji: o.emoji, meal: o.meal, cuisine: o.cuisine ?? 'home', minutes: o.prep + o.cook, equipment: o.equipment,
      spice: 0, ...(o.breakfastStyle ? { breakfastStyle: o.breakfastStyle } : {}), items: o.items, stepsLt: [], stepsRu: [],
    },
    detail: { level: o.level ?? 1, prep: o.prep, cook: o.cook, steps: o.steps, tip: o.tip },
  };
}

// ---------- shared protein vocabulary ----------
interface Prot { id: string; g: number; nom: L; w: L; cook: Step | null; cookMin: number }
const PR: Record<string, Prot> = {
  chicken_breast: { id: 'chicken_breast', g: 130, nom: ['Курица', 'Vištiena'], w: ['курицей', 'vištiena'], cookMin: 8,
    cook: S(8, 'Курицу нарежьте полосками, посолите и обжарьте на сковороде с ложкой масла 7–8 минут до готовности.', 'Vištieną supjaustykite juostelėmis, pasūdykite ir kepkite keptuvėje su šaukštu aliejaus 7–8 min., kol iškeps.') },
  turkey_fillet: { id: 'turkey_fillet', g: 130, nom: ['Индейка', 'Kalakutiena'], w: ['индейкой', 'kalakutiena'], cookMin: 8,
    cook: S(8, 'Индейку нарежьте полосками, посолите и обжарьте 7–8 минут.', 'Kalakutieną supjaustykite juostelėmis, pasūdykite ir kepkite 7–8 min.') },
  chicken_thigh: { id: 'chicken_thigh', g: 140, nom: ['Куриное бедро', 'Vištienos šlaunelės'], w: ['куриным бедром', 'vištienos šlaunelėmis'], cookMin: 10,
    cook: S(10, 'Бедро нарежьте кусочками, посолите и обжарьте 10 минут.', 'Šlauneles supjaustykite gabalėliais, pasūdykite ir kepkite 10 min.') },
  pork_loin: { id: 'pork_loin', g: 120, nom: ['Свинина', 'Kiauliena'], w: ['свининой', 'kiauliena'], cookMin: 10,
    cook: S(10, 'Свинину нарежьте небольшими кусочками, посолите и обжарьте 8–10 минут.', 'Kiaulieną supjaustykite nedideliais gabalėliais, pasūdykite ir kepkite 8–10 min.') },
  beef_mince: { id: 'beef_mince', g: 110, nom: ['Говяжий фарш', 'Jautienos faršas'], w: ['говяжьим фаршем', 'jautienos faršu'], cookMin: 8,
    cook: S(8, 'Фарш обжарьте на сковороде, разбивая лопаткой, 7–8 минут, посолите.', 'Faršą kepkite keptuvėje, smulkindami mentele, 7–8 min., pasūdykite.') },
  turkey_mince: { id: 'turkey_mince', g: 120, nom: ['Фарш индейки', 'Kalakutienos faršas'], w: ['фаршем индейки', 'kalakutienos faršu'], cookMin: 8,
    cook: S(8, 'Фарш обжарьте, разбивая лопаткой, 7–8 минут, посолите.', 'Faršą kepkite smulkindami mentele 7–8 min., pasūdykite.') },
  tuna_can: { id: 'tuna_can', g: 100, nom: ['Тунец', 'Tunas'], w: ['тунцом', 'tunu'], cookMin: 0,
    cook: S(0, 'Откройте банку тунца и слейте жидкость.', 'Atidarykite tuno skardinę ir nupilkite skystį.') },
  eggs: { id: 'eggs', g: 120, nom: ['Яйца', 'Kiaušiniai'], w: ['яйцом', 'kiaušiniu'], cookMin: 9,
    cook: S(9, 'Яйца сварите вкрутую 9 минут, остудите и нарежьте.', 'Kiaušinius kietai virkite 9 min., atvėsinkite ir supjaustykite.') },
  chickpeas: { id: 'chickpeas', g: 150, nom: ['Нут', 'Avinžirniai'], w: ['нутом', 'avinžirniais'], cookMin: 0,
    cook: S(0, 'Нут откиньте на дуршлаг и промойте.', 'Avinžirnius nusunkite ir nuplaukite.') },
  beans: { id: 'beans', g: 150, nom: ['Фасоль', 'Pupelės'], w: ['фасолью', 'pupelėmis'], cookMin: 0,
    cook: S(0, 'Фасоль откиньте на дуршлаг и промойте.', 'Pupeles nusunkite ir nuplaukite.') },
  tofu: { id: 'tofu', g: 160, nom: ['Тофу', 'Tofu'], w: ['тофу', 'tofu'], cookMin: 7,
    cook: S(7, 'Тофу нарежьте кубиками и обжарьте до золотистой корочки 6–7 минут.', 'Tofu supjaustykite kubeliais ir kepkite iki auksinės plutelės 6–7 min.') },
  feta: { id: 'feta', g: 60, nom: ['Фета', 'Feta'], w: ['фетой', 'feta'], cookMin: 0,
    cook: S(0, 'Фету раскрошите руками.', 'Fetą sutrupinkite rankomis.') },
  salmon: { id: 'salmon', g: 110, nom: ['Лосось', 'Lašiša'], w: ['лососем', 'lašiša'], cookMin: 8,
    cook: S(8, 'Лосось посолите и обжарьте по 4 минуты с каждой стороны, разделите на кусочки.', 'Lašišą pasūdykite ir kepkite po 4 min. iš kiekvienos pusės, padalinkite gabalėliais.') },
  cod: { id: 'cod', g: 160, nom: ['Треска', 'Menkė'], w: ['треской', 'menke'], cookMin: 8,
    cook: S(8, 'Треску посолите и обжарьте по 4 минуты с каждой стороны.', 'Menkę pasūdykite ir kepkite po 4 min. iš kiekvienos pusės.') },
};

// ---------- 1. Wraps (lunch) ----------
const WRAP_VEG: { key: string; items: [string, number][]; w: L }[] = [
  { key: 'tomcuc', items: [['tomato', 80], ['cucumber', 80]], w: ['помидорами и огурцами', 'pomidorais ir agurkais'] },
  { key: 'pepcab', items: [['bell_pepper', 70], ['cabbage', 70]], w: ['перцем и капустой', 'paprika ir kopūstais'] },
  { key: 'spitom', items: [['spinach', 40], ['tomato', 80]], w: ['шпинатом и помидорами', 'špinatais ir pomidorais'] },
  { key: 'slaw', items: [['carrot', 60], ['cabbage', 80]], w: ['морковью и капустой', 'morkomis ir kopūstais'] },
  { key: 'avotom', items: [['avocado', 60], ['tomato', 70]], w: ['авокадо и помидорами', 'avokadu ir pomidorais'] },
  { key: 'cornpep', items: [['corn', 60], ['bell_pepper', 70]], w: ['кукурузой и перцем', 'kukurūzais ir paprika'] },
];
const SAUCE: { key: string; items: [string, number][]; step: Step }[] = [
  { key: 'yog', items: [['natural_yogurt', 50], ['garlic', 3]], step: S(0, 'Соус: йогурт смешайте с тёртым чесноком и щепоткой соли.', 'Padažas: jogurtą sumaišykite su tarkuotu česnaku ir žiupsneliu druskos.') },
  { key: 'sc', items: [['sour_cream', 40]], step: S(0, 'Соус: сметану посолите и поперчите.', 'Padažas: grietinę pasūdykite ir papipirinkite.') },
  { key: 'oil', items: [['olive_oil', 8], ['lemon', 10]], step: S(0, 'Заправка: масло смешайте с лимонным соком, солью и перцем.', 'Padažas: aliejų sumaišykite su citrinos sultimis, druska ir pipirais.') },
];
function wraps(): Gen[] {
  const out: Gen[] = [];
  for (const pid of ['chicken_breast', 'turkey_fillet', 'tuna_can', 'eggs', 'chickpeas', 'tofu', 'feta']) {
    const p = PR[pid];
    for (const v of WRAP_VEG) {
      const id = `g_wrap_${pid}_${v.key}`;
      const sauce = pickBy(id, SAUCE);
      out.push(make({
        id, emoji: '🌯', meal: 'lunch', prep: 8, cook: p.cookMin, equipment: p.cookMin ? ['stove'] : [], photo: pickBy(id, ['chicken_wrap', 'shawarma']),
        ru: `Лаваш с ${p.w[0]}, ${v.w[0]}`, lt: `Lavašas su ${p.w[1]}, ${v.w[1]}`,
        items: [['lavash', 80], [p.id, p.g], ...v.items, ...sauce.items],
        steps: [p.cook!, S(0, 'Овощи вымойте и нарежьте тонкой соломкой.', 'Daržoves nuplaukite ir supjaustykite plonais šiaudeliais.'), sauce.step,
          S(0, 'Смажьте лаваш соусом, выложите начинку, плотно сверните.', 'Lavašą patepkite padažu, sudėkite įdarą ir sandariai susukite.'),
          S(2, 'По желанию подрумяньте ролл на сухой сковороде по 1 минуте с каждой стороны.', 'Jei norite, apskrudinkite suktinuką sausoje keptuvėje po 1 min. iš abiejų pusių.')],
        tip: ['Заверните ролл в фольгу — удобно взять на работу.', 'Suvyniokite į foliją — patogu pasiimti į darbą.'],
      }));
    }
  }
  return out;
}

// ---------- 2. Warm salads (lunch / dinner) ----------
const SALAD_BASE: { key: string; items: [string, number][]; w: L; step: Step; t: number }[] = [
  { key: 'potato', items: [['potatoes', 200]], w: ['картофелем', 'bulvėmis'], t: 20, step: S(20, 'Картофель отварите в мундире 20 минут, очистите и нарежьте.', 'Bulves išvirkite su lupenomis 20 min., nulupkite ir supjaustykite.') },
  { key: 'buckwheat', items: [['buckwheat', 60]], w: ['гречкой', 'grikiais'], t: 15, step: S(15, 'Гречку отварите 15 минут и остудите.', 'Grikius virkite 15 min. ir atvėsinkite.') },
  { key: 'quinoa', items: [['quinoa', 55]], w: ['киноа', 'kinva'], t: 15, step: S(15, 'Киноа промойте и отварите 15 минут.', 'Kinvą nuplaukite ir virkite 15 min.') },
  { key: 'bulgur', items: [['bulgur', 60]], w: ['булгуром', 'bulguru'], t: 15, step: S(15, 'Булгур залейте кипятком 1:2 и оставьте на 15 минут.', 'Bulgurą užpilkite verdančiu vandeniu 1:2 ir palikite 15 min.') },
  { key: 'cabbage', items: [['cabbage', 150], ['carrot', 60]], w: ['капустой и морковью', 'kopūstais ir morkomis'], t: 0, step: S(0, 'Капусту тонко нашинкуйте, морковь натрите, помните с солью.', 'Kopūstus plonai supjaustykite, morkas sutarkuokite, pamaigykite su druska.') },
  { key: 'fresh', items: [['tomato', 100], ['cucumber', 100], ['spinach', 30]], w: ['свежими овощами', 'šviežiomis daržovėmis'], t: 0, step: S(0, 'Помидоры, огурец и шпинат вымойте и нарежьте.', 'Pomidorus, agurką ir špinatus nuplaukite ir supjaustykite.') },
];
const DRESS: { items: [string, number][]; step: Step }[] = [
  { items: [['olive_oil', 10], ['lemon', 10]], step: S(0, 'Заправьте маслом с лимонным соком, посолите и поперчите.', 'Pagardinkite aliejumi su citrinos sultimis, pasūdykite ir papipirinkite.') },
  { items: [['natural_yogurt', 50]], step: S(0, 'Заправьте йогуртом с солью и перцем.', 'Pagardinkite jogurtu su druska ir pipirais.') },
  { items: [['sour_cream', 30], ['onion', 20]], step: S(0, 'Добавьте мелко нарезанный лук, заправьте сметаной.', 'Įdėkite smulkiai supjaustytą svogūną, pagardinkite grietine.') },
];
function salads(): Gen[] {
  const out: Gen[] = [];
  for (const pid of ['tuna_can', 'eggs', 'chicken_breast', 'feta', 'beans', 'chickpeas', 'salmon', 'turkey_fillet', 'tofu']) {
    const p = PR[pid];
    for (const b of SALAD_BASE) {
      const id = `g_salad_${pid}_${b.key}`;
      const d = pickBy(id, DRESS);
      const extra: [string, number][] = b.key === 'fresh' || b.key === 'cabbage' ? [] : [['cucumber', 80], ['tomato', 70]];
      out.push(make({
        id, emoji: '🥗', meal: hash(id) % 2 ? 'lunch' : 'dinner', cuisine: 'mediterranean', prep: 10, cook: Math.max(b.t, p.cookMin), equipment: b.t || p.cookMin ? ['stove'] : [],
        photo: pickBy(id, ['greek_salad_chicken', 'tuna_salad', 'quinoa_bowl', 'vegan_bowl']),
        ru: `Салат с ${and(p.w[0], b.w[0], 0)}`, lt: `Salotos su ${and(p.w[1], b.w[1], 1)}`,
        items: [[p.id, p.g], ...b.items, ...extra, ...d.items],
        steps: [b.step, p.cook!, ...(extra.length ? [S(0, 'Огурец и помидор нарежьте кубиками.', 'Agurką ir pomidorą supjaustykite kubeliais.')] : []), d.step, S(0, 'Всё перемешайте и подавайте.', 'Viską sumaišykite ir patiekite.')],
        tip: ['Салат хорошо хранится в контейнере до следующего дня — заправку добавьте перед едой.', 'Salotos gerai laikosi inde iki kitos dienos — padažą įpilkite prieš valgant.'],
      }));
    }
  }
  return out;
}

// ---------- 3. Oven bakes (dinner) ----------
const BAKE_VEG: { key: string; items: [string, number][]; w: L }[] = [
  { key: 'zucchini', items: [['zucchini', 200]], w: ['кабачком', 'cukinija'] },
  { key: 'cauliflower', items: [['cauliflower', 200]], w: ['цветной капустой', 'žiediniais kopūstais'] },
  { key: 'broccoli', items: [['broccoli', 180]], w: ['брокколи', 'brokoliais'] },
  { key: 'potato', items: [['potatoes', 220], ['onion', 40]], w: ['картофелем', 'bulvėmis'] },
  { key: 'pumpkin', items: [['pumpkin', 220]], w: ['тыквой', 'moliūgu'] },
  { key: 'cabbage', items: [['cabbage', 200], ['carrot', 50]], w: ['капустой', 'kopūstais'] },
  { key: 'sweet_potato', items: [['sweet_potato', 200]], w: ['бататом', 'batatais'] },
];
function bakes(): Gen[] {
  const out: Gen[] = [];
  for (const pid of ['chicken_breast', 'chicken_thigh', 'turkey_mince', 'beef_mince', 'cod', 'salmon', 'tofu']) {
    const p = PR[pid];
    const mince = pid.endsWith('mince');
    for (const v of BAKE_VEG) {
      const id = `g_bake_${pid}_${v.key}`;
      const cheese = hash(id) % 2 === 0;
      const t = v.key === 'potato' || v.key === 'sweet_potato' ? 35 : 25;
      out.push(make({
        id, emoji: '🍲', meal: 'dinner', prep: 10, cook: t, equipment: ['oven'], level: 2, photo: pickBy(id, ['egg_bake', 'baked_chicken_veg', 'ratatouille', 'lasagna']),
        ru: `Запеканка с ${and(p.w[0], v.w[0], 0)}${cheese ? ' под сыром' : ''}`, lt: `Apkepas su ${and(p.w[1], v.w[1], 1)}${cheese ? ' ir sūriu' : ''}`,
        items: [[p.id, p.g], ...v.items, ['canned_tomatoes', 100], ['olive_oil', 5], ...(cheese ? [['cheese', 30] as [string, number]] : [['sour_cream', 30] as [string, number]])],
        steps: [
          S(0, 'Разогрейте духовку до 200 °C.', 'Įkaitinkite orkaitę iki 200 °C.'),
          S(0, `Овощи нарежьте небольшими кусочками и выложите в форму, смазанную маслом.`, 'Daržoves supjaustykite nedideliais gabalėliais ir sudėkite į aliejumi pateptą formą.'),
          mince ? S(0, 'Фарш посолите, сформируйте небольшие тефтели и выложите между овощами.', 'Faršą pasūdykite, suformuokite nedidelius kukulius ir sudėkite tarp daržovių.')
            : S(0, `${p.nom[0]}: нарежьте кусочками, посолите и выложите на овощи.`, `${p.nom[1]}: supjaustykite gabalėliais, pasūdykite ir sudėkite ant daržovių.`),
          S(0, 'Полейте томатами из банки, посолите и поперчите.', 'Užpilkite konservuotais pomidorais, pasūdykite ir papipirinkite.'),
          cheese ? S(t, `Посыпьте тёртым сыром и запекайте ${t} минут.`, `Pabarstykite tarkuotu sūriu ir kepkite ${t} min.`) : S(t, `Запекайте ${t} минут, подавайте со сметаной.`, `Kepkite ${t} min., patiekite su grietine.`),
        ],
        tip: ['Готовьте сразу двойную порцию — завтра будет готовый обед.', 'Iškepkite dvigubą porciją — rytoj turėsite paruoštus pietus.'],
      }));
    }
  }
  return out;
}

// ---------- 4. One-pot grains (lunch / dinner) ----------
const POT_GRAIN: { id: string; g: number; w: L; t: number; water: string }[] = [
  { id: 'rice', g: 65, w: ['рисом', 'ryžiais'], t: 18, water: '1:2' },
  { id: 'buckwheat', g: 65, w: ['гречкой', 'grikiais'], t: 18, water: '1:2' },
  { id: 'bulgur', g: 65, w: ['булгуром', 'bulguru'], t: 15, water: '1:2' },
  { id: 'barley', g: 55, w: ['перловкой', 'perlinėmis kruopomis'], t: 40, water: '1:3' },
  { id: 'quinoa', g: 60, w: ['киноа', 'kinva'], t: 15, water: '1:2' },
];
const POT_VEG: { key: string; items: [string, number][]; w: L }[] = [
  { key: 'pepper', items: [['bell_pepper', 100]], w: ['перцем', 'paprika'] },
  { key: 'peas', items: [['green_peas', 80]], w: ['горошком', 'žirneliais'] },
];
function onePot(): Gen[] {
  const out: Gen[] = [];
  for (const pid of ['chicken_breast', 'chicken_thigh', 'turkey_fillet', 'pork_loin', 'beef_mince', 'chickpeas', 'beans', 'tofu', 'turkey_mince']) {
    const p = PR[pid];
    for (const gr of POT_GRAIN) for (const v of POT_VEG) {
      const id = `g_pot_${pid}_${gr.id}_${v.key}`;
      out.push(make({
        id, emoji: '🥘', meal: hash(id) % 2 ? 'lunch' : 'dinner', cuisine: pid === 'pork_loin' || pid === 'chicken_thigh' ? 'georgian' : 'home', prep: 10, cook: gr.t + 8, equipment: ['stove'],
        photo: pickBy(id, ['plov', 'tofu_buckwheat', 'chicken_buckwheat', 'chicken_cabbage']),
        ru: `${p.nom[0]} с ${and(gr.w[0], v.w[0], 0)} в одной кастрюле`, lt: `${p.nom[1]} su ${and(gr.w[1], v.w[1], 1)} viename puode`,
        items: [[p.id, p.g], [gr.id, gr.g], ['onion', 50], ['carrot', 60], ...v.items, ['olive_oil', 7]],
        steps: [
          S(0, 'Лук нарежьте, морковь натрите или нарежьте соломкой.', 'Svogūną supjaustykite, morką sutarkuokite arba supjaustykite šiaudeliais.'),
          p.cookMin ? S(8, `${p.nom[0]}: обжарьте в кастрюле с толстым дном с маслом 6–8 минут, добавьте лук и морковь.`, `${p.nom[1]}: apkepkite storadugniame puode su aliejumi 6–8 min., sudėkite svogūną ir morką.`)
            : S(5, `Лук и морковь обжарьте в кастрюле 5 минут, добавьте ${lc(p.nom[0])}.`, `Svogūną ir morką pakepinkite puode 5 min., sudėkite ${p.nom[1].toLowerCase()}.`),
          S(0, `Всыпьте промытую крупу, залейте горячей водой ${gr.water}, посолите.`, `Suberkite nuplautas kruopas, užpilkite karštu vandeniu ${gr.water}, pasūdykite.`),
          S(gr.t, `Накройте крышкой и тушите на слабом огне ${gr.t} минут. За 5 минут до конца добавьте овощи.`, `Uždenkite ir troškinkite ant silpnos ugnies ${gr.t} min. Likus 5 min. sudėkite daržoves.`),
          S(0, 'Перемешайте и дайте постоять 5 минут под крышкой.', 'Išmaišykite ir palikite 5 min. po dangčiu.'),
        ],
        tip: ['Все ингредиенты в одной кастрюле — меньше посуды.', 'Viskas viename puode — mažiau indų plauti.'],
      }));
    }
  }
  return out;
}

// ---------- 5. Toasts (breakfast) ----------
const TOAST_TOP: { key: string; items: [string, number][]; w: L; cook: Step; t: number }[] = [
  { key: 'egg', items: [['eggs', 60]], w: ['яйцом', 'kiaušiniu'], t: 4, cook: S(4, 'Пожарьте яйцо-глазунью 3–4 минуты.', 'Iškepkite kiaušinienę 3–4 min.') },
  { key: 'curd', items: [['cottage_cheese', 80]], w: ['творогом', 'varške'], t: 0, cook: S(0, 'Творог посолите и разомните вилкой.', 'Varškę pasūdykite ir sutrinkite šakute.') },
  { key: 'avocado', items: [['avocado', 60]], w: ['авокадо', 'avokadu'], t: 0, cook: S(0, 'Авокадо разомните вилкой с солью и лимонным соком.', 'Avokadą sutrinkite šakute su druska ir citrinos sultimis.') },
  { key: 'tuna', items: [['tuna_can', 60]], w: ['тунцом', 'tunu'], t: 0, cook: S(0, 'Тунец разомните вилкой.', 'Tuną sutrinkite šakute.') },
  { key: 'feta', items: [['feta', 35]], w: ['фетой', 'feta'], t: 0, cook: S(0, 'Фету раскрошите.', 'Fetą sutrupinkite.') },
  { key: 'cheese', items: [['cheese', 30]], w: ['сыром', 'sūriu'], t: 2, cook: S(2, 'Положите сыр на хлеб и подрумяньте на сковороде под крышкой 2 минуты.', 'Sūrį dėkite ant duonos ir pakaitinkite uždengtoje keptuvėje 2 min.') },
];
const TOAST_VEG: { key: string; items: [string, number][]; w: L }[] = [
  { key: 'tomato', items: [['tomato', 80]], w: ['помидором', 'pomidoru'] },
  { key: 'cucumber', items: [['cucumber', 80]], w: ['огурцом', 'agurku'] },
  { key: 'spinach', items: [['spinach', 25]], w: ['шпинатом', 'špinatais'] },
  { key: 'pepper', items: [['bell_pepper', 60]], w: ['перцем', 'paprika'] },
];
function toasts(): Gen[] {
  const out: Gen[] = [];
  for (const top of TOAST_TOP) for (const v of TOAST_VEG) {
    const id = `g_toast_${top.key}_${v.key}`;
    out.push(make({
      id, emoji: '🥪', meal: 'breakfast', breakfastStyle: 'savory', prep: 5, cook: top.t, equipment: top.t ? ['stove'] : [],
      photo: pickBy(id, ['curd_toast', 'eggs_avocado', 'eggs_benedict']),
      ru: `Тост с ${and(top.w[0], v.w[0], 0)}`, lt: `Skrebutis su ${and(top.w[1], v.w[1], 1)}`,
      items: [['rye_bread', 80], ...top.items, ...v.items],
      steps: [S(2, 'Подсушите 2 ломтика ржаного хлеба на сухой сковороде или в тостере.', 'Apskrudinkite 2 riekes ruginės duonos sausoje keptuvėje arba skrudintuve.'), top.cook,
        S(0, 'Овощи нарежьте, выложите всё на хлеб, посолите и поперчите.', 'Daržoves supjaustykite, viską sudėkite ant duonos, pasūdykite ir papipirinkite.')],
      tip: ['Ржаной хлеб даёт больше клетчатки и дольше насыщает.', 'Ruginė duona turi daugiau skaidulų ir ilgiau sotina.'],
    }));
  }
  const sweet: { key: string; items: [string, number][]; ru: string; lt: string }[] = [
    { key: 'pb_banana', items: [['peanut_butter', 20], ['banana', 100]], ru: 'Тост с арахисовой пастой и бананом', lt: 'Skrebutis su žemės riešutų kremu ir bananu' },
    { key: 'curd_berries', items: [['cottage_cheese', 80], ['berries', 70], ['honey', 8]], ru: 'Тост с творогом, ягодами и мёдом', lt: 'Skrebutis su varške, uogomis ir medumi' },
    { key: 'curd_pear', items: [['cottage_cheese', 80], ['pear', 100], ['walnuts', 10]], ru: 'Тост с творогом, грушей и орехами', lt: 'Skrebutis su varške, kriauše ir riešutais' },
    { key: 'pb_apple', items: [['peanut_butter', 20], ['apple', 120]], ru: 'Тост с арахисовой пастой и яблоком', lt: 'Skrebutis su žemės riešutų kremu ir obuoliu' },
  ];
  for (const s of sweet) {
    out.push(make({
      id: `g_toast_${s.key}`, emoji: '🍞', meal: 'breakfast', breakfastStyle: 'sweet', prep: 5, cook: 2, equipment: [], photo: 'curd_toast', ru: s.ru, lt: s.lt,
      items: [['rye_bread', 80], ...s.items],
      steps: [S(2, 'Подсушите хлеб.', 'Apskrudinkite duoną.'), S(0, 'Намажьте основу, сверху выложите нарезанные фрукты.', 'Užtepkite pagrindą, ant viršaus sudėkite supjaustytus vaisius.')],
      tip: ['Сладкий завтрак без сахара — сладость даёт фрукт.', 'Saldūs pusryčiai be cukraus — saldumo suteikia vaisius.'],
    }));
  }
  return out;
}

// ---------- 6. Smoothies (snack) ----------
const SMOOTH_BASE: { id: string; g: number; nom: L }[] = [
  { id: 'kefir', g: 250, nom: ['кефир', 'kefyras'] }, { id: 'milk', g: 250, nom: ['молоко', 'pienas'] },
  { id: 'natural_yogurt', g: 200, nom: ['йогурт', 'jogurtas'] }, { id: 'greek_yogurt', g: 150, nom: ['греческий йогурт', 'graikiškas jogurtas'] },
];
const SMOOTH_FRUIT: { key: string; items: [string, number][]; ru: string; lt: string }[] = [
  { key: 'banana_berries', items: [['banana', 100], ['berries', 80]], ru: 'банан и ягоды', lt: 'bananas ir uogos' },
  { key: 'apple_spinach', items: [['apple', 120], ['spinach', 30]], ru: 'яблоко и шпинат', lt: 'obuolys ir špinatai' },
  { key: 'pear_oats', items: [['pear', 120], ['oats', 25]], ru: 'груша и овсянка', lt: 'kriaušė ir avižos' },
  { key: 'orange_banana', items: [['orange', 120], ['banana', 80]], ru: 'апельсин и банан', lt: 'apelsinas ir bananas' },
  { key: 'berries_oats', items: [['berries', 100], ['oats', 25]], ru: 'ягоды и овсянка', lt: 'uogos ir avižos' },
  { key: 'banana_pb', items: [['banana', 100], ['peanut_butter', 15]], ru: 'банан и арахисовая паста', lt: 'bananas ir žemės riešutų kremas' },
];
function smoothies(): Gen[] {
  const out: Gen[] = [];
  for (const b of SMOOTH_BASE) for (const f of SMOOTH_FRUIT) {
    const id = `g_smoothie_${b.id}_${f.key}`;
    out.push(make({
      id, emoji: '🥤', meal: 'snack', prep: 5, cook: 0, equipment: ['blender'], photo: pickBy(id, ['kefir_banana', 'yogurt_nuts']),
      ru: `Смузи: ${b.nom[0]}, ${f.ru}`, lt: `Kokteilis: ${b.nom[1]}, ${f.lt}`,
      items: [[b.id, b.g], ...f.items],
      steps: [S(0, 'Фрукты вымойте, очистите и нарежьте.', 'Vaisius nuplaukite, nulupkite ir supjaustykite.'), S(1, `Всё взбейте в блендере с ${b.nom[0] === 'молоко' ? 'молоком' : b.nom[0] === 'кефир' ? 'кефиром' : 'йогуртом'} до однородности, 1 минуту.`, 'Viską išplakite trintuvu iki vientisos masės, 1 min.')],
      tip: ['Замороженные фрукты делают смузи густым и холодным без льда.', 'Šaldyti vaisiai kokteilį padaro tirštą ir šaltą be ledo.'],
    }));
  }
  return out;
}

// ---------- 7. Cream soups (lunch) ----------
const CREAM_VEG: { key: string; items: [string, number][]; nom: L }[] = [
  { key: 'pumpkin', items: [['pumpkin', 300]], nom: ['тыквенный', 'Moliūgų'] },
  { key: 'broccoli', items: [['broccoli', 250]], nom: ['брокколи', 'Brokolių'] },
  { key: 'cauliflower', items: [['cauliflower', 250]], nom: ['из цветной капусты', 'Žiedinių kopūstų'] },
  { key: 'zucchini', items: [['zucchini', 280]], nom: ['кабачковый', 'Cukinijų'] },
  { key: 'carrot', items: [['carrot', 250]], nom: ['морковный', 'Morkų'] },
  { key: 'mushroom', items: [['mushrooms', 200]], nom: ['грибной', 'Pievagrybių'] },
  { key: 'peas', items: [['green_peas', 200]], nom: ['гороховый', 'Žirnelių'] },
];
const CREAM_TOP: { key: string; items: [string, number][]; w: L; step: Step }[] = [
  { key: 'sc', items: [['sour_cream', 30]], w: ['со сметаной', 'su grietine'], step: S(0, 'Подавайте с ложкой сметаны.', 'Patiekite su šaukštu grietinės.') },
  { key: 'seeds', items: [['sunflower_seeds', 15]], w: ['с семечками', 'su saulėgrąžomis'], step: S(2, 'Семечки подсушите на сухой сковороде и посыпьте суп.', 'Saulėgrąžas paskrudinkite sausoje keptuvėje ir pabarstykite sriubą.') },
  { key: 'feta', items: [['feta', 30]], w: ['с фетой', 'su feta'], step: S(0, 'Посыпьте раскрошенной фетой.', 'Pabarstykite sutrupinta feta.') },
  { key: 'chicken', items: [['chicken_breast', 90]], w: ['с курицей', 'su vištiena'], step: S(8, 'Курицу нарежьте кубиками, обжарьте 7–8 минут и добавьте в тарелку.', 'Vištieną supjaustykite kubeliais, apkepkite 7–8 min. ir įdėkite į lėkštę.') },
];
function creamSoups(): Gen[] {
  const out: Gen[] = [];
  for (const v of CREAM_VEG) for (const top of CREAM_TOP) {
    const id = `g_cream_${v.key}_${top.key}`;
    out.push(make({
      id, emoji: '🥣', meal: 'lunch', prep: 10, cook: 22, equipment: ['blender'], photo: pickBy(id, ['pumpkin_soup', 'tomato_soup', 'lentil_soup']),
      ru: `Крем-суп ${v.nom[0]} ${top.w[0]}`, lt: `${v.nom[1]} trinta sriuba ${top.w[1]}`,
      items: [...v.items, ['potatoes', 100], ['onion', 50], ['olive_oil', 5], ...top.items],
      steps: [
        S(5, 'Лук нарежьте и обжарьте в кастрюле на масле 5 минут.', 'Svogūną supjaustykite ir pakepinkite puode su aliejumi 5 min.'),
        S(0, 'Добавьте нарезанные овощи и картофель, залейте водой так, чтобы она едва покрывала овощи.', 'Sudėkite supjaustytas daržoves ir bulves, užpilkite vandeniu, kad vos apsemtų.'),
        S(18, 'Посолите и варите 18 минут до мягкости.', 'Pasūdykite ir virkite 18 min., kol suminkštės.'),
        S(1, 'Пюрируйте блендером до гладкости.', 'Sutrinkite trintuvu iki vientisos masės.'),
        top.step,
      ],
      tip: ['Если суп густой — разбавьте горячей водой, если жидкий — проварите без крышки.', 'Jei sriuba per tiršta — praskieskite karštu vandeniu, jei per skysta — pavirkite be dangčio.'],
    }));
  }
  return out;
}

// ---------- 8. Overnight oats (breakfast) ----------
const OAT_LIQ: { id: string; g: number; w: L }[] = [
  { id: 'milk', g: 180, w: ['на молоке', 'su pienu'] }, { id: 'kefir', g: 180, w: ['на кефире', 'su kefyru'] }, { id: 'natural_yogurt', g: 170, w: ['на йогурте', 'su jogurtu'] },
];
const OAT_FRUIT: { id: string; g: number; w: L }[] = [
  { id: 'berries', g: 80, w: ['ягодами', 'uogomis'] }, { id: 'banana', g: 90, w: ['бананом', 'bananu'] }, { id: 'apple', g: 110, w: ['яблоком', 'obuoliu'] },
  { id: 'pear', g: 110, w: ['грушей', 'kriaušė'] }, { id: 'orange', g: 110, w: ['апельсином', 'apelsinu'] },
];
const OAT_TOP: { id: string; g: number; w: L }[] = [{ id: 'walnuts', g: 12, w: ['орехами', 'riešutais'] }, { id: 'sunflower_seeds', g: 12, w: ['семечками', 'saulėgrąžomis'] }];
function overnightOats(): Gen[] {
  const out: Gen[] = [];
  for (const l of OAT_LIQ) for (const f of OAT_FRUIT) for (const tp of OAT_TOP) {
    const id = `g_overnight_${l.id}_${f.id}_${tp.id}`;
    const fruitW: L = [f.w[0], f.id === 'pear' ? 'kriaušėmis' : f.w[1]];
    out.push(make({
      id, emoji: '🫙', meal: 'breakfast', breakfastStyle: 'sweet', prep: 5, cook: 0, equipment: [], photo: pickBy(id, ['oat_berries', 'yogurt_nuts']),
      ru: `Ленивая овсянка ${l.w[0]} с ${and(fruitW[0], tp.w[0], 0)}`, lt: `Naktinė avižinė košė ${l.w[1]}, ${fruitW[1]} ir ${tp.w[1]}`,
      items: [['oats', 50], [l.id, l.g], [f.id, f.g], [tp.id, tp.g]],
      steps: [S(0, 'Вечером смешайте овсяные хлопья с жидкой основой в банке или контейнере.', 'Vakare avižinius dribsnius sumaišykite su skysčiu stiklainyje ar inde.'),
        S(0, 'Закройте и уберите в холодильник на ночь (минимум 6 часов).', 'Uždarykite ir palikite šaldytuve per naktį (bent 6 val.).'),
        S(0, 'Утром добавьте нарезанные фрукты и посыпьте сверху.', 'Ryte sudėkite supjaustytus vaisius ir pabarstykite ant viršaus.')],
      tip: ['Сделайте сразу 3 банки — завтрак на три дня готов.', 'Paruoškite iš karto 3 stiklainius — pusryčiai trims dienoms.'],
    }));
  }
  return out;
}

// ---------- 9. Stuffed baked potatoes (dinner) ----------
const STUFF: { key: string; items: [string, number][]; w: L }[] = [
  { key: 'tuna', items: [['tuna_can', 80], ['sour_cream', 20]], w: ['тунцом', 'tunu'] },
  { key: 'curd', items: [['cottage_cheese', 100], ['garlic', 3]], w: ['творогом и чесноком', 'varške ir česnaku'] },
  { key: 'beans', items: [['beans', 120], ['corn', 40], ['canned_tomatoes', 60]], w: ['фасолью и кукурузой', 'pupelėmis ir kukurūzais'] },
  { key: 'chicken', items: [['chicken_breast', 110], ['cheese', 20]], w: ['курицей и сыром', 'vištiena ir sūriu'] },
  { key: 'feta', items: [['feta', 40], ['spinach', 40]], w: ['фетой и шпинатом', 'feta ir špinatais'] },
  { key: 'mushroom', items: [['mushrooms', 120], ['cheese', 20], ['onion', 30]], w: ['грибами и сыром', 'grybais ir sūriu'] },
  { key: 'egg', items: [['eggs', 60], ['cheese', 20]], w: ['яйцом и сыром', 'kiaušiniu ir sūriu'] },
  { key: 'chickpeas', items: [['chickpeas', 120], ['natural_yogurt', 40]], w: ['нутом и йогуртом', 'avinžirniais ir jogurtu'] },
];
function stuffedPotatoes(): Gen[] {
  const out: Gen[] = [];
  for (const base of [{ id: 'potatoes', ru: 'Запечённый картофель', lt: 'Įdaryta keptoji bulvė' }, { id: 'sweet_potato', ru: 'Запечённый батат', lt: 'Įdarytas keptas batatas' }]) {
    for (const st of STUFF) {
      const id = `g_stuffed_${base.id}_${st.key}`;
      out.push(make({
        id, emoji: '🥔', meal: 'dinner', prep: 10, cook: 45, equipment: ['oven'], level: 2, photo: pickBy(id, ['roast_chicken_sp', 'beef_potatoes']),
        ru: `${base.ru} с ${st.w[0]}`, lt: `${base.lt} su ${st.w[1]}`,
        items: [[base.id, 250], ...st.items, ['cucumber', 80]],
        steps: [S(0, 'Разогрейте духовку до 200 °C, клубни вымойте и наколите вилкой.', 'Įkaitinkite orkaitę iki 200 °C, gumbus nuplaukite ir subadykite šakute.'),
          S(40, 'Запекайте 40 минут до мягкости.', 'Kepkite 40 min., kol suminkštės.'),
          S(0, 'Приготовьте начинку: смешайте ингредиенты, посолите (курицу или грибы предварительно обжарьте).', 'Paruoškite įdarą: sumaišykite ingredientus, pasūdykite (vištieną ar grybus prieš tai apkepkite).'),
          S(5, 'Разрежьте клубень, выложите начинку и запекайте ещё 5 минут. Подавайте с огурцом.', 'Įpjaukite gumbą, sudėkite įdarą ir kepkite dar 5 min. Patiekite su agurku.')],
        tip: ['Картофель можно запечь заранее и разогреть с начинкой за 10 минут.', 'Bulves galima iškepti iš anksto ir su įdaru pašildyti per 10 min.'],
      }));
    }
  }
  return out;
}

// ---------- 10. Vegetable fritters (breakfast / lunch) ----------
function fritters(): Gen[] {
  const out: Gen[] = [];
  const veg: { id: string; g: number; ru: string; lt: string }[] = [
    { id: 'zucchini', g: 200, ru: 'Кабачковые оладьи', lt: 'Cukinijų blynai' }, { id: 'carrot', g: 180, ru: 'Морковные оладьи', lt: 'Morkų blynai' },
    { id: 'pumpkin', g: 180, ru: 'Тыквенные оладьи', lt: 'Moliūgų blynai' }, { id: 'potatoes', g: 220, ru: 'Драники', lt: 'Bulviniai blynai' },
  ];
  for (const v of veg) for (const sauce of [{ id: 'sour_cream', g: 40, ru: 'со сметаной', lt: 'su grietine' }, { id: 'natural_yogurt', g: 60, ru: 'с йогуртом', lt: 'su jogurtu' }]) {
    const id = `g_fritters_${v.id}_${sauce.id}`;
    out.push(make({
      id, emoji: '🥞', meal: hash(id) % 2 ? 'breakfast' : 'lunch', breakfastStyle: 'savory', prep: 10, cook: 12, equipment: [], level: 2, photo: pickBy(id, ['banana_pancakes', 'syrniki']),
      ru: `${v.ru} ${sauce.ru}`, lt: `${v.lt} ${sauce.lt}`,
      items: [[v.id, v.g], ['eggs', 60], ['oats', 30], ['onion', 30], ['olive_oil', 8], [sauce.id, sauce.g]],
      steps: [S(0, 'Овощ и лук натрите на тёрке, отожмите лишний сок.', 'Daržovę ir svogūną sutarkuokite, nuspauskite sultis.'),
        S(0, 'Добавьте яйцо, овсяные хлопья (вместо муки), соль и перец, перемешайте.', 'Įmuškite kiaušinį, suberkite avižinius dribsnius (vietoj miltų), druską ir pipirus, išmaišykite.'),
        S(12, 'Жарьте небольшие оладьи на масле по 3 минуты с каждой стороны, партиями.', 'Kepkite nedidelius blynelius su aliejumi po 3 min. iš kiekvienos pusės, porcijomis.'),
        S(0, `Подавайте ${sauce.ru}.`, `Patiekite ${sauce.lt}.`)],
      tip: ['Хлопья вместо муки — больше клетчатки и без глютена из пшеницы.', 'Dribsniai vietoj miltų — daugiau skaidulų ir be kvietinių miltų.'],
    }));
  }
  return out;
}

// ---------- 11. Legume stews (lunch) ----------
function legumeStews(): Gen[] {
  const out: Gen[] = [];
  const leg = [{ id: 'beans', g: 180, ru: 'Рагу из фасоли', lt: 'Pupelių troškinys' }, { id: 'chickpeas', g: 180, ru: 'Рагу из нута', lt: 'Avinžirnių troškinys' }, { id: 'lentils', g: 70, ru: 'Рагу из чечевицы', lt: 'Lęšių troškinys' }];
  const veg: { key: string; items: [string, number][]; w: L }[] = [
    { key: 'spinach', items: [['spinach', 60]], w: ['со шпинатом', 'su špinatais'] }, { key: 'pumpkin', items: [['pumpkin', 150]], w: ['с тыквой', 'su moliūgu'] },
    { key: 'pepper', items: [['bell_pepper', 120]], w: ['с перцем', 'su paprika'] }, { key: 'zucchini', items: [['zucchini', 150]], w: ['с кабачком', 'su cukinija'] },
    { key: 'sweet_potato', items: [['sweet_potato', 150]], w: ['с бататом', 'su batatais'] }, { key: 'cabbage', items: [['cabbage', 150]], w: ['с капустой', 'su kopūstais'] },
  ];
  for (const l of leg) for (const v of veg) {
    const id = `g_stew_${l.id}_${v.key}`;
    const lentil = l.id === 'lentils';
    out.push(make({
      id, emoji: '🍛', meal: 'lunch', cuisine: hash(id) % 3 === 0 ? 'georgian' : 'mediterranean', prep: 10, cook: lentil ? 25 : 20, equipment: ['stove'], photo: pickBy(id, ['bean_stew', 'chickpea_curry', 'dal']),
      ru: `${l.ru} ${v.w[0]}`, lt: `${l.lt} ${v.w[1]}`,
      items: [[l.id, l.g], ...v.items, ['onion', 50], ['carrot', 50], ['canned_tomatoes', 150], ['garlic', 5], ['olive_oil', 7], ['rye_bread', 40]],
      steps: [S(5, 'Лук, морковь и чеснок нарежьте и обжарьте на масле 5 минут.', 'Svogūną, morką ir česnaką supjaustykite ir pakepinkite su aliejumi 5 min.'),
        S(0, 'Добавьте нарезанные овощи и томаты из банки.', 'Sudėkite supjaustytas daržoves ir konservuotus pomidorus.'),
        lentil ? S(20, 'Всыпьте промытую чечевицу, добавьте 300 мл воды и тушите 20 минут.', 'Suberkite nuplautus lęšius, įpilkite 300 ml vandens ir troškinkite 20 min.')
          : S(15, 'Добавьте промытые бобовые и 100 мл воды, тушите 15 минут.', 'Sudėkite nuplautus ankštinius ir 100 ml vandens, troškinkite 15 min.'),
        S(0, 'Посолите, поперчите, подавайте с ломтиком ржаного хлеба.', 'Pasūdykite, papipirinkite, patiekite su rieke ruginės duonos.')],
      tip: ['Рагу на следующий день ещё вкуснее.', 'Kitą dieną troškinys dar skanesnis.'],
    }));
  }
  return out;
}

// ---------- 12. Scrambled eggs (breakfast) ----------
function scrambles(): Gen[] {
  const out: Gen[] = [];
  const veg: { key: string; items: [string, number][]; w: L }[] = [
    { key: 'tomato', items: [['tomato', 100]], w: ['помидорами', 'pomidorais'] }, { key: 'spinach', items: [['spinach', 50]], w: ['шпинатом', 'špinatais'] },
    { key: 'pepper', items: [['bell_pepper', 100]], w: ['перцем', 'paprika'] }, { key: 'mushroom', items: [['mushrooms', 100]], w: ['грибами', 'grybais'] },
    { key: 'zucchini', items: [['zucchini', 120]], w: ['кабачком', 'cukinija'] }, { key: 'feta', items: [['feta', 30], ['tomato', 60]], w: ['фетой и помидорами', 'feta ir pomidorais'] },
  ];
  for (const v of veg) for (const bread of [true, false]) {
    const id = `g_scramble_${v.key}${bread ? '_bread' : ''}`;
    out.push(make({
      id, emoji: '🍳', meal: 'breakfast', breakfastStyle: 'savory', prep: 4, cook: 6, equipment: [], photo: pickBy(id, ['omelette_veg', 'shakshuka', 'tofu_scramble']),
      ru: `Скрэмбл с ${v.w[0]}${bread ? ' и ржаным хлебом' : ''}`, lt: `Plakta kiaušinienė su ${v.w[1]}${bread ? ' ir rugine duona' : ''}`,
      items: [['eggs', 120], ...v.items, ['olive_oil', 5], ...(bread ? [['rye_bread', 40] as [string, number]] : [])],
      steps: [S(3, 'Овощи нарежьте и обжарьте на масле 3 минуты.', 'Daržoves supjaustykite ir pakepinkite su aliejumi 3 min.'),
        S(3, 'Влейте взбитые с солью яйца и помешивайте лопаткой 2–3 минуты до мягких хлопьев.', 'Supilkite su druska išplaktus kiaušinius ir maišykite mentele 2–3 min., kol sutirštės.'),
        S(0, bread ? 'Подавайте с ломтиком ржаного хлеба.' : 'Подавайте сразу.', bread ? 'Patiekite su rieke ruginės duonos.' : 'Patiekite iškart.')],
      tip: ['Снимите с огня чуть раньше — яйца дойдут сами и останутся нежными.', 'Nukelkite šiek tiek anksčiau — kiaušiniai dar sutirštės ir liks švelnūs.'],
    }));
  }
  return out;
}

export function extraRecipes(): Gen[] {
  return [...wraps(), ...salads(), ...bakes(), ...onePot(), ...toasts(), ...smoothies(), ...creamSoups(), ...overnightOats(), ...stuffedPotatoes(), ...fritters(), ...legumeStews(), ...scrambles()];
}
