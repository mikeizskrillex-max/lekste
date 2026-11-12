/**
 * Recipe database generator.
 *
 * Builds 1 000+ dishes from the ingredients we have real store prices for,
 * using simple cooking patterns (protein + side + vegetables + cooking method,
 * soups, bowls, pasta, porridges, omelettes, snacks). Names and steps are
 * built from grammatical forms written per ingredient (LT / RU), so no case
 * endings are guessed. Nutrition, allergens and price are NOT stored here:
 * they are computed from the ingredients like for every other recipe.
 *
 * Hand-written "chef" recipes live in ../recipes.ts and are preferred by the
 * planner; generated ones give variety. Everything here is deterministic, so
 * the same id always means the same dish.
 */
import type { Recipe } from '../recipes';
import type { RecipeDetail, Step } from '../recipeDetails';
import type { Equipment, MealType } from '../../domain/types';

type L = [ru: string, lt: string];
interface Gen { recipe: Recipe; detail: RecipeDetail; photo: string }

// ---------- deterministic helpers ----------
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const pickBy = <T,>(key: string, arr: T[]): T => arr[hash(key) % arr.length];
function sample<T>(key: string, arr: T[], n: number): T[] {
  return [...arr].sort((a, b) => hash(key + JSON.stringify(a)) - hash(key + JSON.stringify(b))).slice(0, n);
}

// ---------- vocabulary ----------
type Method = 'grill' | 'bake' | 'stew' | 'wok';

interface Protein {
  id: string; g: number; nom: L; minutes: Partial<Record<Method, number>>;
  title: Partial<Record<Method, L>>; photos: Partial<Record<Method, string[]>>;
  fish?: boolean; mince?: boolean; legume?: boolean;
}

const P: Protein[] = [
  { id: 'chicken_breast', g: 150, nom: ['Куриное филе', 'Vištienos filė'], minutes: { grill: 6, bake: 25, stew: 15, wok: 6 },
    title: { grill: ['Курица-гриль', 'Kepta vištienos krūtinėlė'], bake: ['Запечённая курица', 'Orkaitėje kepta vištiena'], stew: ['Курица в томатном соусе', 'Vištiena pomidorų padaže'], wok: ['Курица вок', 'Vištiena wok'] },
    photos: { grill: ['chicken_buckwheat', 'chicken_mixveg', 'chicken_bulgur'], bake: ['baked_chicken_veg', 'chicken_skewers'], stew: ['chicken_curry'], wok: ['rice_chicken_box', 'noodle_chicken'] } },
  { id: 'chicken_thigh', g: 150, nom: ['Куриное бедро', 'Vištienos šlaunelės'], minutes: { grill: 7, bake: 35, stew: 20, wok: 7 },
    title: { grill: ['Куриное бедро на сковороде', 'Keptos vištienos šlaunelės'], bake: ['Запечённое куриное бедро', 'Orkaitėje keptos vištienos šlaunelės'], stew: ['Тушёное куриное бедро', 'Troškintos vištienos šlaunelės'], wok: ['Куриное бедро вок', 'Vištienos šlaunelės wok'] },
    photos: { grill: ['chicken_mixveg'], bake: ['roast_chicken_sp', 'baked_chicken_veg'], stew: ['chicken_cabbage', 'plov'], wok: ['noodle_chicken'] } },
  { id: 'turkey_fillet', g: 150, nom: ['Филе индейки', 'Kalakutienos filė'], minutes: { grill: 6, bake: 25, stew: 15, wok: 6 },
    title: { grill: ['Индейка на гриле', 'Kepta kalakutiena'], bake: ['Запечённая индейка', 'Orkaitėje kepta kalakutiena'], stew: ['Индейка в томатном соусе', 'Kalakutiena pomidorų padaže'], wok: ['Индейка вок', 'Kalakutiena wok'] },
    photos: { grill: ['chicken_bulgur', 'chicken_buckwheat'], bake: ['chicken_skewers'], stew: ['chicken_curry', 'beef_stew'], wok: ['rice_chicken_box'] } },
  { id: 'pork_loin', g: 130, nom: ['Свиная корейка', 'Kiaulienos nugarinė'], minutes: { grill: 5, bake: 30, stew: 25, wok: 6 },
    title: { grill: ['Свиная корейка на сковороде', 'Kepta kiaulienos nugarinė'], bake: ['Запечённая свинина', 'Orkaitėje kepta kiauliena'], stew: ['Тушёная свинина', 'Troškinta kiauliena'], wok: ['Свинина вок', 'Kiauliena wok'] },
    photos: { grill: ['pork_oven'], bake: ['pork_oven'], stew: ['beef_stew'], wok: ['rice_chicken_box'] } },
  { id: 'turkey_mince', g: 140, nom: ['Фарш индейки', 'Kalakutienos faršas'], mince: true, minutes: { grill: 10, bake: 25, stew: 15 },
    title: { grill: ['Котлеты из индейки', 'Kalakutienos kotletai'], bake: ['Запечённые тефтели из индейки', 'Orkaitėje kepti kalakutienos kukuliai'], stew: ['Тефтели из индейки в томатах', 'Kalakutienos kukuliai pomidoruose'] },
    photos: { grill: ['turkey_beet'], bake: ['turkey_beet'], stew: ['beef_potatoes'] } },
  { id: 'beef_mince', g: 120, nom: ['Говяжий фарш', 'Jautienos faršas'], mince: true, minutes: { grill: 10, bake: 25, stew: 15, wok: 6 },
    title: { grill: ['Говяжьи котлеты', 'Jautienos kotletai'], bake: ['Запечённые говяжьи тефтели', 'Orkaitėje kepti jautienos kukuliai'], stew: ['Говяжьи тефтели в томатах', 'Jautienos kukuliai pomidoruose'], wok: ['Говяжий фарш по-азиатски', 'Jautienos faršas azijietiškai'] },
    photos: { grill: ['turkey_beet'], bake: ['turkey_beet'], stew: ['beef_potatoes', 'beef_stew'], wok: ['bibimbap'] } },
  { id: 'cod', g: 170, nom: ['Треска', 'Menkė'], fish: true, minutes: { grill: 8, bake: 18, stew: 8 },
    title: { grill: ['Треска на сковороде', 'Keptuvėje kepta menkė'], bake: ['Запечённая треска', 'Orkaitėje kepta menkė'], stew: ['Треска в томатах', 'Menkė pomidoruose'] },
    photos: { grill: ['mackerel_bowl'], bake: ['cod_veg', 'mackerel_baked'], stew: ['cod_tomato'] } },
  { id: 'salmon', g: 120, nom: ['Лосось', 'Lašiša'], fish: true, minutes: { grill: 8, bake: 15 },
    title: { grill: ['Лосось на сковороде', 'Keptuvėje kepta lašiša'], bake: ['Запечённый лосось', 'Orkaitėje kepta lašiša'] },
    photos: { grill: ['salmon_spinach', 'salmon_rice'], bake: ['salmon_rice', 'salmon_tomato'] } },
  { id: 'shrimp', g: 130, nom: ['Креветки', 'Krevetės'], fish: true, minutes: { grill: 3, wok: 3 },
    title: { grill: ['Креветки с чесноком', 'Krevetės su česnaku'], wok: ['Креветки вок', 'Krevetės wok'] },
    photos: { grill: ['pasta_shrimp'], wok: ['shrimp_rice'] } },
  { id: 'tofu', g: 180, nom: ['Тофу', 'Tofu'], minutes: { grill: 6, bake: 20, stew: 10, wok: 6 },
    title: { grill: ['Жареный тофу', 'Keptas tofu'], bake: ['Запечённый тофу', 'Orkaitėje keptas tofu'], stew: ['Тофу в томатном соусе', 'Tofu pomidorų padaže'], wok: ['Тофу вок', 'Tofu wok'] },
    photos: { grill: ['tofu_scramble'], bake: ['tofu_scramble'], stew: ['dal'], wok: ['tofu_buckwheat'] } },
  { id: 'chickpeas', g: 180, nom: ['Нут', 'Avinžirniai'], legume: true, minutes: { bake: 25, stew: 15 },
    title: { bake: ['Запечённый нут', 'Orkaitėje kepti avinžirniai'], stew: ['Тушёный нут', 'Troškinti avinžirniai'] },
    photos: { bake: ['vegan_bowl'], stew: ['chickpea_curry', 'bean_stew'] } },
  { id: 'beans', g: 180, nom: ['Фасоль', 'Pupelės'], legume: true, minutes: { stew: 15 },
    title: { stew: ['Тушёная фасоль', 'Troškintos pupelės'] }, photos: { stew: ['bean_stew', 'tomato_soup'] } },
  { id: 'lentils', g: 70, nom: ['Красная чечевица', 'Raudonieji lęšiai'], legume: true, minutes: { stew: 20 },
    title: { stew: ['Чечевица, тушённая с томатами', 'Lęšiai, troškinti su pomidorais'] }, photos: { stew: ['dal'] } },
];

interface Side { id: string; g: number; nom: L; w: L; minutes: number; how: 'boil' | 'soak' | 'pasta' | 'potato' }
const SIDES: Side[] = [
  { id: 'buckwheat', g: 65, nom: ['гречка', 'grikiai'], w: ['гречкой', 'grikiais'], minutes: 15, how: 'boil' },
  { id: 'rice', g: 65, nom: ['рис', 'ryžiai'], w: ['рисом', 'ryžiais'], minutes: 15, how: 'boil' },
  { id: 'bulgur', g: 65, nom: ['булгур', 'bulguras'], w: ['булгуром', 'bulguru'], minutes: 15, how: 'soak' },
  { id: 'quinoa', g: 60, nom: ['киноа', 'kinva'], w: ['киноа', 'kinva'], minutes: 15, how: 'boil' },
  { id: 'potatoes', g: 220, nom: ['картофель', 'bulvės'], w: ['картофелем', 'bulvėmis'], minutes: 20, how: 'potato' },
  { id: 'sweet_potato', g: 220, nom: ['батат', 'batatai'], w: ['бататом', 'batatais'], minutes: 25, how: 'potato' },
  { id: 'pasta', g: 75, nom: ['паста', 'makaronai'], w: ['пастой', 'makaronais'], minutes: 10, how: 'pasta' },
  { id: 'barley', g: 55, nom: ['перловка', 'perlinės kruopos'], w: ['перловкой', 'perlinėmis kruopomis'], minutes: 35, how: 'boil' },
];
const SIDE_OK: Record<Method, string[]> = {
  grill: ['buckwheat', 'rice', 'bulgur', 'quinoa', 'potatoes', 'sweet_potato', 'barley'],
  bake: ['potatoes', 'sweet_potato', 'buckwheat', 'rice', 'bulgur', 'quinoa'],
  stew: ['buckwheat', 'rice', 'bulgur', 'potatoes', 'pasta', 'barley', 'quinoa'],
  wok: ['rice', 'buckwheat', 'quinoa'],
};

interface Veg { key: string; items: [string, number][]; nom: L; w: L }
const VEG: Veg[] = [
  { key: 'broccoli', items: [['broccoli', 150]], nom: ['брокколи', 'brokoliai'], w: ['брокколи', 'brokoliais'] },
  { key: 'cauliflower', items: [['cauliflower', 150]], nom: ['цветная капуста', 'žiediniai kopūstai'], w: ['цветной капустой', 'žiediniais kopūstais'] },
  { key: 'zucchini', items: [['zucchini', 160]], nom: ['кабачок', 'cukinija'], w: ['кабачком', 'cukinija'] },
  { key: 'pepper', items: [['bell_pepper', 150]], nom: ['болгарский перец', 'paprika'], w: ['болгарским перцем', 'paprika'] },
  { key: 'carrot', items: [['carrot', 130]], nom: ['морковь', 'morkos'], w: ['морковью', 'morkomis'] },
  { key: 'peas', items: [['green_peas', 100], ['carrot', 50]], nom: ['горошек и морковь', 'žirneliai ir morkos'], w: ['горошком и морковью', 'žirneliais ir morkomis'] },
  { key: 'mixveg', items: [['mixed_veg', 160]], nom: ['овощная смесь', 'daržovių mišinys'], w: ['овощной смесью', 'daržovių mišiniu'] },
  { key: 'spinach', items: [['spinach', 80], ['tomato', 80]], nom: ['шпинат и помидор', 'špinatai ir pomidoras'], w: ['шпинатом и помидором', 'špinatais ir pomidoru'] },
  { key: 'cabbage', items: [['cabbage', 180], ['carrot', 40]], nom: ['капуста и морковь', 'kopūstai ir morkos'], w: ['тушёной капустой', 'troškintais kopūstais'] },
  { key: 'pumpkin', items: [['pumpkin', 180]], nom: ['тыква', 'moliūgas'], w: ['тыквой', 'moliūgu'] },
  { key: 'mushrooms', items: [['mushrooms', 130]], nom: ['шампиньоны', 'pievagrybiai'], w: ['грибами', 'grybais'] },
  { key: 'salad', items: [['tomato', 100], ['cucumber', 100]], nom: ['помидор и огурец', 'pomidoras ir agurkas'], w: ['свежим салатом', 'šviežiomis salotomis'] },
];
const VEG_OK: Record<Method, string[]> = {
  grill: VEG.map((v) => v.key),
  bake: ['broccoli', 'cauliflower', 'zucchini', 'pepper', 'carrot', 'pumpkin', 'mushrooms', 'salad'],
  stew: ['broccoli', 'cauliflower', 'zucchini', 'pepper', 'carrot', 'peas', 'mixveg', 'spinach', 'cabbage', 'pumpkin', 'mushrooms'],
  wok: ['broccoli', 'pepper', 'carrot', 'peas', 'mixveg', 'cabbage', 'zucchini', 'mushrooms'],
};

const S = (minutes: number, ru: string, lt: string): Step => [minutes, ru, lt];
/** "a и b", or "a, b" when b already contains "и" — avoids "с X и Y и Z". */
const and = (a: string, b: string, lang: 0 | 1) => (b.includes(lang ? ' ir ' : ' и ') ? `${a}, ${b}` : `${a} ${lang ? 'ir' : 'и'} ${b}`);

function sideStep(s: Side): Step {
  if (s.how === 'soak') return S(15, `Гарнир — ${s.nom[0]}: залейте кипятком 1:2, накройте и оставьте на 15 минут.`, `Garnyras — ${s.nom[1]}: užpilkite verdančiu vandeniu santykiu 1:2, uždenkite ir palikite 15 min.`);
  if (s.how === 'pasta') return S(10, `Гарнир — ${s.nom[0]}: отварите в подсоленной воде по времени на упаковке (около 10 минут).`, `Garnyras — ${s.nom[1]}: išvirkite pasūdytame vandenyje pagal pakuotės nurodymą (apie 10 min.).`);
  if (s.how === 'potato') return S(s.minutes, `Гарнир — ${s.nom[0]}: очистите, нарежьте кусочками и отварите в подсоленной воде ${s.minutes} минут.`, `Garnyras — ${s.nom[1]}: nulupkite, supjaustykite gabalėliais ir virkite pasūdytame vandenyje ${s.minutes} min.`);
  return S(s.minutes, `Гарнир — ${s.nom[0]}: промойте и отварите в подсоленной воде ${s.minutes} минут.`, `Garnyras — ${s.nom[1]}: nuplaukite ir virkite pasūdytame vandenyje ${s.minutes} min.`);
}

// ---------- 1. Main meals: protein + side + vegetables + method ----------
function mains(): Gen[] {
  const out: Gen[] = [];
  for (const p of P) {
    for (const m of Object.keys(p.title) as Method[]) {
      const combos: [Side, Veg][] = [];
      for (const s of SIDES.filter((x) => SIDE_OK[m].includes(x.id))) {
        if (p.legume && (s.id === 'pasta')) continue;
        for (const v of VEG.filter((x) => VEG_OK[m].includes(x.key))) {
          if (p.fish && v.key === 'cabbage') continue;
          combos.push([s, v]);
        }
      }
      for (const [s, v] of sample(`${p.id}-${m}`, combos, 20)) {
        const id = `g_${p.id}_${m}_${s.id}_${v.key}`;
        const items: [string, number][] = [[p.id, p.g], [s.id, s.g], ...v.items];
        const steps: Step[] = [];
        const [pt, ptLt] = p.title[m]!;
        const pm = p.minutes[m]!;
        if (m === 'bake' && s.how === 'potato') {
          steps.push(S(0, `Разогрейте духовку до 200 °C. Гарнир — ${s.nom[0]}: нарежьте дольками.`, `Įkaitinkite orkaitę iki 200 °C. Garnyras — ${s.nom[1]}: supjaustykite skiltelėmis.`));
        } else {
          steps.push(sideStep(s));
          if (m === 'bake') steps.push(S(0, 'Разогрейте духовку до 200 °C.', 'Įkaitinkite orkaitę iki 200 °C.'));
        }
        steps.push(S(0, `Овощи — ${v.nom[0]}: вымойте и нарежьте небольшими кусочками.`, `Daržovės — ${v.nom[1]}: nuplaukite ir supjaustykite nedideliais gabalėliais.`));
        if (p.mince && m !== 'wok') steps.push(S(0, `${p.nom[0]}: посолите, поперчите и влажными руками сформируйте ${m === 'grill' ? 'котлеты' : 'тефтели'}.`, `${p.nom[1]}: pasūdykite, papipirinkite ir drėgnomis rankomis suformuokite ${m === 'grill' ? 'kotletus' : 'kukulius'}.`));
        if (m === 'grill') {
          items.push(['olive_oil', 7]);
          if (p.fish) items.push(['lemon', 10]);
          steps.push(p.id === 'shrimp' || p.id === 'tofu'
            ? S(pm, `${p.nom[0]}: обжарьте на разогретой сковороде с ложкой масла ${pm} минут, помешивая. Посолите.`, `${p.nom[1]}: kepkite įkaitintoje keptuvėje su šaukštu aliejaus ${pm} min., maišydami. Pasūdykite.`)
            : S(pm, `${p.nom[0]}: ${p.mince ? '' : 'посолите, поперчите и '}обжарьте на разогретой сковороде с ложкой масла по ${Math.ceil(pm / 2)} минут с каждой стороны.`, `${p.nom[1]}: ${p.mince ? '' : 'pasūdykite, papipirinkite ir '}kepkite įkaitintoje keptuvėje su šaukštu aliejaus po ${Math.ceil(pm / 2)} min. iš abiejų pusių.`));
          steps.push(v.key === 'salad'
            ? S(0, 'Нарежьте помидор и огурец, посолите и сбрызните маслом.', 'Supjaustykite pomidorą ir agurką, pasūdykite ir apšlakstykite aliejumi.')
            : S(5, 'Овощи обжарьте на той же сковороде или приготовьте на пару 5 минут.', 'Daržoves pakepinkite toje pačioje keptuvėje arba virkite garuose 5 min.'));
        } else if (m === 'bake') {
          items.push(['olive_oil', 7]);
          if (p.fish) items.push(['lemon', 10]);
          steps.push(S(0, `Выложите на противень с пергаментом: ${p.nom[0].toLowerCase()}, овощи${s.how === 'potato' ? ' и гарнир' : ''}. Посолите, поперчите, сбрызните маслом.`, `Ant skardos su kepimo popieriumi dėkite: ${p.nom[1].toLowerCase()}, daržoves${s.how === 'potato' ? ' ir garnyrą' : ''}. Pasūdykite, papipirinkite, apšlakstykite aliejumi.`));
          const t = Math.max(pm, s.how === 'potato' ? 30 : 0);
          steps.push(S(t, `Запекайте ${t} минут до золотистой корочки.`, `Kepkite ${t} min., kol paruduos.`));
        } else if (m === 'stew') {
          items.push(['onion', 40], ['canned_tomatoes', 150], ['garlic', 4]);
          steps.push(S(3, 'Лук и чеснок мелко нарежьте и обжарьте на сковороде с высокими бортами 3 минуты.', 'Svogūną ir česnaką smulkiai supjaustykite ir pakepinkite gilioje keptuvėje 3 min.'));
          steps.push(S(5, `${p.nom[0]}: добавьте и обжаривайте 5 минут.`, `${p.nom[1]}: sudėkite ir kepkite 5 min.`));
          steps.push(S(pm, `Добавьте томаты и овощи${p.id === 'lentils' ? ' и 300 мл воды' : ''}, посолите и тушите под крышкой ${pm} минут.`, `Sudėkite pomidorus ir daržoves${p.id === 'lentils' ? ' bei 300 ml vandens' : ''}, pasūdykite ir troškinkite uždengę ${pm} min.`));
        } else {
          items.push(['soy_sauce', 10], ['garlic', 4], ['olive_oil', 5]);
          steps.push(S(pm, `${p.nom[0]}: нарежьте полосками и обжарьте на сильном огне ${pm} минут.`, `${p.nom[1]}: supjaustykite juostelėmis ir kepkite stipria ugnimi ${pm} min.`));
          steps.push(S(4, 'Добавьте овощи и чеснок, жарьте ещё 4 минуты, постоянно помешивая.', 'Sudėkite daržoves ir česnaką, kepkite dar 4 min., nuolat maišydami.'));
          steps.push(S(0, 'Влейте соевый соус и перемешайте с гарниром.', 'Įpilkite sojų padažo ir išmaišykite su garnyru.'));
        }
        steps.push(S(0, 'Выложите на тарелку гарнир, овощи и основное блюдо. Приятного аппетита!', 'Į lėkštę dėkite garnyrą, daržoves ir pagrindinį patiekalą. Skanaus!'));
        const cook = Math.max(s.minutes, pm + (m === 'stew' ? 8 : m === 'wok' ? 4 : 0), m === 'bake' && s.how === 'potato' ? 30 : 0) + 5;
        const equipment: Equipment[] = m === 'bake' ? ['oven'] : ['stove'];
        out.push({
          photo: pickBy(id, p.photos[m]!),
          recipe: {
            id, ru: `${pt} с ${and(s.w[0], v.w[0], 0)}`, lt: `${ptLt} su ${and(s.w[1], v.w[1], 1)}`, emoji: p.fish ? '🐟' : p.legume ? '🫘' : p.id === 'tofu' ? '🥢' : '🍗',
            meal: hash(id) % 2 ? 'lunch' : 'dinner', cuisine: m === 'wok' ? 'asian' : m === 'stew' ? 'georgian' : p.fish ? 'mediterranean' : 'home',
            minutes: 10 + cook, equipment, spice: m === 'grill' || m === 'bake' ? 0 : 1, items, stepsLt: [], stepsRu: [],
          },
          detail: { level: p.mince || m === 'wok' ? 2 : 1, prep: 10, cook, steps, tip: TIPS_MAIN[hash(id) % TIPS_MAIN.length] },
        });
      }
    }
  }
  return out;
}

const TIPS_MAIN: [string, string][] = [
  ['Дайте мясу или рыбе отдохнуть 2–3 минуты после готовки — так они останутся сочными.', 'Leiskite mėsai ar žuviai pailsėti 2–3 min. — jos liks sultingos.'],
  ['Гарнир можно сварить сразу на 2–3 дня: в холодильнике он хранится до 3 суток.', 'Garnyrą galima išvirti 2–3 dienoms: šaldytuve jis laikosi iki 3 parų.'],
  ['Щепотка паприки, чеснока и сушёных трав заменит готовые соусы без лишних калорий.', 'Žiupsnelis paprikos, česnako ir džiovintų žolelių pakeis padažus be papildomų kalorijų.'],
  ['Не перегружайте сковороду — продукты должны жариться, а не тушиться.', 'Neperkraukite keptuvės — produktai turi kepti, o ne troškintis.'],
  ['Овощи режьте одинаковыми кусочками — так они приготовятся равномерно.', 'Daržoves pjaustykite vienodais gabalėliais — jos iškeps tolygiai.'],
  ['Остатки удобно взять на обед: блюдо отлично разогревается.', 'Likučius patogu pasiimti pietums: patiekalas puikiai pasišildo.'],
];

// ---------- 2. Soups ----------
interface SoupBase { id: string; items: [string, number][]; w: L; nom: L; t: number; photo: string[] }
const SOUP_BASE: SoupBase[] = [
  { id: 'chicken', items: [['chicken_breast', 100]], w: ['курицей', 'vištiena'], nom: ['Куриное филе', 'Vištienos filė'], t: 15, photo: ['chicken_soup', 'ramen'] },
  { id: 'meatballs', items: [['turkey_mince', 100]], w: ['фрикадельками из индейки', 'kalakutienos kukuliais'], nom: ['Фарш индейки', 'Kalakutienos faršas'], t: 10, photo: ['veg_soup_meatballs'] },
  { id: 'beef', items: [['beef_mince', 80]], w: ['говядиной', 'jautiena'], nom: ['Говяжий фарш', 'Jautienos faršas'], t: 10, photo: ['borscht', 'veg_soup_meatballs'] },
  { id: 'lentil', items: [['lentils', 60]], w: ['красной чечевицей', 'raudonaisiais lęšiais'], nom: ['Красная чечевица', 'Raudonieji lęšiai'], t: 15, photo: ['lentil_soup', 'pumpkin_soup'] },
  { id: 'beans', items: [['beans', 150]], w: ['фасолью', 'pupelėmis'], nom: ['Фасоль', 'Pupelės'], t: 5, photo: ['tomato_soup'] },
  { id: 'chickpea', items: [['chickpeas', 150]], w: ['нутом', 'avinžirniais'], nom: ['Нут', 'Avinžirniai'], t: 5, photo: ['pumpkin_soup', 'tomato_soup'] },
  { id: 'mushroom', items: [['mushrooms', 150]], w: ['грибами', 'grybais'], nom: ['Шампиньоны', 'Pievagrybiai'], t: 8, photo: ['barley_soup'] },
];
const SOUP_VEG: Veg[] = VEG.filter((v) => ['cabbage', 'peas', 'zucchini', 'pumpkin', 'cauliflower', 'broccoli', 'spinach', 'pepper'].includes(v.key));
const SOUP_GRAIN: { id: string | null; g: number; w: L; t: number }[] = [
  { id: null, g: 0, w: ['', ''], t: 0 },
  { id: 'rice', g: 30, w: ['рисом', 'ryžiais'], t: 15 },
  { id: 'buckwheat', g: 30, w: ['гречкой', 'grikiais'], t: 15 },
  { id: 'barley', g: 35, w: ['перловкой', 'perlinėmis kruopomis'], t: 30 },
  { id: 'pasta', g: 30, w: ['лапшой', 'makaronais'], t: 8 },
];

function soups(): Gen[] {
  const all: Gen[] = [];
  for (const b of SOUP_BASE) for (const v of SOUP_VEG) for (const gr of SOUP_GRAIN) {
    if (b.id === 'lentil' && gr.id) continue;
    const id = `g_soup_${b.id}_${v.key}_${gr.id ?? 'plain'}`;
    const items: [string, number][] = [...b.items, ['potatoes', 120], ['carrot', 50], ['onion', 30], ...v.items.map(([i, g]) => [i, Math.round(g * 0.7)] as [string, number]), ['rye_bread', 40]];
    if (gr.id) items.push([gr.id, gr.g]);
    const steps: Step[] = [
      b.id === 'meatballs' || b.id === 'beef'
        ? S(0, `${b.nom[0]}: посолите и сформируйте маленькие фрикадельки.`, `${b.nom[1]}: pasūdykite ir suformuokite mažus kukulius.`)
        : S(0, 'Картофель нарежьте кубиками, морковь — кружочками, лук — мелко.', 'Bulves supjaustykite kubeliais, morkas griežinėliais, svogūną smulkiai.'),
      gr.id === 'barley' ? S(30, 'Перловку промойте и отварите в 800 мл воды 30 минут.', 'Perlines kruopas nuplaukite ir virkite 800 ml vandens 30 min.') : S(0, 'Доведите до кипения 800 мл воды.', 'Užvirinkite 800 ml vandens.'),
      S(10, 'Положите картофель, морковь и лук, посолите и варите 10 минут.', 'Sudėkite bulves, morkas ir svogūną, pasūdykite ir virkite 10 min.'),
      S(b.t, `${b.nom[0]}: добавьте в суп и варите ${b.t} минут.`, `${b.nom[1]}: sudėkite į sriubą ir virkite ${b.t} min.`),
      S(Math.max(6, gr.id && gr.id !== 'barley' ? gr.t : 6), `Добавьте овощи (${v.nom[0]})${gr.id && gr.id !== 'barley' ? ' и крупу или лапшу' : ''} и варите до готовности.`, `Sudėkite daržoves (${v.nom[1]})${gr.id && gr.id !== 'barley' ? ' ir kruopas ar makaronus' : ''} ir virkite, kol išvirs.`),
      S(0, 'Посолите, поперчите, дайте постоять 5 минут и подавайте с ржаным хлебом.', 'Pasūdykite, papipirinkite, leiskite pastovėti 5 min. ir patiekite su rugine duona.'),
    ];
    const cook = 25 + (gr.id === 'barley' ? 25 : 0);
    all.push({
      photo: pickBy(id, b.photo),
      recipe: {
        id, ru: `Суп с ${b.w[0]}, ${v.w[0]}${gr.id ? ` и ${gr.w[0]}` : ''}`, lt: `Sriuba su ${b.w[1]}, ${v.w[1]}${gr.id ? ` ir ${gr.w[1]}` : ''}`,
        emoji: '🍲', meal: 'lunch', cuisine: 'home', minutes: 10 + cook, equipment: ['stove'], spice: 0, items, stepsLt: [], stepsRu: [],
      },
      detail: { level: 1, prep: 10, cook, steps, tip: ['Суп вкуснее на второй день — варите сразу на 2–3 порции.', 'Sriuba skanesnė antrą dieną — virkite iškart 2–3 porcijoms.'] },
    });
  }
  return sample('soups', all, 170);
}

// ---------- 3. Bowls / salads (dinner) ----------
interface BowlP { id: string; items: [string, number][]; w: L; nom: L; cook: number; photo: string[] }
const BOWL_P: BowlP[] = [
  { id: 'chicken', items: [['chicken_breast', 130]], w: ['курицей', 'vištiena'], nom: ['Куриное филе', 'Vištienos filė'], cook: 12, photo: ['quinoa_bowl', 'greek_salad_chicken'] },
  { id: 'turkey', items: [['turkey_fillet', 130]], w: ['индейкой', 'kalakutiena'], nom: ['Филе индейки', 'Kalakutienos filė'], cook: 12, photo: ['quinoa_bowl'] },
  { id: 'tuna', items: [['tuna_can', 110]], w: ['тунцом', 'tunu'], nom: ['Тунец', 'Tunas'], cook: 0, photo: ['tuna_salad'] },
  { id: 'egg', items: [['eggs', 120]], w: ['яйцом', 'kiaušiniu'], nom: ['Яйца', 'Kiaušiniai'], cook: 8, photo: ['egg_bake', 'eggs_avocado'] },
  { id: 'salmon', items: [['salmon', 110]], w: ['лососем', 'lašiša'], nom: ['Лосось', 'Lašiša'], cook: 8, photo: ['salmon_spinach'] },
  { id: 'chickpea', items: [['chickpeas', 160]], w: ['нутом', 'avinžirniais'], nom: ['Нут', 'Avinžirniai'], cook: 0, photo: ['vegan_bowl'] },
  { id: 'beans', items: [['beans', 160]], w: ['фасолью', 'pupelėmis'], nom: ['Фасоль', 'Pupelės'], cook: 0, photo: ['vegan_bowl', 'bean_stew'] },
  { id: 'feta', items: [['feta', 50], ['eggs', 60]], w: ['фетой и яйцом', 'feta ir kiaušiniu'], nom: ['Фета и яйцо', 'Feta ir kiaušinis'], cook: 8, photo: ['greek_salad_chicken'] },
  { id: 'tofu', items: [['tofu', 160]], w: ['тофу', 'tofu'], nom: ['Тофу', 'Tofu'], cook: 6, photo: ['tofu_scramble'] },
];
const BOWL_BASE: { id: string | null; g: number; w: L; t: number }[] = [
  { id: 'quinoa', g: 50, w: ['киноа', 'kinva'], t: 15 },
  { id: 'bulgur', g: 50, w: ['булгуром', 'bulguru'], t: 15 },
  { id: 'rice', g: 50, w: ['рисом', 'ryžiais'], t: 15 },
  { id: 'buckwheat', g: 50, w: ['гречкой', 'grikiais'], t: 15 },
  { id: 'potatoes', g: 150, w: ['картофелем', 'bulvėmis'], t: 20 },
];
const BOWL_VEG: { key: string; items: [string, number][]; w: L; nom: L }[] = [
  { key: 'tc', items: [['tomato', 100], ['cucumber', 100]], w: ['помидором и огурцом', 'pomidoru ir agurku'], nom: ['помидор и огурец', 'pomidoras ir agurkas'] },
  { key: 'cc', items: [['cabbage', 100], ['carrot', 60]], w: ['капустой и морковью', 'kopūstais ir morkomis'], nom: ['капуста и морковь', 'kopūstai ir morkos'] },
  { key: 'sa', items: [['spinach', 60], ['avocado', 60]], w: ['шпинатом и авокадо', 'špinatais ir avokadu'], nom: ['шпинат и авокадо', 'špinatai ir avokadas'] },
  { key: 'pc', items: [['bell_pepper', 100], ['corn', 60]], w: ['перцем и кукурузой', 'paprika ir kukurūzais'], nom: ['перец и кукуруза', 'paprika ir kukurūzai'] },
];
function bowls(): Gen[] {
  const all: Gen[] = [];
  for (const p of BOWL_P) for (const b of BOWL_BASE) for (const v of BOWL_VEG) {
    const id = `g_bowl_${p.id}_${b.id}_${v.key}`;
    const yogurt = hash(id) % 3 === 0;
    const items: [string, number][] = [...p.items, [b.id!, b.g], ...v.items, yogurt ? ['natural_yogurt', 50] : ['olive_oil', 7], ['lemon', 10]];
    const steps: Step[] = [
      b.id === 'bulgur' ? S(15, 'Основа — булгур: залейте кипятком 1:2 и оставьте на 15 минут.', 'Pagrindas — bulguras: užpilkite verdančiu vandeniu 1:2 ir palikite 15 min.') : S(b.t, `Основа — ${b.id === 'potatoes' ? 'картофель: нарежьте кубиками и отварите' : `${['киноа', 'булгур', 'рис', 'гречка'][['quinoa', 'bulgur', 'rice', 'buckwheat'].indexOf(b.id!)]}: промойте и отварите`} ${b.t} минут.`, `Pagrindas — ${b.id === 'potatoes' ? 'bulvės: supjaustykite kubeliais ir virkite' : `${['kinva', 'bulguras', 'ryžiai', 'grikiai'][['quinoa', 'bulgur', 'rice', 'buckwheat'].indexOf(b.id!)]}: nuplaukite ir virkite`} ${b.t} min.`),
      p.cook ? S(p.cook, `${p.nom[0]}: ${p.id === 'egg' || p.id === 'feta' ? 'сварите яйца вкрутую 8 минут и разрежьте пополам' : 'посолите и обжарьте на сковороде, затем нарежьте'}.`, `${p.nom[1]}: ${p.id === 'egg' || p.id === 'feta' ? 'kietai išvirkite kiaušinius 8 min. ir perpjaukite' : 'pasūdykite ir apkepkite keptuvėje, tada supjaustykite'}.`)
        : S(0, `${p.nom[0]}: откройте банку, слейте жидкость${p.id === 'tuna' ? '' : ' и промойте'}.`, `${p.nom[1]}: atidarykite skardinę, nupilkite skystį${p.id === 'tuna' ? '' : ' ir nuplaukite'}.`),
      S(0, `Овощи — ${v.nom[0]}: нарежьте.`, `Daržovės — ${v.nom[1]}: supjaustykite.`),
      yogurt
        ? S(0, 'Заправка: смешайте йогурт с лимонным соком, солью и перцем.', 'Padažas: jogurtą sumaišykite su citrinos sultimis, druska ir pipirais.')
        : S(0, 'Заправка: смешайте масло с лимонным соком, солью и перцем.', 'Padažas: aliejų sumaišykite su citrinos sultimis, druska ir pipirais.'),
      S(0, 'Соберите в миске основу, овощи и белок, полейте заправкой.', 'Dubenyje sudėkite pagrindą, daržoves ir baltymus, užpilkite padažu.'),
    ];
    const cook = Math.max(b.t, p.cook) + 5;
    all.push({
      photo: pickBy(id, p.photo),
      recipe: { id, ru: `Боул с ${p.w[0]}, ${and(b.w[0], v.w[0], 0)}`, lt: `Dubenėlis su ${p.w[1]}, ${and(b.w[1], v.w[1], 1)}`, emoji: '🥗', meal: 'dinner', cuisine: 'mediterranean', minutes: 10 + cook, equipment: ['stove'], spice: 0, items, stepsLt: [], stepsRu: [] },
      detail: { level: 1, prep: 10, cook, steps, tip: ['Основу сварите заранее — тогда ужин соберётся за 5 минут.', 'Pagrindą išvirkite iš anksto — vakarienė bus paruošta per 5 min.'] },
    });
  }
  return sample('bowls', all, 150);
}

// ---------- 4. Pasta ----------
const PASTA_P: { id: string; items: [string, number][]; w: L; nom: L; t: number }[] = [
  { id: 'chicken', items: [['chicken_breast', 110]], w: ['курицей', 'vištiena'], nom: ['Куриное филе', 'Vištienos filė'], t: 6 },
  { id: 'turkey', items: [['turkey_mince', 110]], w: ['индейкой', 'kalakutiena'], nom: ['Фарш индейки', 'Kalakutienos faršas'], t: 6 },
  { id: 'beef', items: [['beef_mince', 100]], w: ['говядиной', 'jautiena'], nom: ['Говяжий фарш', 'Jautienos faršas'], t: 6 },
  { id: 'shrimp', items: [['shrimp', 120]], w: ['креветками', 'krevetėmis'], nom: ['Креветки', 'Krevetės'], t: 3 },
  { id: 'tuna', items: [['tuna_can', 100]], w: ['тунцом', 'tunu'], nom: ['Тунец', 'Tunas'], t: 0 },
  { id: 'chickpea', items: [['chickpeas', 120]], w: ['нутом', 'avinžirniais'], nom: ['Нут', 'Avinžirniai'], t: 0 },
  { id: 'feta', items: [['feta', 40]], w: ['фетой', 'feta'], nom: ['Фета', 'Feta'], t: 0 },
];
const PASTA_V = VEG.filter((v) => ['zucchini', 'pepper', 'mushrooms', 'broccoli', 'spinach', 'peas', 'pumpkin'].includes(v.key));
function pastas(): Gen[] {
  const out: Gen[] = [];
  for (const p of PASTA_P) for (const v of PASTA_V) for (const sauce of ['tomato', 'yogurt'] as const) {
    const id = `g_pasta_${p.id}_${v.key}_${sauce}`;
    const items: [string, number][] = [['pasta', 80], ...p.items, ...v.items.map(([i, g]) => [i, Math.round(g * 0.8)] as [string, number]), ['garlic', 4], ['olive_oil', 5],
      sauce === 'tomato' ? ['canned_tomatoes', 150] : ['natural_yogurt', 80]];
    const steps: Step[] = [
      S(10, 'Паста: отварите в подсоленной воде по времени на упаковке. Сохраните половник воды.', 'Makaronai: išvirkite pasūdytame vandenyje pagal pakuotę. Pasilikite samtį vandens.'),
      p.t ? S(p.t, `${p.nom[0]}: обжарьте на масле с чесноком ${p.t} минут.`, `${p.nom[1]}: pakepinkite aliejuje su česnaku ${p.t} min.`) : S(1, 'Прогрейте чеснок на масле 1 минуту.', 'Pakaitinkite česnaką aliejuje 1 min.'),
      S(5, `Овощи — ${v.nom[0]}: нарежьте, добавьте и жарьте 5 минут.`, `Daržovės — ${v.nom[1]}: supjaustykite, sudėkite ir kepkite 5 min.`),
      sauce === 'tomato'
        ? S(6, `Влейте томаты, посолите и тушите 6 минут.${p.t ? '' : ` ${p.nom[0]}: добавьте в соус.`}`, `Supilkite pomidorus, pasūdykite ir troškinkite 6 min.${p.t ? '' : ` ${p.nom[1]}: sudėkite į padažą.`}`)
        : S(0, `Снимите с огня и вмешайте йогурт с ложкой воды от пасты.${p.t ? '' : ` ${p.nom[0]}: добавьте в соус.`}`, `Nukelkite nuo ugnies ir įmaišykite jogurtą su šaukštu makaronų vandens.${p.t ? '' : ` ${p.nom[1]}: sudėkite į padažą.`}`),
      S(0, 'Смешайте соус с пастой и сразу подавайте.', 'Sumaišykite padažą su makaronais ir iškart patiekite.'),
    ];
    out.push({
      photo: pickBy(id, sauce === 'tomato' ? ['pasta_beef', 'turkey_pasta', 'pasta_veg', 'pasta_shrimp'] : ['pasta_chicken_mush']),
      recipe: { id, ru: `Паста с ${and(p.w[0], v.w[0], 0)} в ${sauce === 'tomato' ? 'томатном' : 'йогуртово-чесночном'} соусе`, lt: `Makaronai su ${and(p.w[1], v.w[1], 1)} ${sauce === 'tomato' ? 'pomidorų' : 'jogurto ir česnako'} padaže`,
        emoji: '🍝', meal: 'lunch', cuisine: 'italian', minutes: 25, equipment: ['stove'], spice: 0, items, stepsLt: [], stepsRu: [] },
      detail: { level: 1, prep: 5, cook: 20, steps, tip: ['Вода от пасты с крахмалом делает соус гладким и связывает его с пастой.', 'Krakmolingas makaronų vanduo padažą padaro vientisą ir sujungia su makaronais.'] },
    });
  }
  return out;
}

// ---------- 5. Breakfasts ----------
function breakfasts(): Gen[] {
  const out: Gen[] = [];
  const grains: { id: string; adj: L; t: number; photo: string }[] = [
    { id: 'oats', adj: ['Овсяная каша', 'Avižinė košė'], t: 6, photo: 'oat_berries' },
    { id: 'buckwheat', adj: ['Гречневая каша', 'Grikių košė'], t: 15, photo: 'oat_berries' },
    { id: 'rice', adj: ['Рисовая каша', 'Ryžių košė'], t: 20, photo: 'oat_berries' },
    { id: 'quinoa', adj: ['Каша из киноа', 'Kinvos košė'], t: 15, photo: 'oat_berries' },
  ];
  const tops: { items: [string, number][]; w: L }[] = [
    { items: [['berries', 80]], w: ['ягодами', 'uogomis'] },
    { items: [['banana', 100], ['walnuts', 10]], w: ['бананом и орехами', 'bananu ir riešutais'] },
    { items: [['apple', 120], ['honey', 8]], w: ['яблоком и мёдом', 'obuoliu ir medumi'] },
    { items: [['pear', 120], ['sunflower_seeds', 10]], w: ['грушей и семечками', 'kriauše ir saulėgrąžomis'] },
    { items: [['banana', 100], ['peanut_butter', 15]], w: ['бананом и арахисовой пастой', 'bananu ir žemės riešutų kremu'] },
    { items: [['berries', 60], ['greek_yogurt', 100]], w: ['ягодами и йогуртом', 'uogomis ir jogurtu'] },
    { items: [['orange', 120], ['honey', 8]], w: ['апельсином и мёдом', 'apelsinu ir medumi'] },
  ];
  for (const g of grains) for (const milk of [true, false]) for (const tp of tops) {
    const id = `g_porridge_${g.id}_${milk ? 'milk' : 'water'}_${tp.items.map((x) => x[0]).join('_')}`;
    const items: [string, number][] = [[g.id, 60], ...(milk ? [['milk', 200] as [string, number]] : []), ...tp.items];
    out.push({
      photo: pickBy(id, ['oat_berries', 'yogurt_nuts', 'curd_honey']),
      recipe: { id, ru: `${g.adj[0]} на ${milk ? 'молоке' : 'воде'} с ${tp.w[0]}`, lt: `${g.adj[1]} su ${milk ? 'pienu' : 'vandeniu'}, ${tp.w[1]}`, emoji: '🥣', meal: 'breakfast', cuisine: 'home',
        minutes: g.t + 5, equipment: ['stove'], spice: 0, breakfastStyle: 'sweet', items, stepsLt: [], stepsRu: [] },
      detail: { level: 1, prep: 3, cook: g.t, steps: [
        S(0, `Доведите до кипения ${milk ? '200 мл молока' : '250 мл воды'} со щепоткой соли.`, `Užvirinkite ${milk ? '200 ml pieno' : '250 ml vandens'} su žiupsneliu druskos.`),
        S(g.t, `Всыпьте крупу и варите на слабом огне ${g.t} минут, помешивая.`, `Suberkite kruopas ir virkite ant silpnos ugnies ${g.t} min., maišydami.`),
        S(0, 'Снимите с огня и дайте постоять 2 минуты под крышкой.', 'Nukelkite nuo ugnies ir palikite uždengę 2 min.'),
        S(0, 'Переложите в тарелку и добавьте топпинги сверху.', 'Sudėkite į lėkštę ir ant viršaus dėkite priedus.'),
      ], tip: ['Крупу можно залить с вечера — утром каша сварится в 2 раза быстрее.', 'Kruopas galima užpilti iš vakaro — ryte košė išvirs dvigubai greičiau.'] },
    });
  }
  const omVeg: { id: string; g: number; w: L; nom: L }[] = [
    { id: 'spinach', g: 60, w: ['шпинатом', 'špinatais'], nom: ['шпинат', 'špinatai'] }, { id: 'tomato', g: 120, w: ['помидором', 'pomidoru'], nom: ['помидор', 'pomidoras'] },
    { id: 'bell_pepper', g: 100, w: ['перцем', 'paprika'], nom: ['перец', 'paprika'] }, { id: 'zucchini', g: 120, w: ['кабачком', 'cukinija'], nom: ['кабачок', 'cukinija'] },
    { id: 'mushrooms', g: 100, w: ['грибами', 'grybais'], nom: ['грибы', 'grybai'] }, { id: 'broccoli', g: 100, w: ['брокколи', 'brokoliais'], nom: ['брокколи', 'brokoliai'] },
    { id: 'green_peas', g: 70, w: ['горошком', 'žirneliais'], nom: ['горошек', 'žirneliai'] },
  ];
  const cheeses: { id: string | null; g: number; w: L }[] = [{ id: 'cheese', g: 15, w: [', сыром', ', sūriu'] }, { id: 'feta', g: 30, w: [', фетой', ', feta'] }, { id: null, g: 0, w: ['', ''] }];
  const sides: { id: string; g: number; w: L }[] = [{ id: 'rye_bread', g: 50, w: ['ржаным хлебом', 'rugine duona'] }, { id: 'potatoes', g: 150, w: ['картофелем', 'bulvėmis'] }];
  for (const v of omVeg) for (const c of cheeses) for (const sd of sides) {
    const id = `g_omelette_${v.id}_${c.id ?? 'none'}_${sd.id}`;
    const items: [string, number][] = [['eggs', 120], [v.id, v.g], [sd.id, sd.g], ['milk', 30]];
    if (c.id) items.push([c.id, c.g]);
    out.push({
      photo: pickBy(id, ['omelette_veg', 'shakshuka', 'egg_bake', 'eggs_avocado']),
      recipe: { id, ru: `Омлет с ${v.w[0]}${c.w[0]} и ${sd.w[0]}`, lt: `Omletas su ${v.w[1]}${c.w[1]} ir ${sd.w[1]}`, emoji: '🍳', meal: 'breakfast', cuisine: 'home',
        minutes: sd.id === 'potatoes' ? 25 : 12, equipment: ['stove'], spice: 0, breakfastStyle: 'savory', items, stepsLt: [], stepsRu: [] },
      detail: { level: 1, prep: 5, cook: sd.id === 'potatoes' ? 20 : 8, steps: [
        sd.id === 'potatoes' ? S(15, 'Картофель нарежьте кубиками и отварите 15 минут.', 'Bulves supjaustykite kubeliais ir virkite 15 min.') : S(2, 'Подсушите ржаной хлеб на сухой сковороде.', 'Paskrudinkite ruginę duoną sausoje keptuvėje.'),
        S(0, 'Взбейте яйца с молоком и щепоткой соли.', 'Išplakite kiaušinius su pienu ir žiupsneliu druskos.'),
        S(3, `Овощи — ${v.nom[0]}: нарежьте и обжарьте на сковороде 3 минуты.`, `Daržovės — ${v.nom[1]}: supjaustykite ir pakepinkite keptuvėje 3 min.`),
        S(5, `Залейте яйцами, ${c.id ? 'посыпьте сыром, ' : ''}накройте крышкой и готовьте 5 минут на слабом огне.`, `Užpilkite kiaušiniais, ${c.id ? 'pabarstykite sūriu, ' : ''}uždenkite ir kepkite 5 min. ant silpnos ugnies.`),
        S(0, 'Подавайте с гарниром.', 'Patiekite su garnyru.'),
      ], tip: ['Омлет под крышкой на слабом огне получается пышным и не подгорает.', 'Uždengtas ant silpnos ugnies omletas būna purus ir nepridega.'] },
    });
  }
  const dairy: { id: string; g: number; nom: L }[] = [{ id: 'cottage_cheese', g: 180, nom: ['Творог', 'Varškė'] }, { id: 'greek_yogurt', g: 200, nom: ['Греческий йогурт', 'Graikiškas jogurtas'] }, { id: 'natural_yogurt', g: 200, nom: ['Натуральный йогурт', 'Natūralus jogurtas'] }];
  const fruit: { id: string; g: number; w: L }[] = [{ id: 'berries', g: 80, w: ['ягодами', 'uogomis'] }, { id: 'banana', g: 100, w: ['бананом', 'bananu'] }, { id: 'apple', g: 120, w: ['яблоком', 'obuoliu'] }, { id: 'pear', g: 120, w: ['грушей', 'kriauše'] }, { id: 'orange', g: 120, w: ['апельсином', 'apelsinu'] }];
  const crunch: { id: string; g: number; w: L; nom: L }[] = [
    { id: 'oats', g: 30, w: ['овсяными хлопьями', 'avižiniais dribsniais'], nom: ['овсяные хлопья', 'avižiniai dribsniai'] },
    { id: 'walnuts', g: 15, w: ['орехами', 'riešutais'], nom: ['орехи', 'riešutai'] },
    { id: 'sunflower_seeds', g: 12, w: ['семечками', 'saulėgrąžomis'], nom: ['семечки', 'saulėgrąžos'] },
    { id: 'honey', g: 10, w: ['мёдом', 'medumi'], nom: ['мёд', 'medus'] },
  ];
  for (const dy of dairy) for (const f of fruit) for (const c of crunch) {
    const id = `g_dairy_${dy.id}_${f.id}_${c.id}`;
    out.push({
      photo: pickBy(id, ['curd_honey', 'yogurt_nuts']),
      recipe: { id, ru: `${dy.nom[0]} с ${f.w[0]} и ${c.w[0]}`, lt: `${dy.nom[1]} su ${f.w[1]} ir ${c.w[1]}`, emoji: '🥛', meal: 'breakfast', cuisine: 'home',
        minutes: 5, equipment: [], spice: 0, breakfastStyle: 'sweet', items: [[dy.id, dy.g], [f.id, f.g], [c.id, c.g]], stepsLt: [], stepsRu: [] },
      detail: { level: 1, prep: 5, cook: 0, steps: [
        S(0, `${dy.nom[0]}: выложите в миску${dy.id === 'cottage_cheese' ? ' и разомните вилкой' : ''}.`, `${dy.nom[1]}: sudėkite į dubenėlį${dy.id === 'cottage_cheese' ? ' ir sutrinkite šakute' : ''}.`),
        S(0, 'Нарежьте фрукты и выложите сверху.', 'Supjaustykite vaisius ir sudėkite ant viršaus.'),
        S(0, `Сверху добавьте: ${c.nom[0]}. Подавайте сразу.`, `Ant viršaus: ${c.nom[1]}. Patiekite iškart.`),
      ], tip: ['Хрустящую добавку кладите прямо перед едой — она не размокнет.', 'Traškų priedą dėkite prieš pat valgį — jis nesuminkštės.'] },
    });
  }
  return out;
}

// ---------- 6. Snacks ----------
function snacks(): Gen[] {
  const out: Gen[] = [];
  const fruit: { id: string; g: number; nom: L; w: L }[] = [
    { id: 'apple', g: 150, nom: ['Яблоко', 'Obuolys'], w: ['яблоком', 'obuoliu'] }, { id: 'banana', g: 110, nom: ['Банан', 'Bananas'], w: ['бананом', 'bananu'] },
    { id: 'pear', g: 150, nom: ['Груша', 'Kriaušė'], w: ['грушей', 'kriauše'] }, { id: 'orange', g: 160, nom: ['Апельсин', 'Apelsinas'], w: ['апельсином', 'apelsinu'] },
    { id: 'berries', g: 120, nom: ['Ягоды', 'Uogos'], w: ['ягодами', 'uogomis'] },
  ];
  const withs: { items: [string, number][]; w: L; t: L }[] = [
    { items: [['kefir', 200]], w: ['кефир', 'kefyras'], t: ['Кефир с', 'Kefyras su'] },
    { items: [['natural_yogurt', 150]], w: ['йогурт', 'jogurtas'], t: ['Йогурт с', 'Jogurtas su'] },
    { items: [['cottage_cheese', 100]], w: ['творог', 'varškė'], t: ['Творог с', 'Varškė su'] },
    { items: [['walnuts', 15]], w: ['орехи', 'riešutai'], t: ['Орехи и', 'Riešutai ir'] },
    { items: [['peanut_butter', 15]], w: ['арахисовая паста', 'žemės riešutų kremas'], t: ['Арахисовая паста с', 'Žemės riešutų kremas su'] },
    { items: [['sunflower_seeds', 15]], w: ['семечки', 'saulėgrąžos'], t: ['Семечки и', 'Saulėgrąžos ir'] },
  ];
  for (const f of fruit) for (const w of withs) {
    const id = `g_snack_${f.id}_${w.items[0][0]}`;
    const and = w.t[0].endsWith(' и');
    out.push({
      photo: pickBy(id, ['apple_walnuts', 'curd_honey', 'kefir_banana', 'yogurt_nuts']),
      recipe: { id, ru: and ? `${f.nom[0]} и ${w.w[0]}` : `${w.t[0]} ${f.w[0]}`, lt: and ? `${f.nom[1]} ir ${w.w[1]}` : `${w.t[1]} ${f.w[1]}`, emoji: '🍎', meal: 'snack', cuisine: 'home',
        minutes: 3, equipment: [], spice: 0, items: [[f.id, f.g], ...w.items], stepsLt: [], stepsRu: [] },
      detail: { level: 1, prep: 3, cook: 0, steps: [S(0, 'Вымойте и нарежьте фрукты.', 'Nuplaukite ir supjaustykite vaisius.'), S(0, `Подавайте вместе: ${w.w[0]}.`, `Patiekite kartu: ${w.w[1]}.`)],
        tip: ['Перекус между приёмами пищи помогает не переедать за ужином.', 'Užkandis tarp valgymų padeda nepersivalgyti vakarienės metu.'] },
    });
  }
  return out;
}

// ---------- build ----------
const ALL: Gen[] = [...mains(), ...soups(), ...bowls(), ...pastas(), ...breakfasts(), ...snacks()];

export const GENERATED_RECIPES: Recipe[] = ALL.map((g) => g.recipe);
export const GENERATED_DETAILS: Record<string, RecipeDetail> = Object.fromEntries(ALL.map((g) => [g.recipe.id, g.detail]));
export const GENERATED_PHOTOS: Record<string, string> = Object.fromEntries(ALL.map((g) => [g.recipe.id, g.photo]));
export type { MealType };
