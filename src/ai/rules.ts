import { blankAction, type Action, type Intent } from './intent';

/**
 * Deterministic natural-language parser (LT / RU / EN). Default provider and the
 * fallback when an AI provider is not configured, fails or refuses.
 */
const low = (s: string) => s.toLowerCase().normalize('NFC');

const DAYS: [RegExp, number][] = [
  [/pirmad|понедельн|monday|(?<!\p{L})mon(?!\p{L})|(?<!\p{L})пн(?!\p{L})/u, 0], [/antrad|вторник|tuesday|(?<!\p{L})tue(?!\p{L})|(?<!\p{L})вт(?!\p{L})/u, 1], [/trečiad|treciad|сред[аеуы]|wednesday|(?<!\p{L})wed(?!\p{L})|(?<!\p{L})ср(?!\p{L})/u, 2],
  [/ketvirtad|четверг|thursday|(?<!\p{L})thu(?!\p{L})|(?<!\p{L})чт(?!\p{L})/u, 3], [/penktad|пятниц|friday|(?<!\p{L})fri(?!\p{L})|(?<!\p{L})пт(?!\p{L})/u, 4], [/šeštad|sestad|суббот|saturday|(?!\p{L})sat(?!\p{L})|(?<!\p{L})сб(?!\p{L})/u, 5],
  [/sekmad|воскресен|sunday|(?<!\p{L})sun(?!\p{L})|(?<!\p{L})вс(?!\p{L})/u, 6],
];
const MEAL: [RegExp, Action['meal']][] = [
  [/pusryč|pusryc|завтрак|breakfast/, 'breakfast'], [/piet[ūu]s|pietum|pietų|обед|lunch/, 'lunch'],
  [/vakarien|ужин|dinner|supper/, 'dinner'], [/užkand|uzkand|перекус|snack/, 'snack'],
];
const EXCL: [RegExp, NonNullable<Action['exclusion']>][] = [
  [/žuv|zuv|рыб|fish|seafood/, 'fish'], [/kiaul|свин|pork/, 'pork'], [/gryb|гриб|mushroom/, 'mushrooms'],
  [/pien|lakto|молок|молочн|лактоз|dairy|lactose|milk/, 'dairy'], [/glit|глютен|gluten/, 'gluten'],
];
const STORE_RE: [RegExp, NonNullable<Action['stores']>[number]][] = [
  [/maxim/, 'maxima'], [/barbor/, 'barbora'], [/rimi|рими/, 'rimi'], [/lidl|лидл/, 'lidl'], [/(?<!\p{L})iki(?!\p{L})|ики/u, 'iki'],
];
const WORD_NUM: Record<string, number> = { vienam: 1, одного: 1, one: 1, dviem: 2, двоих: 2, двух: 2, two: 2, trims: 3, троих: 3, трёх: 3, трех: 3, three: 3, keturiems: 4, четверых: 4, four: 4, penkiems: 5, пятерых: 5, five: 5 };

const has = (s: string, re: RegExp) => re.test(s);
const num = (s: string) => Number(s.replace(',', '.'));

export function parseRules(message: string, today: number): Intent {
  const s = low(message);
  const actions: Action[] = [];

  let day: number | null = null;
  if (has(s, /šiandien|siandien|сегодня|today/)) day = today;
  else if (has(s, /poryt|послезавтра/)) day = (today + 2) % 7;
  else if (has(s, /rytoj|завтра|tomorrow/)) day = (today + 1) % 7;
  else for (const [re, d] of DAYS) if (re.test(s)) { day = d; break; }
  const meal = MEAL.find(([re]) => re.test(s))?.[1] ?? null;

  const wantsCheaper = has(s, /pigiau|pigesn|pigų|дешевл|подешевле|бюджетн|cheaper|cheap/);
  const wantsProtein = has(s, /baltym|белк|белок|protein/);
  const wantsVeg = has(s, /vegetar|вегетариан|meatless|be mėsos|без мяса/);
  const wantsVegan = has(s, /vegan|веган/);
  const wantsReplace = has(s, /pakeis|keisk|kit[ąaus]|замен|помен|друг|replace|change|swap|another|different/);
  const wantsRegen = has(s, /visus|visą dieną|все блюда|весь день|whole day|all meals|kitus patiekalus|другие блюда|new menu|naują meniu|новое меню|regenerat/);

  // --- explicit numbers ---
  const kcal = s.match(/(\d{3,4})\s*(kcal|ккал|kalor|калор|cal)/);
  if (kcal) actions.push({ ...blankAction('set_targets'), kcal: num(kcal[1]) });
  const prot = s.match(/(\d{2,3})\s*(g|г|гр)\.?\s*(baltym|белк|protein)/) ?? s.match(/(baltym\w*|белк\w*|protein)\D{0,6}(\d{2,3})\s*(g|г)/);
  if (prot) actions.push({ ...blankAction('set_targets'), protein: num(prot[1].match(/\d/) ? prot[1] : prot[2]) });
  const budget = s.match(/(\d{2,3}(?:[.,]\d{1,2})?)\s*(€|eur|евро|euro)/) ?? s.match(/(€)\s*(\d{2,3})/);
  if (budget) actions.push({ ...blankAction('set_budget'), budget: num(budget[1] === '€' ? budget[2] : budget[1]) });

  // --- household ---
  const hh = s.match(/(\d)\s*(žmon|zmon|asmen|человек|чел|people|persons|portions|porc)/);
  const hw = Object.entries(WORD_NUM).find(([w]) => new RegExp(`(?:^|\\s)(?:(?:для|на|for)\\s+)${/^(dviem|trims|keturiems|penkiems|vienam)$/.test(w) ? '?' : ''}${w}(?!\\p{L})`, 'u').test(s));
  if (hh) actions.push({ ...blankAction('set_household'), household: Number(hh[1]) });
  else if (hw) actions.push({ ...blankAction('set_household'), household: hw[1] });

  // --- meals per day / time ---
  const mpd = s.match(/([345])\s*(kart|раз|meals|valgym|приём|прием)/);
  if (mpd) actions.push({ ...blankAction('set_meals_per_day'), value: Number(mpd[1]) });
  const time = s.match(/(15|30|60)\s*(min|мин)/);
  if (time && has(s, /gamin|готов|cook|laik|врем/)) actions.push({ ...blankAction('set_cooking_time'), value: Number(time[1]) });

  // --- stores ---
  const stores = STORE_RE.filter(([re]) => re.test(s)).map(([, id]) => id);
  if (stores.length && has(s, /(?<!\p{L})tik(?!\p{L})|только|(?<!\p{L})only(?!\p{L})|tik iš|tik per|только в|покупаю в|perku/u)) actions.push({ ...blankAction('set_stores'), stores });

  // --- exclusions ---
  if (has(s, /(?<!\p{L})be(?!\p{L})|без|without|no |nevalg|не ем|не ест|negaliu|аллерг|alerg/u)) {
    for (const [re, e] of EXCL) if (re.test(s)) actions.push({ ...blankAction('exclude'), exclusion: e });
  }

  // --- meal changes ---
  const mode: Action['mode'] = wantsCheaper ? 'cheaper' : wantsVeg || wantsVegan ? 'vegetarian' : wantsProtein && !prot ? 'protein' : 'any';
  if (meal && (wantsReplace || wantsCheaper || wantsVeg || (wantsProtein && !prot))) {
    actions.push({ ...blankAction('replace_meal'), day: day ?? today, meal, mode });
  } else if (wantsRegen || (day !== null && wantsReplace)) {
    actions.push({ ...blankAction('regenerate_day'), day: day ?? today });
  } else if (wantsCheaper && day !== null) {
    actions.push({ ...blankAction('replace_meal'), day, meal: null, mode: 'cheaper' });
  } else {
    if (wantsVegan) actions.push({ ...blankAction('set_diet'), diet: 'vegan' });
    else if (wantsVeg) actions.push({ ...blankAction('set_diet'), diet: 'vegetarian' });
    if (wantsProtein && !prot && has(s, /daugiau|больше|more|increase|padidin|увелич/)) actions.push({ ...blankAction('set_targets'), proteinFactor: 1.2 });
    if (wantsCheaper && !budget) actions.push({ ...blankAction('replace_meal'), day: null, meal: null, mode: 'cheaper' });
  }
  return { actions, reply: null };
}
