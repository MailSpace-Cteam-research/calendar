import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Button, Card, Checkbox, ContentBadge, Footnote, Headline, IconButton, SegmentedControl,
  SimpleCell, Snackbar, Text, Title,
} from '@vkontakte/vkui';
import {
  Icon20ChevronLeftOutline, Icon20ChevronRightOutline, Icon20CalendarOutline, Icon20UsersOutline,
  Icon20ClockOutline, Icon20ArticleBoxOutline, Icon20BuildingOutline, Icon20Attach,
  Icon20NotificationOutline, Icon20VideocamOutline, Icon20PollOutline, Icon20SmileOutline,
} from '@vkontakte/icons';
import {
  ANNA0, DAYS, EXT, OLEG, OWN0, POOL, ROOMS, fmt, newForm, pickRoom, shouldGrow, slots,
  type Ev, type Form,
} from './data';
import { PeopleView, Week, WeekLegend } from './Week';
import { EventForm, ParticipantCard, type FormActions } from './EventForm';

type Toast = { id: number; t: string; btn?: string; act?: string } | null;
type St = {
  preset: string; delegated: boolean; view: 'week' | 'people'; form: Form | null; part: Ev | null; pday: number;
  growRule: 'logistics' | 'people3'; saved: Form | null; own: Ev[]; anna: Ev[]; toast: Toast; ans: string | null;
  lastSent: { ev: Ev; owner: string } | null;
};

const PRESETS: Record<string, { t: string; cap: React.ReactNode }> = {
  figma: { t: 'Figma · Неделя + форма', cap: <>Эталон: календарь <b>96:41371</b> с открытой формой <b>96:39656</b>. Форма, иконки и состояния собраны из VKUI; этот сценарий не заменяет остальные сценарии пульта.</> },
  free: { t: 'Свободно', cap: <><b>Попробуйте сами.</b> Кликните в пустую клетку недели — появится короткий поповер. Добавьте участников, переговорку или повтор и посмотрите, как форма растёт.</> },
  s1: { t: 'S1 · Для себя', cap: <><b>Для себя — три строки.</b><ul><li>Название, время с длительностью и ряд «+ добавить». Ни одного пустого поля-плейсхолдера.</li><li>Кнопки занятости нет: подбирать не для кого.</li><li>Длительность — кнопка: нажмите «1 ч».</li></ul></> },
  s2: { t: 'S2 · Встреча на троих', cap: <><b>С первым участником время становится выбором.</b><ul><li>Петя занят в 15:00 — это сказано словами, а не красной ошибкой.</li><li>Под временем три слота, когда свободны все. Наведите на слот — он подсветится на неделе; нажмите — событие переедет. Или перетащите сам блок.</li><li>Подсказки людей появляются, только когда вы в поле участников.</li></ul></> },
  s3: { t: 'S3 · Планёрка 12+', cap: <><b>Большая встреча — сайдбар, неделя на месте.</b><ul><li>Форма выросла сама: добавлены переговорка и повтор. Левая панель свернулась, неделя осталась.</li><li>Вместо 12 полос — тепловая карта с цифрой «11/12» в неполных клетках, где нет двоих и больше — ещё и штриховка.</li><li>Необязательное — блоки VKUI Accordion со строкой-резюме. Переключите «По людям» над сеткой.</li></ul></> },
  s4: { t: 'S4 · Ассистент', cap: <><b>Сначала — чей календарь.</b><ul><li>Владелец в шапке формы; занятость и слоты считаются по календарю Анны.</li><li>У внешних партнёров нет данных — предлагаем им выбрать из трёх слотов.</li><li>Кнопка говорит, от чьего имени уйдёт приглашение.</li></ul></> },
  part: { t: 'Глазами участника', cap: <><b>Участник видит карточку, а не форму организатора.</b><ul><li>Ответ — сразу под временем, рядом конфликт словами.</li><li>Главное действие — подключиться к звонку.</li><li>Детали свёрнуты, личное помечено «видите только вы».</li></ul></> },
};

const DECISIONS: [string, string, string][] = [
  ['Короткий поповер для себя', 'Название, время с длительностью и ряд «+ добавить». Пустые поля не занимают строк: 11 строк → 3.', 'A3, UI-03, C3 · инсайт 5'],
  ['Слоты под временем с первым участником', 'Вход в подбор не ищут: он появляется сам, когда есть кого подбирать, и предлагает время одним кликом.', 'E2 Фогг, C2, NAV-01 · инсайты 1–2'],
  ['Рост в сайдбар — сам, сжатие — вручную', 'Растёт от логистики: переговорка, повтор, описание или файлы, либо 6+ человек. Подбор для 2–5 человек живёт в поповере. Вариант «3+ человек» — в пульте, для теста.', 'INT-01 · риск D4 снят'],
  ['Перенос — перетаскиванием, клик мимо закрывает', 'Блок события тянется по неделе. Клик в пустую клетку закрывает поповер, а черновик сохраняется с кнопкой «Вернуть». Сайдбар на клики по сетке не реагирует.', 'NAV-02, INT-02, D1'],
  ['Неделя не пропадает', 'Занятость — слой на вашей же неделе; при 6+ людях — тепловая карта с цифрами «11/12», не только цветом. «По людям» — вид той же сетки, поля не переезжают.', 'ACC-01, ACC-05 · инсайт 3'],
  ['Блоки со строкой-резюме', 'Переговорка, повтор, описание, файлы, права — Accordion из VKUI. Новая фича — новый блок, высота по умолчанию не растёт.', 'A5, A7 · цель 3 · инсайт 6'],
  ['Сначала — чей календарь', 'Выбор владельца в шапке, только у тех, у кого есть доступ к чужим календарям. Слоты и сетка — по календарю руководителя.', 'INT-04, C5 · инсайт 7'],
  ['Статусы словами, конфликт — не ошибка', '«Петя занят 15:00–16:30» прямо в чипе участника вместо красного блока и зачёркиваний.', 'ACC-01, D5, TXT-03 · инсайт 8'],
  ['Кнопка называет последствие, финал подтверждён', '«Отправить приглашения (12)», затем снекбар «Приглашения отправлены · Отменить».', 'SYS-03, E1, INT-02'],
  ['Участник видит карточку ответа', 'Ответ и «Подключиться» наверху, детали свёрнуты, личное помечено «видите только вы».', 'UI-03 · роли из аудита'],
];

function presetState(k: string, prev: St): St {
  const base: St = { ...prev, preset: k, view: 'week', toast: null, part: null, ans: null, saved: null, own: OWN0.map((x) => ({ ...x })), anna: ANNA0.map((x) => ({ ...x })), lastSent: null, delegated: false };
  if (k === 'figma') base.form = newForm(1, 10, { title: '', people: [], ext: [], call: false });
  if (k === 'free') base.form = null;
  if (k === 's1') base.form = newForm(4, 16, { title: 'Записаться к стоматологу' });
  if (k === 's2') base.form = newForm(2, 15, { title: 'Синк по онбордингу', people: ['Маша', 'Петя'], call: true });
  if (k === 's3') base.form = newForm(2, 14, { title: 'Дизайн-ревью продукта', people: POOL.slice(), call: true, repeat: true, desc: true, files: true, mode: 'side', room: 'Юпитер' });
  if (k === 's4') { base.delegated = true; base.form = newForm(2, 14, { title: 'Встреча с партнёрами «Альфа»', owner: 'anna', ext: EXT.slice(), call: true }); }
  if (k === 'part') { base.form = null; base.part = { d: 2, s: 11.5, e: 12.5, t: 'Дизайн-ревью продукта' }; }
  base.pday = base.form ? base.form.d : 2;
  return base;
}

export default function App() {
  const [s, setS] = useState<St>(() => presetState('s2', { growRule: 'logistics' } as St));
  const [hover, setHover] = useState<number | null>(null);
  const flipFrom = useRef<DOMRect | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const toastId = useRef(1);

  const up = (fn: (n: St) => void) => setS((prev) => { const n: St = structuredClone(prev); fn(n); return n; });
  const toast = (n: St, t: string, btn?: string, act?: string) => { n.toast = { id: toastId.current++, t, btn, act }; };
  const captureRect = () => { const el = document.getElementById('form'); flipFrom.current = el ? el.getBoundingClientRect() : null; };
  const grow = (n: St) => { const f = n.form; if (f && f.mode === 'pop' && shouldGrow(f, n.growRule)) { captureRect(); f.mode = 'side'; } };

  const f = s.form;
  const ownerCal = f && f.owner === 'anna' ? s.anna : s.own;
  const sl = useMemo(() => (f ? slots(f, ownerCal) : []), [f, ownerCal]);
  const anna = !!(f && f.owner === 'anna');
  const events: Ev[] = anna
    ? [...s.own.map((x) => ({ ...x, c: 'dim' })), ...s.anna.map((x) => ({ ...x, c: 'anna' })), ...OLEG.map((x) => ({ ...x, c: 'oleg' }))]
    : s.part ? s.own.filter((x) => !(x.d === s.part!.d && x.s === s.part!.s && x.t === s.part!.t)) : s.own;
  const side = (f && f.mode === 'side') || !!s.part;
  const showSeg = !!(f && f.mode === 'side' && (f.people.length || f.ext.length || f.room));

  const A: FormActions = {
    set: (fn) => up((n) => { if (n.form) fn(n.form); }),
    setPeople: (names) => up((n) => {
      const g = n.form!; g.people = names.filter((x) => POOL.includes(x)); g.ext = names.filter((x) => !POOL.includes(x));
      if (names.length) { g.call = true; g.peopleOpen = true; } else g.call = false;
      grow(n);
    }),
    addBlock: (k) => up((n) => {
      const g = n.form!;
      if (k === 'people') g.peopleOpen = true;
      if (k === 'call') g.call = true;
      if (k === 'room') { g.room = (pickRoom(g, g.d, g.s, g.s + g.len) || ROOMS[2]).n; g.roomAuto = true; }
      if (k === 'repeat') g.repeat = true; if (k === 'desc') g.desc = true; if (k === 'files') g.files = true; if (k === 'place') g.place = true;
      g.open = k; grow(n);
    }),
    grow: () => { captureRect(); up((n) => { n.form!.mode = 'side'; }); },
    shrink: () => up((n) => { n.form!.mode = 'pop'; n.view = 'week'; }),
    close: () => up((n) => { n.form = null; n.part = null; n.view = 'week'; }),
    poll: () => up((n) => toast(n, `Партнёрам ушёл опрос: ${sl.map((c) => DAYS[c.d] + ' ' + fmt(c.s)).join(', ')}`)),
    send: () => up((n) => {
      const g = n.form!, cnt = g.people.length + g.ext.length, ev: Ev = { d: g.d, s: g.s, e: g.s + g.len, t: g.title || 'Новое событие' };
      if (g.owner === 'anna') { n.anna.push(ev); toast(n, `Приглашения отправлены от имени Анны · ${cnt} участникам`, 'Отменить', 'undo'); }
      else { n.own.push(ev); toast(n, cnt ? `Приглашения отправлены ${cnt} участникам${g.room ? ` · ${g.room} забронирована` : ''}` : `Событие «${ev.t}» сохранено`, 'Отменить', 'undo'); }
      n.lastSent = { ev, owner: g.owner }; n.form = null; n.view = 'week';
    }),
    pickSlot: (i) => up((n) => { const c = sl[i]; const g = n.form!; if (c) { g.d = c.d; g.s = c.s; n.pday = c.d; if (g.room && g.roomAuto && c.room) g.room = c.room.n; } }),
    hover: setHover,
  };

  const toastAction = (act?: string) => up((n) => {
    if (act === 'undo' && n.lastSent) { const L = n.lastSent.owner === 'anna' ? n.anna : n.own; const i = L.findIndex((x) => x.t === n.lastSent!.ev.t && x.d === n.lastSent!.ev.d && x.s === n.lastSent!.ev.s); if (i >= 0) L.splice(i, 1); }
    if (act === 'restore' && n.saved) { n.form = n.saved; n.saved = null; }
    if (act === 'unans') n.ans = null;
    n.toast = null;
  });

  // позиционирование поповера возле блока события + анимация роста в сайдбар
  useLayoutEffect(() => {
    const main = mainRef.current, pop = document.querySelector<HTMLElement>('.form.pop');
    // считаем от колонки дня и состояния, а не от блока события: у блока есть анимация top, и замер посреди неё сдвигал поповер
    const col = s.form ? document.querySelectorAll<HTMLElement>('.dcol')[s.form.d] : null;
    if (main && pop && col && s.form) {
      const cr = col.getBoundingClientRect(), y = cr.top + (s.form.s - 10) * 42;
      const r = { left: cr.left, right: cr.right, top: y };
      const m = main.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
      let left = r.right - m.left + 10; if (left + w > m.width - 6) left = r.left - m.left - w - 10;
      const top = Math.max(8, r.top - m.top - 60);
      left = Math.max(6, Math.min(left, m.width - w - 6));
      pop.style.left = left + 'px'; pop.style.top = top + 'px';
      // только задаём нужную высоту, не сбрасывая её: сброс сжимает страницу и сбивает прокрутку
      main.style.minHeight = top + h + 16 + 'px';
    } else if (main) main.style.minHeight = '';
    const el = document.getElementById('form');
    if (flipFrom.current && el && el.classList.contains('side') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const first = flipFrom.current, last = el.getBoundingClientRect();
      el.style.transformOrigin = 'top left'; el.style.transition = 'none';
      el.style.transform = `translate(${first.left - last.left}px,${first.top - last.top}px) scale(${first.width / last.width},${Math.min(first.height / last.height, 1)})`;
      el.style.opacity = '.6'; el.getBoundingClientRect();
      el.style.transition = 'transform .34s cubic-bezier(.2,.7,.2,1), opacity .34s'; el.style.transform = 'none'; el.style.opacity = '1';
    }
    flipFrom.current = null;
  });

  return (
    <div className={'wrap' + (s.preset === 'figma' ? ' figma-mode' : '')}>
      <header className="hdr">
        <Title level="1" weight="1" Component="h1">Концепт формы события</Title>
        <Text className="muted lead">Встреча собирается вокруг людей, а не полей. Для себя — короткий поповер. С первым участником под временем появляются свободные слоты. Когда встреча становится большой, форма сама вырастает в сайдбар, а занятость ложится на вашу же неделю. Всё необязательное — блоки со строкой-резюме. Собрано на VKUI и VK Icons, тема Календаря. Данные выдуманы, «сейчас» — среда, 15 апреля, 13:20.</Text>
        <div className="princ">
          {['Время — следствие людей и комнат', 'Пустое не занимает места', 'Один вход в подбор, когда есть кого подбирать', 'Неделя не пропадает', 'Новая фича — блок, а не строка'].map((t, i) => (
            <ContentBadge key={t} mode="outline" size="l">{i + 1}. {t}</ContentBadge>
          ))}
        </div>
      </header>

      <div className="remote">
        <SegmentedControl size="m" className="presets" value={s.preset} onChange={(v) => { setHover(null); setS((prev) => presetState(String(v), prev)); }}
          options={Object.entries(PRESETS).map(([k, v]) => ({ value: k, label: v.t }))} />
        <div className="remote2">
          <Checkbox checked={s.delegated} onChange={(e) => { const c = e.target.checked; up((n) => { n.delegated = c; if (!c && n.form) n.form.owner = 'me'; }); }}>У меня есть доступ к календарям руководителей</Checkbox>
          <div className="rule"><Footnote className="muted">Рост в сайдбар:</Footnote>
            <SegmentedControl size="m" value={s.growRule} onChange={(v) => up((n) => { n.growRule = v as St['growRule']; grow(n); })}
              options={[{ value: 'logistics', label: 'логистика или 6+ людей' }, { value: 'people3', label: '3+ людей' }]} />
          </div>
        </div>
      </div>
      <Card mode="outline" className="cap"><Text>{PRESETS[s.preset].cap}</Text></Card>

      <div className="frame">
        <div className="app">
          <nav className="nav" aria-label="Навигация">
            {s.preset === 'figma' ? <>
              <IconButton className="nav-logo" label="VK WorkSpace"><Icon20CalendarOutline /></IconButton>
              <IconButton label="Главная"><Icon20ClockOutline /></IconButton>
              <IconButton label="Сообщения"><Icon20NotificationOutline /></IconButton>
              <IconButton label="Почта"><Icon20ArticleBoxOutline /></IconButton>
              <IconButton className="nav-active" label="Календарь"><Icon20CalendarOutline /></IconButton>
              <IconButton label="Облако"><Icon20Attach /></IconButton>
              <IconButton label="Документы"><Icon20ArticleBoxOutline /></IconButton>
              <IconButton label="Задачи"><Icon20PollOutline /></IconButton>
              <IconButton label="Звонки"><Icon20VideocamOutline /></IconButton>
              <IconButton label="Сотрудники"><Icon20UsersOutline /></IconButton>
              <IconButton label="Сервисы"><Icon20BuildingOutline /></IconButton>
              <IconButton label="Нейропомощник"><Icon20SmileOutline /></IconButton>
            </> : <><span className="logo" /><i /><i /><i className="on" /><i /><i /><i /></>}
          </nav>
          <aside className={'left' + (side ? ' hide' : '')}>
            <div><Button size="l" mode="secondary" stretched onClick={() => up((n) => { n.part = null; n.form = newForm(3, 12); n.preset = 'free'; })}>Новое событие</Button></div>
            <div>
              <Headline level="2" weight="2" className="mmh">{s.preset === 'figma' ? 'Апрель 2023' : 'Апрель 2026'}</Headline>
              <div className="mm">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((x) => <span key={x}>{x}</span>)}
                {[30, 31].map((x) => <span key={'p' + x}>{x}</span>)}
                {Array.from({ length: 30 }, (_, i) => i + 1).map((x) => <b key={x} className={x === (s.preset === 'figma' ? 7 : 15) ? 't' : x >= (s.preset === 'figma' ? 6 : 13) && x <= (s.preset === 'figma' ? 12 : 17) ? 'w' : ''}>{x}</b>)}
              </div>
            </div>
            <div className="cals">
              <Footnote className="muted">Мои</Footnote>
              <SimpleCell before={<i className="cal" style={{ background: 'color-mix(in srgb, var(--vkui--color_background_accent) 16%, var(--vkui--color_background_content))' }} />}>Основной</SimpleCell>
              <SimpleCell before={<i className="cal" style={{ background: 'var(--vkui--color_background_positive_tint)' }} />}>Команда</SimpleCell>
              {s.delegated && (<>
                <Footnote className="muted">Мне доступны</Footnote>
                <SimpleCell before={<i className="cal" style={{ background: 'var(--owner)' }} />}>Анна Смирнова</SimpleCell>
                <SimpleCell before={<i className="cal" style={{ border: '1.5px dashed var(--owner2)' }} />}>Олег Ким</SimpleCell>
              </>)}
            </div>
          </aside>
          <section className="main" ref={mainRef}>
            <div className="tb">
              <Button size="m" mode="secondary">Сегодня</Button>
              <IconButton label="Предыдущая неделя"><Icon20ChevronLeftOutline /></IconButton>
              <IconButton label="Следующая неделя"><Icon20ChevronRightOutline /></IconButton>
              <Headline level="1" weight="2">{s.preset === 'figma' ? '6 апреля – 12 апреля' : '13 — 17 апреля 2026'}</Headline>
              <span className="sp" />
              {s.preset === 'figma' && <div className="figma-view-nav" role="group" aria-label="Вид календаря">
                <Button size="m" mode="tertiary" onClick={() => up((n) => { n.view = 'week'; })}>День</Button>
                <Button size="m" mode="tertiary" className="selected">Неделя</Button>
                <Button size="m" mode="tertiary" onClick={() => up((n) => { n.form = null; n.preset = "free"; })}>Месяц</Button>
                <Button size="m" mode="tertiary" onClick={() => up((n) => { n.form = null; n.preset = "free"; })}>Год</Button>
                <Button size="m" mode="tertiary" onClick={() => up((n) => { n.view = "week"; })}>Расписание</Button>
                <Button size="m" mode="tertiary" onClick={() => up((n) => { n.form = newForm(1, 10); })}>Фильтр</Button>
              </div>}
              {showSeg && <SegmentedControl size="m" className="viewseg" value={s.view} onChange={(v) => up((n) => { n.view = v as St['view']; n.pday = n.form!.d; })}
                options={[{ value: 'week', label: 'Неделя' }, { value: 'people', label: 'По людям' }]} />}
            </div>
            <div className="grid">
              {s.view === 'people' && showSeg && f
                ? <PeopleView f={f} day={s.pday} cal={ownerCal} onDay={(d) => up((n) => { n.pday = d; })} onPick={(h) => up((n) => { const g = n.form!; g.d = n.pday; g.s = Math.min(h, 18 - g.len); })} />
                : <>
                    <Week figma={s.preset === 'figma'} form={f} part={s.part} events={events} cal={ownerCal} slotList={sl} hover={hover} anna={anna}
                      onCreate={(d, h) => up((n) => { n.part = null; n.form = newForm(d, h); n.preset = 'free'; })}
                      onOutside={() => up((n) => { const g = n.form!; if (g.title || g.people.length || g.ext.length) { n.saved = structuredClone(g); toast(n, `Черновик «${g.title || 'Новое событие'}» сохранён`, 'Вернуть', 'restore'); } n.form = null; n.view = 'week'; })}
                      onMove={(d, h) => up((n) => { if (n.form) { n.form.d = d; n.form.s = h; n.pday = d; } })} />
                    <WeekLegend f={f} anna={anna} />
                  </>}
            </div>
            {!f && !s.part && <Card mode="shadow" className="empty"><Text>Кликните в пустую клетку, чтобы создать событие</Text></Card>}
            {f && f.mode === 'pop' && <EventForm f={f} cal={ownerCal} sl={sl} delegated={s.delegated} A={A} />}
          </section>
          {f && f.mode === 'side' ? <EventForm f={f} cal={ownerCal} sl={sl} delegated={s.delegated} A={A} />
            : s.part ? <ParticipantCard p={s.part} own={s.own} ans={s.ans}
                onAns={(a) => up((n) => { n.ans = a; toast(n, a === 'Не иду' ? 'Вы отказались · организатор получит уведомление' : a === 'Иду' ? 'Вы идёте' : 'Ответ: может быть', 'Изменить', 'unans'); })}
                onPropose={() => up((n) => toast(n, 'Откроется ваша неделя со свободными слотами — выберите и отправьте организатору'))}
                onClose={() => up((n) => { n.part = null; })} />
            : <span />}
        </div>
      </div>

      <Title level="2" weight="2" Component="h2" className="sech">Что поменяли и почему</Title>
      <div className="dec">
        {DECISIONS.map(([h, p, src]) => (
          <Card key={h} mode="outline" className="deccard">
            <Headline level="1" weight="2">{h}</Headline>
            <Footnote className="muted">{p}</Footnote>
            <Footnote className="src" weight="2">{src}</Footnote>
          </Card>
        ))}
      </div>

      {s.toast && (
        <Snackbar key={s.toast.id} duration={5000} placement="bottom"
          action={s.toast.btn} onActionClick={() => toastAction(s.toast!.act)}
          onClose={() => up((n) => { n.toast = null; })} onClosed={() => {}}>
          {s.toast.t}
        </Snackbar>
      )}
    </div>
  );
}
