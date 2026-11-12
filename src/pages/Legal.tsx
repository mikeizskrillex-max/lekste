import { TopBar } from '../components/ui';
import { useI18n } from '../i18n/I18n';

const TEXT = {
  privacy: {
    lt: ['Privatumo politika', 'JUODRAŠTIS — prieš paleidimą turi patikrinti teisininkas.', 'Tvarkome: el. paštą, amžių, lytį, ūgį, svorį, tikslą, alergijas ir mitybos pageidavimus. Sveikatos duomenis tvarkome tik gavę jūsų aiškų sutikimą ir tik meniu sudaryti.', 'Duomenis galite atsisiųsti arba ištrinti paskyros nustatymuose bet kuriuo metu.', 'Mokėjimus tvarko Stripe; kortelės duomenų nesaugome.'],
    ru: ['Политика конфиденциальности', 'ЧЕРНОВИК — перед запуском должен проверить юрист.', 'Мы обрабатываем: email, возраст, пол, рост, вес, цель, аллергии и пищевые предпочтения. Данные о здоровье обрабатываем только с вашего явного согласия и только для составления меню.', 'Данные можно скачать или удалить в настройках кабинета в любой момент.', 'Платежи обрабатывает Stripe; данные карты мы не храним.'],
  },
  terms: {
    lt: ['Naudojimo sąlygos', 'JUODRAŠTIS — prieš paleidimą turi patikrinti teisininkas.', 'Prenumerata atsinaujina automatiškai. Apie nuskaitymą primename prieš 3 dienas. Atšaukti galite nustatymuose vienu paspaudimu.', 'Paslauga nėra medicininė rekomendacija. Sergant, esant nėštumui ar sunkiai alergijai, pasitarkite su gydytoju.'],
    ru: ['Условия использования', 'ЧЕРНОВИК — перед запуском должен проверить юрист.', 'Подписка продлевается автоматически. О списании напоминаем за 3 дня. Отменить можно в настройках одним нажатием.', 'Сервис не является медицинской рекомендацией. При заболеваниях, беременности или тяжёлой аллергии посоветуйтесь с врачом.'],
  },
};

export function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  const { lang } = useI18n();
  const [title, draft, ...body] = TEXT[kind][lang];
  return (
    <div className="min-h-screen bg-bg">
      <TopBar />
      <main className="container-app pb-16">
        <h1 className="mt-4 font-display text-[24px] font-extrabold">{title}</h1>
        <p className="mt-2 rounded-xl bg-warm/40 p-3 text-[13px] font-semibold">{draft}</p>
        {body.map((p) => <p key={p} className="mt-3 text-[15px]">{p}</p>)}
      </main>
    </div>
  );
}
