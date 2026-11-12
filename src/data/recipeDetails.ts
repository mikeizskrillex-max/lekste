/**
 * Step-by-step cooking instructions for every recipe (per the recipe's base
 * portion). Each step: [minutes for a timer (0 = no timer), Russian, Lithuanian].
 * Written with AI help; a cook should proof-read them, and a native speaker the
 * Lithuanian text, before launch.
 */
export type Step = [minutes: number, ru: string, lt: string];
export interface RecipeDetail {
  level: 1 | 2 | 3;
  prep: number;
  cook: number;
  steps: Step[];
  tip: [ru: string, lt: string];
}

const d = (level: 1 | 2 | 3, prep: number, cook: number, steps: Step[], tip: [string, string]): RecipeDetail => ({ level, prep, cook, steps, tip });

export const DETAILS: Record<string, RecipeDetail> = {
  // ---------------- Breakfasts ----------------
  oat_berries: d(1, 2, 8, [
    [0, 'Налейте молоко в небольшую кастрюлю и доведите почти до кипения на среднем огне.', 'Supilkite pieną į nedidelį puodą ir vidutine ugnimi beveik užvirinkite.'],
    [5, 'Всыпьте овсяные хлопья, убавьте огонь и варите, помешивая, 5 минут до густоты.', 'Suberkite avižinius dribsnius, sumažinkite ugnį ir virkite maišydami 5 min., kol sutirštės.'],
    [0, 'Снимите с огня, вмешайте половину ягод — каша станет розовой и ароматной.', 'Nukelkite nuo ugnies, įmaišykite pusę uogų — košė taps rausva ir kvapni.'],
    [0, 'Переложите в тарелку, сверху выложите греческий йогурт и оставшиеся ягоды.', 'Sudėkite į lėkštę, ant viršaus dėkite graikišką jogurtą ir likusias uogas.'],
  ], ['Замороженные ягоды можно не размораживать — они остудят кашу до приятной температуры.', 'Šaldytų uogų atšildyti nereikia — jos atvėsins košę iki malonios temperatūros.']),
  syrniki: d(2, 10, 10, [
    [0, 'Измельчите овсяные хлопья в блендере или кофемолке в муку.', 'Avižinius dribsnius sumalkite trintuve arba kavamale į miltus.'],
    [0, 'Разомните творог вилкой, добавьте яйцо и овсяную муку, перемешайте до однородности.', 'Varškę sutrinkite šakute, įmuškite kiaušinį, suberkite avižų miltus ir išmaišykite.'],
    [0, 'Влажными руками сформируйте 4–5 сырников толщиной около 1,5 см.', 'Drėgnomis rankomis suformuokite 4–5 varškėčius, maždaug 1,5 cm storio.'],
    [4, 'Обжарьте на сковороде с антипригарным покрытием без масла на среднем огне по 4 минуты с каждой стороны.', 'Kepkite nepridegančioje keptuvėje be aliejaus vidutine ugnimi po 4 min. iš abiejų pusių.'],
    [0, 'Подавайте с греческим йогуртом и мёдом.', 'Patiekite su graikišku jogurtu ir medumi.'],
  ], ['Если тесто липнет к рукам — добавьте ещё ложку овсяной муки. Сухой творог даёт самые ровные сырники.', 'Jei tešla limpa prie rankų, įberkite dar šaukštą avižų miltų. Sausa varškė — patys gražiausi varškėčiai.']),
  omelette_veg: d(1, 3, 7, [
    [0, 'Подсушите ломтики ржаного хлеба в тостере или на сухой сковороде.', 'Ruginės duonos riekes paskrudinkite skrudintuve arba sausoje keptuvėje.'],
    [1, 'На той же сковороде за 1 минуту прогрейте шпинат, пока он не опадёт. Посолите.', 'Toje pačioje keptuvėje 1 min. pakaitinkite špinatus, kol suminkštės. Pasūdykite.'],
    [4, 'Отодвиньте шпинат, разбейте яйца и жарьте 3–4 минуты под крышкой — желток останется жидким.', 'Pastumkite špinatus, įmuškite kiaušinius ir kepkite uždengę 3–4 min. — trynys liks skystas.'],
    [0, 'Выложите шпинат и яйца на хлеб, посыпьте тёртым сыром, рядом — дольки помидора.', 'Dėkite špinatus ir kiaušinius ant duonos, pabarstykite tarkuotu sūriu, šalia — pomidorų skiltelės.'],
  ], ['Щепотка чёрного перца и сушёного орегано делает простую яичницу ресторанной.', 'Žiupsnelis juodųjų pipirų ir džiovinto raudonėlio paprastą kiaušinienę padaro restoranine.']),
  curd_toast: d(1, 5, 3, [
    [3, 'Подсушите хлеб в тостере до хруста.', 'Paskrudinkite duoną skrudintuve, kol taps traški.'],
    [0, 'Разомните авокадо вилкой с щепоткой соли и каплей лимонного сока.', 'Avokadą sutrinkite šakute su žiupsneliu druskos ir lašu citrinos sulčių.'],
    [0, 'Намажьте хлеб творогом, сверху выложите авокадо.', 'Duoną užtepkite varške, ant viršaus dėkite avokadą.'],
    [0, 'Украсьте ломтиками помидора, посыпьте перцем.', 'Papuoškite pomidorų griežinėliais, pabarstykite pipirais.'],
  ], ['Спелое авокадо слегка продавливается пальцем. Твёрдое дозреет за 2 дня рядом с бананом.', 'Prinokęs avokadas lengvai įsispaudžia pirštu. Kietas sunoks per 2 dienas šalia banano.']),
  eggs_avocado: d(1, 5, 15, [
    [12, 'Картофель нарежьте кубиками 2 см и отварите в подсоленной воде 12 минут.', 'Bulves supjaustykite 2 cm kubeliais ir virkite pasūdytame vandenyje 12 min.'],
    [8, 'Одновременно сварите яйца: 8 минут после закипания, затем остудите в холодной воде.', 'Tuo pat metu išvirkite kiaušinius: 8 min. nuo užvirimo, tada atvėsinkite šaltame vandenyje.'],
    [0, 'Нарежьте авокадо ломтиками, яйца — пополам.', 'Avokadą supjaustykite griežinėliais, kiaušinius — perpus.'],
    [0, 'Выложите на тарелку шпинат, картофель, яйца и авокадо. Посолите, поперчите.', 'Į lėkštę dėkite špinatus, bulves, kiaušinius ir avokadą. Pasūdykite, papipirinkite.'],
  ], ['Картофель можно сварить с вечера — утром завтрак соберётся за 5 минут.', 'Bulves galima išvirti vakare — ryte pusryčiai bus paruošti per 5 minutes.']),
  tofu_scramble: d(1, 5, 15, [
    [15, 'Промойте рис и отварите его в 2 раза большем количестве воды 15 минут.', 'Ryžius nuplaukite ir virkite dvigubai didesniame kiekyje vandens 15 min.'],
    [0, 'Тофу промокните бумажным полотенцем и нарежьте кубиками.', 'Tofu nusausinkite popieriniu rankšluosčiu ir supjaustykite kubeliais.'],
    [6, 'Обжарьте тофу на сухой сковороде 6 минут до золотистой корочки.', 'Tofu kepkite sausoje keptuvėje 6 min., kol paruduos.'],
    [0, 'Соберите боул: рис, шпинат, тофу, ломтики авокадо и помидора.', 'Surinkite dubenėlį: ryžiai, špinatai, tofu, avokado ir pomidorų griežinėliai.'],
  ], ['Капля соевого соуса и кунжут сделают тофу ярче по вкусу.', 'Lašas sojų padažo ir sezamas tofu suteiks ryškesnį skonį.']),
  banana_pancakes: d(1, 5, 10, [
    [0, 'Разомните банан вилкой в пюре.', 'Bananą sutrinkite šakute į tyrę.'],
    [0, 'Добавьте яйца и овсяные хлопья, перемешайте и дайте постоять 5 минут.', 'Įmuškite kiaušinius, suberkite dribsnius, išmaišykite ir palikite 5 min.'],
    [2, 'Выкладывайте по столовой ложке теста на разогретую сковороду, жарьте по 2 минуты с каждой стороны.', 'Šaukštu dėkite tešlą į įkaitintą keptuvę, kepkite po 2 min. iš abiejų pusių.'],
    [0, 'Подавайте стопкой с йогуртом и черникой.', 'Patiekite krūvele su jogurtu ir mėlynėmis.'],
  ], ['Переворачивайте блин, когда на поверхности появились пузырьки — так он не порвётся.', 'Blyną verskite, kai paviršiuje atsiras burbuliukų — tada jis nesuplyš.']),
  buckwheat_porridge: d(2, 5, 12, [
    [0, 'Смелите гречку в блендере или кофемолке в муку.', 'Grikius sumalkite trintuve arba kavamale į miltus.'],
    [0, 'Смешайте гречневую муку с молоком и яйцом до консистенции густой сметаны. Посолите щепоткой.', 'Grikių miltus sumaišykite su pienu ir kiaušiniu iki tirštos grietinės konsistencijos. Įberkite žiupsnelį druskos.'],
    [2, 'Жарьте небольшие блинчики на разогретой сковороде по 2 минуты с каждой стороны.', 'Kepkite nedidelius blynelius įkaitintoje keptuvėje po 2 min. iš abiejų pusių.'],
    [0, 'Подавайте с ломтиками банана и ягодами.', 'Patiekite su banano griežinėliais ir uogomis.'],
  ], ['Гречка без глютена — этот завтрак подходит при непереносимости глютена.', 'Grikiuose nėra glitimo — šie pusryčiai tinka netoleruojantiems glitimo.']),
  rice_porridge_vegan: d(2, 5, 12, [
    [0, 'Смелите рис в муку, добавьте половину банана и 100 мл воды, взбейте блендером.', 'Ryžius sumalkite į miltus, sudėkite pusę banano ir 100 ml vandens, išplakite trintuvu.'],
    [0, 'Дайте тесту постоять 5 минут — оно немного загустеет.', 'Palikite tešlą 5 min. — ji šiek tiek sutirštės.'],
    [3, 'Жарьте небольшие блинчики на смазанной маслом сковороде по 2–3 минуты с каждой стороны.', 'Kepkite nedidelius blynelius aliejumi pateptoje keptuvėje po 2–3 min. iš abiejų pusių.'],
    [0, 'Подавайте с оставшимся бананом, ягодами и арахисовой пастой.', 'Patiekite su likusiu bananu, uogomis ir žemės riešutų kremu.'],
  ], ['Рисовые блинчики нежнее пшеничных — переворачивайте их широкой лопаткой.', 'Ryžių blyneliai švelnesni už kvietinius — verskite juos plačia mentele.']),
  shakshuka: d(2, 5, 15, [
    [0, 'Нарежьте лук и перец мелкими кубиками.', 'Svogūną ir papriką supjaustykite smulkiais kubeliais.'],
    [5, 'Обжарьте лук и перец на сковороде на ложке масла 5 минут до мягкости.', 'Svogūną ir papriką kepkite keptuvėje su šaukštu aliejaus 5 min., kol suminkštės.'],
    [5, 'Добавьте томаты, посолите, добавьте паприку или зиру и тушите 5 минут.', 'Sudėkite pomidorus, pasūdykite, įberkite paprikos ar kmynų ir troškinkite 5 min.'],
    [6, 'Сделайте ложкой углубления, разбейте в них яйца. Накройте крышкой и готовьте 6 минут.', 'Šaukštu padarykite duobutes, įmuškite kiaušinius. Uždenkite ir virkite 6 min.'],
    [0, 'Подавайте прямо в сковороде с ржаным хлебом.', 'Patiekite tiesiog keptuvėje su rugine duona.'],
  ], ['Белок должен схватиться, а желток остаться жидким — тогда хлебом удобно макать.', 'Baltymas turi sustingti, o trynys likti skystas — tada patogu padažyti duona.']),
  eggs_benedict: d(2, 5, 8, [
    [0, 'Смешайте йогурт с каплей лимонного сока и щепоткой соли — это лёгкий соус.', 'Jogurtą sumaišykite su lašu citrinos sulčių ir žiupsneliu druskos — tai lengvas padažas.'],
    [0, 'Доведите воду до лёгкого кипения, добавьте ложку уксуса и сделайте воронку ложкой.', 'Vandenį lengvai užvirinkite, įpilkite šaukštą acto ir šaukštu išsukite sūkurį.'],
    [3, 'Аккуратно вылейте яйцо в центр воронки и варите 3 минуты. Повторите со вторым яйцом.', 'Atsargiai įpilkite kiaušinį į sūkurio vidurį ir virkite 3 min. Pakartokite su antru.'],
    [0, 'Подсушите хлеб, выложите шпинат, сверху яйцо и полейте соусом.', 'Paskrudinkite duoną, dėkite špinatus, ant viršaus kiaušinį ir užpilkite padažu.'],
  ], ['Самые свежие яйца лучше всего держат форму при варке пашот.', 'Šviežiausi kiaušiniai verdant geriausiai išlaiko formą.']),

  // ---------------- Soups ----------------
  chicken_soup: d(1, 10, 35, [
    [15, 'Залейте куриное филе 700 мл холодной воды, доведите до кипения, снимите пену и варите 15 минут.', 'Vištienos filė užpilkite 700 ml šalto vandens, užvirinkite, nugriebkite putas ir virkite 15 min.'],
    [0, 'Пока варится курица, нарежьте картофель кубиками, морковь кружочками, лук мелко.', 'Kol verda vištiena, bulves supjaustykite kubeliais, morkas griežinėliais, svogūną smulkiai.'],
    [0, 'Выньте курицу и нарежьте её кусочками.', 'Išimkite vištieną ir supjaustykite gabalėliais.'],
    [10, 'Положите в бульон картофель, морковь и лук, посолите и варите 10 минут.', 'Į sultinį sudėkite bulves, morkas ir svogūną, pasūdykite ir virkite 10 min.'],
    [7, 'Добавьте лапшу и курицу, варите ещё 7 минут до готовности лапши.', 'Sudėkite makaronus ir vištieną, virkite dar 7 min., kol makaronai išvirs.'],
    [0, 'Посыпьте зеленью и подавайте с ржаным хлебом.', 'Pabarstykite žalumynais ir patiekite su rugine duona.'],
  ], ['Лавровый лист и пара горошин перца в бульоне — и суп как у бабушки.', 'Lauro lapas ir keli pipirų grūdeliai sultinyje — ir sriuba kaip pas močiutę.']),
  borscht: d(2, 15, 45, [
    [0, 'Свёклу и морковь натрите на крупной тёрке, лук мелко нарежьте, капусту нашинкуйте, картофель — кубиками.', 'Burokėlius ir morkas sutarkuokite stambia tarka, svogūną smulkiai supjaustykite, kopūstus supjaustykite šiaudeliais, bulves — kubeliais.'],
    [6, 'В кастрюле обжарьте фарш с луком 6 минут, разбивая комочки.', 'Puode apkepkite faršą su svogūnu 6 min., trupindami gabalėlius.'],
    [8, 'Добавьте свёклу, морковь и томаты, тушите 8 минут — свёкла сохранит яркий цвет.', 'Sudėkite burokėlius, morkas ir pomidorus, troškinkite 8 min. — burokėliai išlaikys ryškią spalvą.'],
    [15, 'Влейте 800 мл горячей воды, добавьте картофель и варите 15 минут.', 'Įpilkite 800 ml karšto vandens, sudėkite bulves ir virkite 15 min.'],
    [10, 'Добавьте капусту, посолите, поперчите и варите ещё 10 минут.', 'Sudėkite kopūstus, pasūdykite, papipirinkite ir virkite dar 10 min.'],
    [0, 'Дайте борщу настояться 10 минут под крышкой. Подавайте со сметаной и ржаным хлебом.', 'Leiskite barščiams pastovėti 10 min. uždengtiems. Patiekite su grietine ir rugine duona.'],
  ], ['На следующий день борщ ещё вкуснее — смело варите на 2 дня.', 'Kitą dieną barščiai dar skanesni — drąsiai virkite 2 dienoms.']),
  veg_soup_meatballs: d(1, 10, 30, [
    [0, 'Посолите фарш, добавьте половину мелко нарезанного лука и сформируйте фрикадельки размером с грецкий орех.', 'Faršą pasūdykite, įmaišykite pusę smulkiai supjaustyto svogūno ir suformuokite graikinio riešuto dydžio kukulius.'],
    [10, 'Нарежьте картофель и морковь, залейте 700 мл воды с оставшимся луком и варите 10 минут.', 'Bulves ir morkas supjaustykite, užpilkite 700 ml vandens su likusiu svogūnu ir virkite 10 min.'],
    [8, 'Опустите фрикадельки в кипящий суп по одной и варите 8 минут.', 'Kukulius po vieną dėkite į verdančią sriubą ir virkite 8 min.'],
    [4, 'Добавьте горошек и варите ещё 4 минуты. Посолите по вкусу.', 'Suberkite žirnelius ir virkite dar 4 min. Pasūdykite pagal skonį.'],
    [0, 'Подавайте с укропом и ржаным хлебом.', 'Patiekite su krapais ir rugine duona.'],
  ], ['Смачивайте руки водой — фрикадельки получатся гладкими и не развалятся.', 'Sudrėkinkite rankas vandeniu — kukuliai bus lygūs ir nesubyrės.']),
  pumpkin_soup: d(1, 10, 25, [
    [0, 'Очистите тыкву от кожуры и семечек, нарежьте кубиками. Лук нарежьте.', 'Moliūgą nulupkite, išimkite sėklas ir supjaustykite kubeliais. Supjaustykite svogūną.'],
    [4, 'Обжарьте лук на масле в кастрюле 4 минуты.', 'Svogūną pakepinkite aliejuje puode 4 min.'],
    [20, 'Добавьте тыкву и 500 мл воды, посолите и варите 20 минут до мягкости.', 'Sudėkite moliūgą ir 500 ml vandens, pasūdykite ir virkite 20 min., kol suminkštės.'],
    [0, 'Пюрируйте блендером до гладкости, добавьте нут и прогрейте 2 минуты.', 'Sutrinkite trintuvu iki vientisos masės, sudėkite avinžirnius ir pašildykite 2 min.'],
    [0, 'Разлейте по тарелкам, посыпьте подсушенными семечками.', 'Išpilstykite į lėkštes, pabarstykite paskrudintomis saulėgrąžomis.'],
  ], ['Щепотка мускатного ореха или имбиря делает тыквенный суп по-настоящему осенним.', 'Žiupsnelis muskato ar imbiero moliūgų sriubai suteikia tikro rudens skonį.']),
  tomato_soup: d(1, 5, 20, [
    [0, 'Мелко нарежьте лук и чеснок.', 'Smulkiai supjaustykite svogūną ir česnaką.'],
    [4, 'Обжарьте их на масле в кастрюле 4 минуты.', 'Pakepinkite juos aliejuje puode 4 min.'],
    [15, 'Добавьте томаты, фасоль и 300 мл воды. Посолите, добавьте щепотку сахара и варите 15 минут.', 'Sudėkite pomidorus, pupeles ir 300 ml vandens. Pasūdykite, įberkite žiupsnelį cukraus ir virkite 15 min.'],
    [0, 'При желании пюрируйте половину супа — он станет гуще.', 'Jei norite, sutrinkite pusę sriubos — ji taps tirštesnė.'],
    [0, 'Подавайте с подсушенным ржаным хлебом.', 'Patiekite su paskrudinta rugine duona.'],
  ], ['Сушёный базилик или орегано — лучшие друзья томатного супа.', 'Džiovintas bazilikas ar raudonėlis — geriausi pomidorų sriubos draugai.']),
  barley_soup: d(2, 10, 45, [
    [0, 'Промойте перловку и замочите на время подготовки остальных продуктов.', 'Perlines kruopas nuplaukite ir pamirkykite, kol ruošiate kitus produktus.'],
    [25, 'Залейте перловку 800 мл воды и варите 25 минут.', 'Kruopas užpilkite 800 ml vandens ir virkite 25 min.'],
    [5, 'Тем временем нарежьте грибы, лук и морковь и обжарьте их 5 минут.', 'Tuo metu supjaustykite grybus, svogūną ir morkas ir pakepinkite 5 min.'],
    [15, 'Добавьте в кастрюлю картофель и обжаренные овощи, посолите и варите 15 минут.', 'Į puodą sudėkite bulves ir pakepintas daržoves, pasūdykite ir virkite 15 min.'],
    [8, 'Сварите яйцо вкрутую (8 минут).', 'Kietai išvirkite kiaušinį (8 min.).'],
    [0, 'Подавайте суп со сметаной и половинками яйца.', 'Sriubą patiekite su grietine ir kiaušinio puselėmis.'],
  ], ['Замоченная с вечера перловка сварится в 2 раза быстрее.', 'Iš vakaro pamirkytos kruopos išvirs dvigubai greičiau.']),
  ramen: d(1, 5, 25, [
    [15, 'Залейте курицу 600 мл воды, посолите и варите 15 минут. Выньте и нарежьте тонкими ломтиками.', 'Vištieną užpilkite 600 ml vandens, pasūdykite ir virkite 15 min. Išimkite ir plonai supjaustykite.'],
    [7, 'Сварите яйцо 7 минут — желток будет кремовым. Остудите и разрежьте пополам.', 'Kiaušinį virkite 7 min. — trynys bus kreminis. Atvėsinkite ir perpjaukite.'],
    [6, 'В бульон добавьте лапшу и морковь соломкой, варите 6 минут.', 'Į sultinį sudėkite makaronus ir morkų šiaudelius, virkite 6 min.'],
    [0, 'Заправьте соевым соусом, добавьте шпинат и сразу снимите с огня.', 'Pagardinkite sojų padažu, sudėkite špinatus ir iškart nukelkite.'],
    [0, 'Разлейте в глубокую миску, сверху курица и половинки яйца.', 'Išpilkite į gilų dubenį, ant viršaus vištiena ir kiaušinio puselės.'],
  ], ['Ломтик имбиря и чеснок в бульоне дадут настоящий азиатский аромат.', 'Imbiero griežinėlis ir česnakas sultinyje suteiks tikro azijietiško aromato.']),
  lentil_soup: d(1, 10, 25, [
    [0, 'Промойте чечевицу. Лук и морковь мелко нарежьте.', 'Lęšius nuplaukite. Svogūną ir morkas smulkiai supjaustykite.'],
    [5, 'Обжарьте лук и морковь на масле 5 минут.', 'Svogūną ir morkas pakepinkite aliejuje 5 min.'],
    [20, 'Добавьте чечевицу, помидоры и 600 мл воды. Посолите, добавьте зиру и варите 20 минут.', 'Sudėkite lęšius, pomidorus ir 600 ml vandens. Pasūdykite, įberkite kmynų ir virkite 20 min.'],
    [0, 'Пюрируйте блендером до кремовой консистенции.', 'Sutrinkite trintuvu iki kreminės konsistencijos.'],
    [0, 'Подавайте с ржаным хлебом и долькой лимона.', 'Patiekite su rugine duona ir citrinos skiltele.'],
  ], ['Красную чечевицу не нужно замачивать — она разваривается сама.', 'Raudonųjų lęšių mirkyti nereikia — jie išsiverda patys.']),

  // ---------------- Mains ----------------
  chicken_buckwheat: d(1, 10, 20, [
    [15, 'Промойте гречку, залейте двойным объёмом подсоленной воды и варите 15 минут под крышкой.', 'Grikius nuplaukite, užpilkite dvigubu kiekiu pasūdyto vandens ir virkite uždengę 15 min.'],
    [0, 'Курицу отбейте до толщины 1,5 см, посолите, поперчите, смажьте маслом.', 'Vištieną išmuškite iki 1,5 cm storio, pasūdykite, papipirinkite, patepkite aliejumi.'],
    [6, 'Жарьте на раскалённой сковороде-гриль по 5–6 минут с каждой стороны.', 'Kepkite įkaitintoje grilio keptuvėje po 5–6 min. iš abiejų pusių.'],
    [5, 'Брокколи и морковь приготовьте на пару или отварите 5 минут.', 'Brokolius ir morkas virkite garuose arba vandenyje 5 min.'],
    [0, 'Дайте курице отдохнуть 3 минуты, нарежьте и подавайте с гречкой и овощами.', 'Leiskite vištienai pailsėti 3 min., supjaustykite ir patiekite su grikiais ir daržovėmis.'],
  ], ['Не режьте курицу сразу со сковороды — после отдыха она останется сочной.', 'Nepjaustykite vištienos iškart — po poilsio ji liks sultinga.']),
  turkey_pasta: d(1, 5, 20, [
    [10, 'Отварите пасту в подсоленной воде по времени на упаковке.', 'Išvirkite makaronus pasūdytame vandenyje pagal pakuotės nurodymą.'],
    [6, 'Мелко нарежьте лук и обжарьте его с фаршем 6 минут, разбивая комочки.', 'Smulkiai supjaustykite svogūną ir pakepinkite su faršu 6 min., trupindami gabalėlius.'],
    [10, 'Добавьте нарезанные помидоры, посолите и тушите 10 минут.', 'Sudėkite supjaustytus pomidorus, pasūdykite ir troškinkite 10 min.'],
    [0, 'Смешайте соус с пастой и подавайте сразу.', 'Sumaišykite padažą su makaronais ir iškart patiekite.'],
  ], ['Оставьте половник воды от пасты — он сделает соус шелковистым.', 'Pasilikite samtį makaronų vandens — padažas bus šilkinis.']),
  shrimp_rice: d(1, 5, 20, [
    [15, 'Отварите рис 15 минут.', 'Išvirkite ryžius (15 min.).'],
    [5, 'Обжарьте овощную смесь на сильном огне 5 минут.', 'Daržovių mišinį kepkite stipria ugnimi 5 min.'],
    [3, 'Добавьте креветки и жарьте 3 минуты до розового цвета.', 'Sudėkite krevetes ir kepkite 3 min., kol paraus.'],
    [0, 'Вмешайте рис и соевый соус, посыпьте кунжутом.', 'Įmaišykite ryžius ir sojų padažą, pabarstykite sezamu.'],
  ], ['Вчерашний рис идеален для жарки — он не слипается.', 'Vakarykščiai ryžiai idealūs kepti — jie nelimpa.']),
  beef_potatoes: d(2, 10, 25, [
    [0, 'Посолите фарш, добавьте мелко нарезанный лук и сформируйте 8–10 тефтелей.', 'Faršą pasūdykite, įmaišykite smulkiai supjaustytą svogūną ir suformuokite 8–10 kukulių.'],
    [5, 'Обжарьте тефтели на сковороде 5 минут, переворачивая.', 'Kukulius kepkite keptuvėje 5 min., vartydami.'],
    [15, 'Добавьте томаты и чеснок, накройте и тушите 15 минут.', 'Sudėkite pomidorus ir česnaką, uždenkite ir troškinkite 15 min.'],
    [10, 'Тем временем отварите спагетти.', 'Tuo metu išvirkite spagečius.'],
    [0, 'Подавайте тефтели с соусом на спагетти.', 'Kukulius su padažu patiekite ant spagečių.'],
  ], ['Ложка воды в фарше делает тефтели нежнее.', 'Šaukštas vandens farše kukulius padaro švelnesnius.']),
  chickpea_curry: d(1, 5, 20, [
    [15, 'Отварите рис.', 'Išvirkite ryžius.'],
    [2, 'Прогрейте масло, добавьте карри, куркуму и зиру на 1 минуту.', 'Įkaitinkite aliejų, 1 min. pakepinkite kario, ciberžolės ir kmynų prieskonius.'],
    [10, 'Добавьте нарезанные помидоры и нут, посолите и тушите 10 минут.', 'Sudėkite supjaustytus pomidorus ir avinžirnius, pasūdykite ir troškinkite 10 min.'],
    [0, 'Вмешайте шпинат — он опадёт за минуту. Подавайте с рисом.', 'Įmaišykite špinatus — jie suminkštės per minutę. Patiekite su ryžiais.'],
  ], ['Слейте жидкость из банки нута и промойте его — уйдёт лишняя соль.', 'Nupilkite skystį ir nuplaukite avinžirnius — nebeliks druskos pertekliaus.']),
  pork_oven: d(2, 15, 35, [
    [0, 'Нарежьте свинину кубиками 3 см, посолите, поперчите, добавьте паприку и половину лука кольцами. Оставьте на 10 минут.', 'Kiaulieną supjaustykite 3 cm kubeliais, pasūdykite, papipirinkite, įberkite paprikos ir pusę svogūno žiedais. Palikite 10 min.'],
    [0, 'Разогрейте духовку до 200 °C. Картофель разрежьте на четвертинки.', 'Įkaitinkite orkaitę iki 200 °C. Bulves supjaustykite ketvirčiais.'],
    [0, 'Нанижите мясо на шпажки, чередуя с луком.', 'Mėsą suverkite ant iešmelių, kaitaliodami su svogūnu.'],
    [30, 'Выложите шпажки и картофель на противень с пергаментом и запекайте 30 минут, перевернув в середине.', 'Iešmelius ir bulves dėkite ant skardos su kepimo popieriumi ir kepkite 30 min., įpusėjus apverskite.'],
    [0, 'Подавайте с нарезанными помидорами.', 'Patiekite su pjaustytais pomidorais.'],
  ], ['Деревянные шпажки замочите в воде на 10 минут — они не подгорят.', 'Medinius iešmelius pamirkykite vandenyje 10 min. — jie neapdegs.']),
  plov: d(2, 15, 45, [
    [0, 'Курицу нарежьте кусочками, морковь — соломкой, лук — полукольцами. Рис промойте до прозрачной воды.', 'Vištieną supjaustykite gabalėliais, morkas šiaudeliais, svogūną pusžiedžiais. Ryžius plaukite, kol vanduo taps skaidrus.'],
    [7, 'В толстостенной кастрюле обжарьте курицу на масле 7 минут до золотистого цвета.', 'Storasieniame puode apkepkite vištieną aliejuje 7 min., kol paruduos.'],
    [7, 'Добавьте лук и морковь, жарьте ещё 7 минут. Посолите, добавьте зиру.', 'Sudėkite svogūną ir morkas, kepkite dar 7 min. Pasūdykite, įberkite kmynų.'],
    [0, 'Ровным слоем выложите рис, не перемешивая. Влейте горячую воду на 1,5 см выше риса, воткните целые зубчики чеснока.', 'Lygiu sluoksniu suberkite ryžius nemaišydami. Įpilkite karšto vandens 1,5 cm virš ryžių, įsmeikite nesmulkintas česnako skilteles.'],
    [25, 'Накройте крышкой и готовьте на слабом огне 25 минут.', 'Uždenkite ir virkite ant silpnos ugnies 25 min.'],
    [0, 'Перемешайте перед подачей.', 'Prieš patiekdami išmaišykite.'],
  ], ['Не открывайте крышку, пока плов готовится — рис должен париться.', 'Kol plovas verda, neatidarykite dangčio — ryžiai turi garuoti.']),
  chicken_curry: d(2, 10, 25, [
    [15, 'Отварите рис.', 'Išvirkite ryžius.'],
    [3, 'Обжарьте нарезанный лук и чеснок на масле 3 минуты.', 'Pakepinkite supjaustytą svogūną ir česnaką aliejuje 3 min.'],
    [6, 'Добавьте курицу кубиками и 1 ч. л. карри, жарьте 6 минут.', 'Sudėkite vištienos kubelius ir 1 a. š. kario, kepkite 6 min.'],
    [10, 'Влейте томаты, посолите и тушите 10 минут.', 'Supilkite pomidorus, pasūdykite ir troškinkite 10 min.'],
    [0, 'Снимите с огня и вмешайте йогурт — соус станет кремовым.', 'Nukelkite nuo ugnies ir įmaišykite jogurtą — padažas taps kreminis.'],
  ], ['Йогурт добавляйте только снятым с огня — иначе он свернётся.', 'Jogurtą dėkite tik nukėlę nuo ugnies — kitaip jis sutrauks.']),
  rice_chicken_box: d(1, 10, 20, [
    [15, 'Отварите рис.', 'Išvirkite ryžius.'],
    [7, 'Курицу нарежьте полосками и обжарьте 7 минут.', 'Vištieną supjaustykite juostelėmis ir kepkite 7 min.'],
    [5, 'Добавьте брокколи и морковь, жарьте ещё 5 минут.', 'Sudėkite brokolius ir morkas, kepkite dar 5 min.'],
    [0, 'Заправьте соевым соусом и разложите по контейнерам с рисом.', 'Pagardinkite sojų padažu ir sudėkite į indelius su ryžiais.'],
  ], ['В холодильнике контейнеры хранятся 3 дня — готовьте сразу на несколько обедов.', 'Šaldytuve indeliai laikosi 3 dienas — gaminkite iškart keliems pietums.']),
  lasagna: d(3, 20, 40, [
    [8, 'Обжарьте лук и фарш 8 минут, добавьте половину томатов и посолите.', 'Pakepinkite svogūną ir faršą 8 min., sudėkite pusę pomidorų ir pasūdykite.'],
    [0, 'Кабачок нарежьте тонкими пластинами вдоль. Разогрейте духовку до 190 °C.', 'Cukiniją išilgai supjaustykite plonomis juostelėmis. Įkaitinkite orkaitę iki 190 °C.'],
    [0, 'В форму выложите слоями: немного томатов, листы пасты, фарш, кабачок. Повторите 2 раза.', 'Į formą dėkite sluoksniais: šiek tiek pomidorų, makaronų lakštai, faršas, cukinija. Pakartokite 2 kartus.'],
    [0, 'Сверху полейте оставшимися томатами и посыпьте тёртым сыром.', 'Viršų užpilkite likusiais pomidorais ir pabarstykite tarkuotu sūriu.'],
    [30, 'Накройте фольгой и запекайте 20 минут, затем без фольги ещё 10 минут.', 'Uždenkite folija ir kepkite 20 min., tada be folijos dar 10 min.'],
    [0, 'Дайте лазанье постоять 10 минут — она лучше нарежется.', 'Leiskite lazanijai pastovėti 10 min. — ji geriau pjaustysis.'],
  ], ['Листы для лазаньи можно не варить заранее, если соуса достаточно.', 'Lazanijos lakštų iš anksto virti nebūtina, jei padažo pakanka.']),
  pasta_shrimp: d(1, 5, 15, [
    [10, 'Отварите спагетти в подсоленной воде.', 'Išvirkite spagečius pasūdytame vandenyje.'],
    [1, 'На масле 1 минуту прогрейте нарезанный чеснок.', 'Aliejuje 1 min. pakaitinkite supjaustytą česnaką.'],
    [3, 'Добавьте креветки и жарьте 3 минуты.', 'Sudėkite krevetes ir kepkite 3 min.'],
    [4, 'Влейте томаты, тушите 4 минуты, в конце добавьте шпинат.', 'Supilkite pomidorus, troškinkite 4 min., pabaigoje sudėkite špinatus.'],
    [0, 'Смешайте со спагетти и сразу подавайте.', 'Sumaišykite su spagečiais ir iškart patiekite.'],
  ], ['Креветки не передерживайте — 3 минут достаточно, иначе станут резиновыми.', 'Krevečių neperkepkite — užtenka 3 min., kitaip taps guminės.']),
  pasta_chicken_mush: d(1, 10, 20, [
    [10, 'Отварите пасту.', 'Išvirkite makaronus.'],
    [6, 'Курицу нарежьте кубиками и обжарьте 6 минут.', 'Vištieną supjaustykite kubeliais ir kepkite 6 min.'],
    [5, 'Добавьте грибы и лук, жарьте 5 минут до испарения жидкости.', 'Sudėkite grybus ir svogūną, kepkite 5 min., kol išgaruos skystis.'],
    [0, 'Снимите с огня, вмешайте йогурт с измельчённым чесноком и пасту.', 'Nukelkite nuo ugnies, įmaišykite jogurtą su smulkintu česnaku ir makaronus.'],
  ], ['Если соус густой, добавьте пару ложек воды от пасты.', 'Jei padažas tirštas, įpilkite porą šaukštų makaronų vandens.']),
  pasta_veg: d(1, 10, 15, [
    [10, 'Отварите пасту.', 'Išvirkite makaronus.'],
    [6, 'Нарежьте перец и кабачок кубиками и обжарьте на масле 6 минут.', 'Papriką ir cukiniją supjaustykite kubeliais ir pakepinkite aliejuje 6 min.'],
    [4, 'Добавьте томаты, посолите и прогрейте 4 минуты.', 'Sudėkite pomidorus, pasūdykite ir pašildykite 4 min.'],
    [0, 'Смешайте с пастой и посыпьте раскрошенной фетой.', 'Sumaišykite su makaronais ir pabarstykite sutrupinta feta.'],
  ], ['Фета солёная — солите соус осторожно.', 'Feta sūri — padažą sūdykite atsargiai.']),
  pasta_beef: d(1, 5, 25, [
    [10, 'Отварите пасту.', 'Išvirkite makaronus.'],
    [6, 'Обжарьте фарш с мелко нарезанным луком и тёртой морковью 6 минут.', 'Pakepinkite faršą su smulkiai supjaustytu svogūnu ir tarkuota morka 6 min.'],
    [15, 'Добавьте томаты, посолите, добавьте орегано и тушите 15 минут.', 'Sudėkite pomidorus, pasūdykite, įberkite raudonėlio ir troškinkite 15 min.'],
    [0, 'Подавайте соус на пасте.', 'Padažą patiekite ant makaronų.'],
  ], ['Чем дольше тушится болоньезе, тем глубже вкус — можно и 30 минут.', 'Kuo ilgiau troškinama bolonija, tuo gilesnis skonis — galima ir 30 min.']),
  dal: d(1, 5, 25, [
    [15, 'Отварите рис.', 'Išvirkite ryžius.'],
    [3, 'Обжарьте лук и чеснок со специями (карри, куркума, зира) 3 минуты.', 'Pakepinkite svogūną ir česnaką su prieskoniais (karis, ciberžolė, kmynai) 3 min.'],
    [20, 'Добавьте чечевицу, томаты и 400 мл воды, посолите и тушите 20 минут.', 'Sudėkite lęšius, pomidorus ir 400 ml vandens, pasūdykite ir troškinkite 20 min.'],
    [0, 'Вмешайте шпинат и подавайте с рисом.', 'Įmaišykite špinatus ir patiekite su ryžiais.'],
  ], ['Дал должен быть густым, как каша — если жидкий, поварите без крышки.', 'Dal turi būti tirštas kaip košė — jei skystas, pavirkite be dangčio.']),
  bibimbap: d(2, 10, 20, [
    [15, 'Отварите рис.', 'Išvirkite ryžius.'],
    [6, 'Обжарьте фарш с соевым соусом 6 минут.', 'Pakepinkite faršą su sojų padažu 6 min.'],
    [3, 'Отдельно быстро обжарьте морковь соломкой и шпинат.', 'Atskirai greitai pakepinkite morkų šiaudelius ir špinatus.'],
    [3, 'Пожарьте яйцо глазунью.', 'Iškepkite kiaušinį akutę.'],
    [0, 'Выложите на рис секторами фарш, овощи, огурец, сверху яйцо, посыпьте кунжутом.', 'Ant ryžių sektoriais dėkite faršą, daržoves, agurką, viršuje kiaušinį, pabarstykite sezamu.'],
  ], ['Перед едой всё перемешайте — так и едят бибимбап.', 'Prieš valgydami viską išmaišykite — taip ir valgomas bibimbapas.']),
  chicken_bulgur: d(1, 10, 20, [
    [15, 'Залейте булгур кипятком (1:2), накройте и оставьте на 15 минут.', 'Bulgurą užpilkite verdančiu vandeniu (1:2), uždenkite ir palikite 15 min.'],
    [12, 'Курицу посолите, поперчите и обжарьте по 6 минут с каждой стороны.', 'Vištieną pasūdykite, papipirinkite ir kepkite po 6 min. iš abiejų pusių.'],
    [5, 'Брокколи и перец обжарьте на масле 5 минут.', 'Brokolius ir papriką pakepinkite aliejuje 5 min.'],
    [0, 'Подавайте нарезанную курицу с булгуром и овощами.', 'Supjaustytą vištieną patiekite su bulguru ir daržovėmis.'],
  ], ['Булгур не нужно варить — достаточно залить кипятком.', 'Bulguro virti nereikia — užtenka užpilti verdančiu vandeniu.']),
  quinoa_bowl: d(1, 10, 20, [
    [15, 'Промойте киноа и варите в двойном объёме воды 15 минут.', 'Kinvą nuplaukite ir virkite dvigubame vandens kiekyje 15 min.'],
    [12, 'Обжарьте курицу по 6 минут с каждой стороны, нарежьте.', 'Vištieną kepkite po 6 min. iš abiejų pusių, supjaustykite.'],
    [0, 'Нарежьте помидор, огурец и авокадо.', 'Supjaustykite pomidorą, agurką ir avokadą.'],
    [0, 'Соберите боул: киноа, курица, овощи, кукуруза. Заправьте лимонным соком и маслом.', 'Surinkite dubenėlį: kinva, vištiena, daržovės, kukurūzai. Pagardinkite citrinos sultimis ir aliejumi.'],
  ], ['Промывайте киноа обязательно — так уходит горечь.', 'Kinvą būtinai nuplaukite — taip pasišalina kartumas.']),
  vegan_bowl: d(1, 10, 25, [
    [20, 'Батат нарежьте кубиками, сбрызните маслом и запекайте при 200 °C 20 минут.', 'Batatus supjaustykite kubeliais, apšlakstykite aliejumi ir kepkite 200 °C 20 min.'],
    [15, 'Отварите киноа.', 'Išvirkite kinvą.'],
    [0, 'Нашинкуйте капусту и натрите морковь.', 'Supjaustykite kopūstus ir sutarkuokite morkas.'],
    [0, 'Соберите боул из киноа, батата, нута, овощей и авокадо.', 'Surinkite dubenėlį iš kinvos, batatų, avinžirnių, daržovių ir avokado.'],
  ], ['Нут можно запечь вместе с бататом — он станет хрустящим.', 'Avinžirnius galima kepti kartu su batatais — jie taps traškūs.']),
  beef_stew: d(1, 10, 25, [
    [15, 'Отварите гречку.', 'Išvirkite grikius.'],
    [6, 'Обжарьте фарш с луком 6 минут.', 'Pakepinkite faršą su svogūnu 6 min.'],
    [3, 'Добавьте перец полосками и жарьте 3 минуты.', 'Sudėkite paprikos juosteles ir kepkite 3 min.'],
    [12, 'Влейте томаты, посолите, тушите под крышкой 12 минут.', 'Supilkite pomidorus, pasūdykite, troškinkite uždengę 12 min.'],
    [0, 'Подавайте с гречкой.', 'Patiekite su grikiais.'],
  ], ['Копчёная паприка придаст рагу вкус как с гриля.', 'Rūkyta paprika troškiniui suteiks grilio skonį.']),
  chicken_cabbage: d(1, 10, 35, [
    [6, 'Курицу нарежьте и обжарьте с луком и тёртой морковью 6 минут.', 'Vištieną supjaustykite ir pakepinkite su svogūnu ir tarkuota morka 6 min.'],
    [0, 'Нашинкуйте капусту.', 'Supjaustykite kopūstus.'],
    [25, 'Добавьте капусту, томаты и 100 мл воды, посолите и тушите под крышкой 25 минут.', 'Sudėkite kopūstus, pomidorus ir 100 ml vandens, pasūdykite ir troškinkite uždengę 25 min.'],
    [15, 'Тем временем отварите картофель.', 'Tuo metu išvirkite bulves.'],
    [0, 'Подавайте капусту с курицей и картофелем.', 'Kopūstus su vištiena patiekite su bulvėmis.'],
  ], ['Ложка уксуса или лимонного сока в конце сделает капусту ярче.', 'Šaukštas acto ar citrinos sulčių pabaigoje kopūstams suteiks ryškumo.']),
  shawarma: d(1, 10, 12, [
    [0, 'Курицу нарежьте полосками, посолите, добавьте паприку, зиру и куркуму.', 'Vištieną supjaustykite juostelėmis, pasūdykite, įberkite paprikos, kmynų ir ciberžolės.'],
    [8, 'Обжарьте курицу 8 минут до румяности.', 'Kepkite vištieną 8 min., kol paruduos.'],
    [0, 'Смешайте йогурт с измельчённым чесноком — это соус.', 'Jogurtą sumaišykite su smulkintu česnaku — tai padažas.'],
    [0, 'На лаваш выложите соус, капусту, огурец, помидор и курицу. Плотно сверните.', 'Ant lavašo dėkite padažą, kopūstus, agurką, pomidorą ir vištieną. Sandariai susukite.'],
    [2, 'Подрумяньте шаурму на сухой сковороде по 1 минуте с каждой стороны.', 'Šaurmą paskrudinkite sausoje keptuvėje po 1 min. iš abiejų pusių.'],
  ], ['Заворачивайте конвертом: сначала низ, потом бока, затем катите.', 'Vyniokite vokeliu: pirma apačią, tada šonus, paskui ritinkite.']),
  baked_chicken_veg: d(1, 10, 35, [
    [0, 'Разогрейте духовку до 200 °C.', 'Įkaitinkite orkaitę iki 200 °C.'],
    [0, 'Нарежьте картофель, кабачок, перец и лук крупными кусками.', 'Bulves, cukiniją, papriką ir svogūną supjaustykite stambiais gabalais.'],
    [0, 'Выложите овощи и курицу на противень, посолите, поперчите, сбрызните маслом, добавьте прованские травы.', 'Daržoves ir vištieną dėkite ant skardos, pasūdykite, papipirinkite, apšlakstykite aliejumi, įberkite Provanso žolelių.'],
    [35, 'Запекайте 35 минут до золотистой корочки.', 'Kepkite 35 min., kol paruduos.'],
  ], ['Не кладите продукты слишком плотно — так они запекаются, а не тушатся.', 'Nedėkite produktų per tankiai — tada jie kepa, o ne troškinasi.']),
  chicken_skewers: d(2, 20, 25, [
    [10, 'Курицу нарежьте кубиками и замаринуйте в йогурте с солью и паприкой на 10 минут.', 'Vištieną supjaustykite kubeliais ir marinuokite jogurte su druska ir paprika 10 min.'],
    [0, 'Разогрейте духовку до 220 °C. Нарежьте перец и кабачок кусочками.', 'Įkaitinkite orkaitę iki 220 °C. Supjaustykite papriką ir cukiniją gabalėliais.'],
    [0, 'Нанижите курицу и овощи на шпажки.', 'Suverkite vištieną ir daržoves ant iešmelių.'],
    [20, 'Запекайте 20 минут, перевернув в середине.', 'Kepkite 20 min., įpusėjus apverskite.'],
    [15, 'Залейте булгур кипятком на 15 минут и подавайте со шпажками.', 'Bulgurą užpilkite verdančiu vandeniu 15 min. ir patiekite su iešmeliais.'],
  ], ['Йогуртовый маринад делает куриную грудку невероятно мягкой.', 'Jogurto marinatas vištienos krūtinėlę padaro nepaprastai minkštą.']),
  chicken_mixveg: d(1, 5, 20, [
    [15, 'Отварите рис.', 'Išvirkite ryžius.'],
    [12, 'Курицу посолите и обжарьте на сковороде-гриль по 6 минут с каждой стороны.', 'Vištieną pasūdykite ir kepkite grilio keptuvėje po 6 min. iš abiejų pusių.'],
    [5, 'Морковь кубиками, горошек и кукурузу прогрейте на сковороде 5 минут.', 'Morkų kubelius, žirnelius ir kukurūzus pašildykite keptuvėje 5 min.'],
    [0, 'Подавайте нарезанную курицу с рисом и овощами.', 'Supjaustytą vištieną patiekite su ryžiais ir daržovėmis.'],
  ], ['Сковорода должна быть сильно раскалена — тогда появятся красивые полоски.', 'Keptuvė turi būti labai įkaitusi — tada atsiras gražios grilio juostelės.']),
  roast_chicken_sp: d(1, 10, 35, [
    [0, 'Разогрейте духовку до 200 °C. Батат нарежьте дольками.', 'Įkaitinkite orkaitę iki 200 °C. Batatus supjaustykite skiltelėmis.'],
    [0, 'Выложите курицу и батат на противень, добавьте раздавленный чеснок, соль и масло.', 'Vištieną ir batatus dėkite ant skardos, sudėkite sutraiškytą česnaką, druską ir aliejų.'],
    [25, 'Запекайте 25 минут.', 'Kepkite 25 min.'],
    [10, 'Добавьте брокколи и запекайте ещё 10 минут.', 'Sudėkite brokolius ir kepkite dar 10 min.'],
  ], ['Батат запекается быстрее картофеля — режьте дольки одинаковыми.', 'Batatai kepa greičiau nei bulvės — skilteles pjaustykite vienodas.']),
  mackerel_baked: d(1, 10, 30, [
    [0, 'Разогрейте духовку до 200 °C. Картофель нарежьте кружками.', 'Įkaitinkite orkaitę iki 200 °C. Bulves supjaustykite griežinėliais.'],
    [15, 'Выложите картофель на противень, сбрызните маслом и запекайте 15 минут.', 'Bulves dėkite ant skardos, apšlakstykite aliejumi ir kepkite 15 min.'],
    [15, 'Положите сверху треску, посолите, накройте кружками лимона и запекайте ещё 15 минут.', 'Ant viršaus dėkite menkę, pasūdykite, uždenkite citrinos griežinėliais ir kepkite dar 15 min.'],
    [0, 'Подавайте с огурцом.', 'Patiekite su agurku.'],
  ], ['Рыба готова, когда легко расслаивается вилкой.', 'Žuvis paruošta, kai lengvai skaidosi šakute.']),
  mackerel_bowl: d(1, 10, 15, [
    [15, 'Залейте булгур кипятком на 15 минут.', 'Bulgurą užpilkite verdančiu vandeniu 15 min.'],
    [8, 'Треску посолите и обжарьте на масле по 4 минуты с каждой стороны.', 'Menkę pasūdykite ir kepkite aliejuje po 4 min. iš abiejų pusių.'],
    [0, 'Нарежьте помидор и огурец.', 'Supjaustykite pomidorą ir agurką.'],
    [0, 'Выложите булгур, шпинат, овощи и рыбу в миску.', 'Į dubenį dėkite bulgurą, špinatus, daržoves ir žuvį.'],
  ], ['Обсушите рыбу полотенцем перед жаркой — корочка будет золотой.', 'Prieš kepdami žuvį nusausinkite — plutelė bus auksinė.']),
  salmon_spinach: d(2, 5, 20, [
    [15, 'Отварите киноа.', 'Išvirkite kinvą.'],
    [8, 'Лосось посолите и жарьте кожей вниз 5 минут, затем 3 минуты с другой стороны.', 'Lašišą pasūdykite ir kepkite oda žemyn 5 min., tada 3 min. iš kitos pusės.'],
    [1, 'Шпинат прогрейте на сковороде 1 минуту.', 'Špinatus pakaitinkite keptuvėje 1 min.'],
    [0, 'Подавайте лосось на шпинате с киноа, сбрызнув лимоном.', 'Lašišą patiekite ant špinatų su kinva, apšlakstę citrina.'],
  ], ['Не двигайте лосось первые 4 минуты — кожа станет хрустящей.', 'Pirmas 4 min. lašišos nejudinkite — oda taps traški.']),
  salmon_tomato: d(1, 5, 20, [
    [15, 'Отварите рис.', 'Išvirkite ryžius.'],
    [3, 'Обжарьте лук 3 минуты, добавьте томаты и посолите.', 'Svogūną pakepinkite 3 min., sudėkite pomidorus ir pasūdykite.'],
    [10, 'Выложите лосось в соус, накройте и тушите 10 минут.', 'Lašišą dėkite į padažą, uždenkite ir troškinkite 10 min.'],
    [0, 'В конце добавьте шпинат. Подавайте с рисом.', 'Pabaigoje sudėkite špinatus. Patiekite su ryžiais.'],
  ], ['Щепотка сушёного укропа отлично подходит к лососю.', 'Žiupsnelis džiovintų krapų puikiai tinka prie lašišos.']),
  cod_tomato: d(1, 5, 20, [
    [15, 'Отварите рис.', 'Išvirkite ryžius.'],
    [5, 'Тушите лук с томатами 5 минут, посолите.', 'Svogūną su pomidorais troškinkite 5 min., pasūdykite.'],
    [8, 'Положите треску в соус и тушите под крышкой 8 минут.', 'Menkę dėkite į padažą ir troškinkite uždengę 8 min.'],
    [0, 'Снимите с огня и вмешайте в соус йогурт.', 'Nukelkite nuo ugnies ir į padažą įmaišykite jogurtą.'],
  ], ['Замороженную треску разморозьте в холодильнике с вечера.', 'Šaldytą menkę atšildykite šaldytuve nuo vakaro.']),
  ratatouille: d(2, 15, 35, [
    [0, 'Разогрейте духовку до 190 °C. Нарежьте кабачок и перец тонкими кружками.', 'Įkaitinkite orkaitę iki 190 °C. Cukiniją ir papriką supjaustykite plonais griežinėliais.'],
    [5, 'Обжарьте лук, добавьте томаты и посолите — это соус. Вылейте его в форму.', 'Pakepinkite svogūną, sudėkite pomidorus ir pasūdykite — tai padažas. Supilkite jį į formą.'],
    [0, 'Плотно выложите овощи по кругу на соус, сбрызните маслом.', 'Daržoves tankiai išdėliokite ratu ant padažo, apšlakstykite aliejumi.'],
    [30, 'Накройте фольгой и запекайте 30 минут.', 'Uždenkite folija ir kepkite 30 min.'],
    [0, 'Посыпьте фетой и подавайте с хлебом.', 'Pabarstykite feta ir patiekite su duona.'],
  ], ['Чем тоньше нарезаны овощи, тем красивее и нежнее рататуй.', 'Kuo ploniau supjaustytos daržovės, tuo gražesnis ir švelnesnis ratatui.']),
  greek_salad_chicken: d(1, 10, 12, [
    [12, 'Обжарьте курицу по 6 минут с каждой стороны, нарежьте.', 'Vištieną kepkite po 6 min. iš abiejų pusių, supjaustykite.'],
    [0, 'Крупно нарежьте огурец, помидор и перец.', 'Stambiai supjaustykite agurką, pomidorą ir papriką.'],
    [0, 'Добавьте фету кубиками и курицу.', 'Sudėkite fetos kubelius ir vištieną.'],
    [0, 'Заправьте маслом, орегано и щепоткой соли. Подавайте с хлебом.', 'Pagardinkite aliejumi, raudonėliu ir žiupsneliu druskos. Patiekite su duona.'],
  ], ['Не перемешивайте салат слишком сильно — фета должна остаться кубиками.', 'Salotų per stipriai nemaišykite — feta turi likti kubeliais.']),
  noodle_chicken: d(1, 10, 15, [
    [7, 'Отварите гречневую лапшу 7 минут и промойте холодной водой.', 'Grikių makaronus virkite 7 min. ir perplaukite šaltu vandeniu.'],
    [6, 'Обжарьте курицу полосками 6 минут.', 'Vištienos juosteles kepkite 6 min.'],
    [3, 'Добавьте перец и морковь соломкой, жарьте 3 минуты.', 'Sudėkite paprikos ir morkų šiaudelius, kepkite 3 min.'],
    [0, 'Добавьте лапшу и соевый соус, перемешайте.', 'Sudėkite makaronus ir sojų padažą, išmaišykite.'],
  ], ['Промывка холодной водой не даёт гречневой лапше слипнуться.', 'Perplovus šaltu vandeniu grikių makaronai nesulimpa.']),
  turkey_cauliflower: d(1, 10, 25, [
    [20, 'Отварите картофель 20 минут.', 'Bulves virkite 20 min.'],
    [12, 'Индейку посолите и обжарьте по 6 минут с каждой стороны.', 'Kalakutieną pasūdykite ir kepkite po 6 min. iš abiejų pusių.'],
    [6, 'Цветную капусту разберите на соцветия и отварите 6 минут.', 'Žiedinius kopūstus išardykite žiedynais ir virkite 6 min.'],
    [0, 'Разомните картофель с тёплым молоком в пюре.', 'Bulves sutrinkite su šiltu pienu į košę.'],
    [0, 'Подавайте индейку с пюре и капустой.', 'Kalakutieną patiekite su koše ir kopūstais.'],
  ], ['Тёплое молоко делает пюре пышным, холодное — клейким.', 'Šiltas pienas košę padaro purią, šaltas — lipnią.']),
  turkey_buckwheat_cutlets: d(1, 10, 20, [
    [15, 'Отварите гречку.', 'Išvirkite grikius.'],
    [0, 'Смешайте фарш с мелко нарезанным луком, яйцом и солью.', 'Faršą sumaišykite su smulkiai supjaustytu svogūnu, kiaušiniu ir druska.'],
    [0, 'Влажными руками сформируйте 4 котлеты.', 'Drėgnomis rankomis suformuokite 4 kotletus.'],
    [10, 'Жарьте по 5 минут с каждой стороны на среднем огне.', 'Kepkite po 5 min. iš abiejų pusių vidutine ugnimi.'],
    [0, 'Подавайте с гречкой и огурцом.', 'Patiekite su grikiais ir agurku.'],
  ], ['Накройте котлеты крышкой на последние 3 минуты — они пропекутся внутри.', 'Paskutines 3 min. kotletus uždenkite — jie iškeps viduje.']),
  cod_veg: d(1, 10, 25, [
    [0, 'Разогрейте духовку до 200 °C. Картофель нарежьте дольками.', 'Įkaitinkite orkaitę iki 200 °C. Bulves supjaustykite skiltelėmis.'],
    [0, 'Выложите в форму картофель, овощную смесь и треску. Посолите, сбрызните маслом.', 'Į formą dėkite bulves, daržovių mišinį ir menkę. Pasūdykite, apšlakstykite aliejumi.'],
    [20, 'Запекайте 20 минут.', 'Kepkite 20 min.'],
  ], ['Добавьте ломтик лимона на рыбу — аромат будет свежее.', 'Ant žuvies dėkite citrinos griežinėlį — aromatas bus gaivesnis.']),
  tuna_salad: d(1, 10, 10, [
    [8, 'Сварите яйцо вкрутую (8 минут), остудите.', 'Kietai išvirkite kiaušinį (8 min.), atvėsinkite.'],
    [0, 'Нарежьте огурец и помидор.', 'Supjaustykite agurką ir pomidorą.'],
    [0, 'Выложите на шпинат овощи, тунец и яйцо.', 'Ant špinatų dėkite daržoves, tuną ir kiaušinį.'],
    [0, 'Заправьте маслом и лимонным соком.', 'Pagardinkite aliejumi ir citrinos sultimis.'],
  ], ['Тунец в собственном соку легче, чем в масле, и в нём больше белка на калорию.', 'Tunas savo sultyse lengvesnis nei aliejuje ir turi daugiau baltymų kalorijai.']),
  salmon_rice: d(1, 5, 20, [
    [15, 'Отварите рис.', 'Išvirkite ryžius.'],
    [15, 'Лосось посолите и запекайте при 200 °C 15 минут.', 'Lašišą pasūdykite ir kepkite 200 °C 15 min.'],
    [5, 'Брокколи и морковь приготовьте на пару 5 минут.', 'Brokolius ir morkas virkite garuose 5 min.'],
  ], ['Капля соевого соуса и кунжут превратят блюдо в азиатский боул.', 'Lašas sojų padažo ir sezamas patiekalą pavers azijietišku dubenėliu.']),
  chicken_wrap: d(1, 10, 10, [
    [8, 'Курицу посолите и обжарьте 8 минут, нарежьте полосками.', 'Vištieną pasūdykite ir kepkite 8 min., supjaustykite juostelėmis.'],
    [0, 'Нарежьте огурец, помидор и капусту.', 'Supjaustykite agurką, pomidorą ir kopūstus.'],
    [0, 'Смажьте лаваш йогуртом, выложите овощи и курицу, сверните.', 'Lavašą patepkite jogurtu, dėkite daržoves ir vištieną, susukite.'],
    [2, 'Подрумяньте на сухой сковороде по минуте с каждой стороны.', 'Paskrudinkite sausoje keptuvėje po minutę iš abiejų pusių.'],
  ], ['Разрежьте ролл по диагонали — так он красивее на тарелке.', 'Vyniotinį perpjaukite įstrižai — lėkštėje atrodys gražiau.']),
  tofu_buckwheat: d(1, 10, 15, [
    [7, 'Отварите гречневую лапшу или гречку.', 'Išvirkite grikių makaronus arba grikius.'],
    [6, 'Тофу кубиками обжарьте до румяности 6 минут.', 'Tofu kubelius kepkite 6 min., kol paruduos.'],
    [5, 'Добавьте овощи и жарьте 5 минут.', 'Sudėkite daržoves ir kepkite 5 min.'],
    [0, 'Смешайте с лапшой и соевым соусом.', 'Sumaišykite su makaronais ir sojų padažu.'],
  ], ['Отожмите тофу под тарелкой 10 минут — он лучше обжарится.', 'Tofu 10 min. paspauskite po lėkšte — geriau apskrus.']),
  bean_stew: d(1, 10, 20, [
    [5, 'Обжарьте нарезанный лук и морковь 5 минут.', 'Pakepinkite supjaustytą svogūną ir morkas 5 min.'],
    [0, 'Добавьте фасоль, нут и нарезанные помидоры, посолите.', 'Sudėkite pupeles, avinžirnius ir supjaustytus pomidorus, pasūdykite.'],
    [15, 'Тушите под крышкой 15 минут.', 'Troškinkite uždengę 15 min.'],
    [0, 'Посыпьте зеленью перед подачей.', 'Prieš patiekdami pabarstykite žalumynais.'],
  ], ['Рагу можно заморозить порциями — оно хранится до 3 месяцев.', 'Troškinį galima užšaldyti porcijomis — jis laikosi iki 3 mėnesių.']),
  turkey_beet: d(2, 15, 30, [
    [0, 'Разогрейте духовку до 200 °C. Нарежьте свёклу и картофель кубиками.', 'Įkaitinkite orkaitę iki 200 °C. Burokėlius ir bulves supjaustykite kubeliais.'],
    [0, 'Посолите фарш и сформируйте тефтели.', 'Faršą pasūdykite ir suformuokite kukulius.'],
    [0, 'Выложите всё на противень, сбрызните маслом.', 'Viską dėkite ant skardos, apšlakstykite aliejumi.'],
    [25, 'Запекайте 25 минут.', 'Kepkite 25 min.'],
    [0, 'Подавайте со шпинатом.', 'Patiekite su špinatais.'],
  ], ['Наденьте перчатки, когда режете свёклу, — руки не окрасятся.', 'Pjaustydami burokėlius užsimaukite pirštines — rankos nenusidažys.']),
  egg_bake: d(1, 10, 25, [
    [0, 'Разогрейте духовку до 190 °C. Разберите брокколи на соцветия.', 'Įkaitinkite orkaitę iki 190 °C. Brokolius išardykite žiedynais.'],
    [0, 'Взбейте яйца с молоком и солью.', 'Išplakite kiaušinius su pienu ir druska.'],
    [0, 'Выложите брокколи в форму, залейте яйцами, посыпьте сыром.', 'Brokolius dėkite į formą, užpilkite kiaušiniais, pabarstykite sūriu.'],
    [20, 'Запекайте 20 минут до золотистой корочки.', 'Kepkite 20 min., kol paruduos.'],
    [0, 'Подавайте с хлебом и помидорами.', 'Patiekite su duona ir pomidorais.'],
  ], ['Запеканка вкусна и холодной — возьмите кусок на обед.', 'Apkepas skanus ir šaltas — pasiimkite gabalėlį pietums.']),

  // ---------------- Snacks ----------------
  pear_cottage: d(1, 3, 0, [[0, 'Нарежьте грушу дольками.', 'Kriaušę supjaustykite skiltelėmis.'], [0, 'Подавайте с творогом, можно посыпать корицей.', 'Patiekite su varške, galite pabarstyti cinamonu.']], ['Корица подчёркивает сладость груши без сахара.', 'Cinamonas paryškina kriaušės saldumą be cukraus.']),
  orange_yogurt: d(1, 3, 0, [[0, 'Очистите апельсин и нарежьте дольками.', 'Apelsiną nulupkite ir supjaustykite skiltelėmis.'], [0, 'Подавайте с йогуртом и семечками.', 'Patiekite su jogurtu ir saulėgrąžomis.']], ['Подсушенные семечки вкуснее — 2 минуты на сухой сковороде.', 'Paskrudintos saulėgrąžos skanesnės — 2 min. sausoje keptuvėje.']),
  egg_sandwich: d(1, 3, 8, [[8, 'Сварите яйцо вкрутую.', 'Kietai išvirkite kiaušinį.'], [0, 'Выложите на хлеб ломтики огурца и яйца, поперчите.', 'Ant duonos dėkite agurko ir kiaušinio griežinėlius, papipirinkite.']], ['Сварите несколько яиц сразу — хранятся в холодильнике 5 дней.', 'Išvirkite kelis kiaušinius iš karto — šaldytuve laikosi 5 dienas.']),
  veg_sticks_feta: d(1, 5, 0, [[0, 'Нарежьте морковь, перец и огурец палочками.', 'Morkas, papriką ir agurką supjaustykite lazdelėmis.'], [0, 'Подавайте с фетой.', 'Patiekite su feta.']], ['Палочки можно нарезать на 2 дня вперёд и хранить в воде.', 'Lazdeles galima supjaustyti 2 dienoms į priekį ir laikyti vandenyje.']),
  apple_pb: d(1, 2, 0, [[0, 'Нарежьте яблоко дольками.', 'Obuolį supjaustykite skiltelėmis.'], [0, 'Подавайте с арахисовой пастой.', 'Patiekite su žemės riešutų kremu.']], ['Сбрызните яблоко лимоном — оно не потемнеет.', 'Apšlakstykite obuolį citrina — jis neparuduos.']),
  apple_walnuts: d(1, 3, 0, [[0, 'Нарежьте яблоко.', 'Supjaustykite obuolį.'], [0, 'Подавайте с ягодами и орехами.', 'Patiekite su uogomis ir riešutais.']], ['Подсушенные орехи ароматнее.', 'Paskrudinti riešutai kvapnesni.']),
  kefir_banana: d(1, 3, 0, [[0, 'Нарежьте банан и яблоко.', 'Supjaustykite bananą ir obuolį.'], [0, 'Подавайте с кефиром или взбейте всё в смузи.', 'Patiekite su kefyru arba viską išplakite į kokteilį.']], ['Замороженный банан делает смузи густым, как мороженое.', 'Šaldytas bananas kokteilį padaro tirštą kaip ledai.']),
  curd_honey: d(1, 3, 0, [[0, 'Смешайте творог с ягодами.', 'Varškę sumaišykite su uogomis.'], [0, 'Полейте мёдом.', 'Užpilkite medumi.']], ['Мягкий творог можно взбить блендером — получится крем.', 'Minkštą varškę galima išplakti trintuvu — gausis kremas.']),
  carrot_hummus: d(1, 7, 0, [[0, 'Пюрируйте нут с маслом, солью, лимонным соком и 2 ложками воды.', 'Avinžirnius sutrinkite su aliejumi, druska, citrinos sultimis ir 2 šaukštais vandens.'], [0, 'Нарежьте морковь и огурец палочками и подавайте с пастой.', 'Morkas ir agurką supjaustykite lazdelėmis ir patiekite su užtepėle.']], ['Добавьте зубчик чеснока — получится настоящий хумус.', 'Įdėkite česnako skiltelę — gausis tikras humusas.']),
  yogurt_nuts: d(1, 2, 0, [[0, 'Выложите йогурт в миску.', 'Jogurtą sudėkite į dubenėlį.'], [0, 'Сверху добавьте ягоды и орехи.', 'Ant viršaus sudėkite uogas ir riešutus.']], ['Ложка мёда сделает перекус десертом.', 'Šaukštas medaus užkandį pavers desertu.']),
};

import { GENERATED_DETAILS } from './db/generator';

/** Instructions for any recipe in the database (chef or generated). */
export function getDetail(id: string): RecipeDetail | undefined {
  return DETAILS[id] ?? GENERATED_DETAILS[id];
}
