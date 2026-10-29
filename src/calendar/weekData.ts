// Выдуманные данные недели из макета Figma «Неделя» (6–12 апреля). «Сейчас» — вторник, 7 апреля, 11:30.

/** Цвет события — ключ токенов темы calendar: --vkui--calendar_color_event_<c>, ..._event_text_<c>, ..._background_<c>_tint */
export type EventColor = 'main_sky' | 'mint' | 'violet' | 'pink';

/** Градиенты событий из макета — данных для них в теме нет */
export const GRADIENTS = {
  violet: 'linear-gradient(144.66deg, color-mix(in srgb, #afe1ff 90%, transparent) 18.68%, var(--vkui--calendar_color_event_violet) 111.01%)',
  pink: 'linear-gradient(153.81deg, #f4deff 14.2%, #badeff 87.24%)',
} as const;

/**
 * accepted — участие подтверждено (цветное или градиентное),
 * invite — не подтверждено (пунктир),
 * maybe — «возможно приду» (голубая штриховка).
 */
export type EventStatus = 'accepted' | 'invite' | 'maybe';

export type CalEvent = {
  id: string;
  /** 0 — понедельник */
  day: number;
  /** начало и конец в часах: 11.5 = 11:30 */
  s: number;
  e: number;
  title: string;
  status: EventStatus;
  color: EventColor;
  gradient?: keyof typeof GRADIENTS;
  /** полоска цвета календаря слева — у событий со своим цветом */
  mark?: boolean;
  /** камера — есть ссылка на встречу */
  call?: boolean;
  /** скрепка — есть вложение */
  attach?: boolean;
};

export type AllDayEvent = { day: number; title: string; color: EventColor; more?: number };

export const WEEK = {
  title: '6 апреля - 12 апреля',
  dates: [6, 7, 8, 9, 10, 11, 12],
  weekdays: ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'],
  today: 1,
};

export const NOW = { day: 1, h: 11.5 };

export const HOUR = 56;
/** первый видимый час при открытии */
export const START_HOUR = 9;
/** шаг перетаскивания и растягивания — 15 минут */
export const STEP = 0.25;

export const ALL_DAY: AllDayEvent[] = [
  { day: 0, title: '🎉 Сергей Зеленов', color: 'main_sky', more: 8 },
  { day: 1, title: '🎉 Сергей Зеленов', color: 'main_sky', more: 8 },
  { day: 2, title: '«Стахановское движение»', color: 'main_sky' },
];

export const EVENTS: CalEvent[] = [
  { id: 'm1', day: 0, s: 11, e: 11.5, title: '🦊 Еженедельный синк', status: 'accepted', color: 'main_sky' },
  { id: 'm2', day: 0, s: 13, e: 14, title: 'Обсуждение поиска', status: 'accepted', color: 'main_sky', attach: true },
  { id: 'm3', day: 0, s: 14, e: 14.5, title: 'Карточка контакта', status: 'accepted', color: 'main_sky' },

  { id: 't1', day: 1, s: 10, e: 11, title: 'Обновить документацию', status: 'accepted', color: 'main_sky', gradient: 'violet', mark: true, attach: true, call: true },
  { id: 't2', day: 1, s: 12, e: 12.5, title: 'Улучшаем NPS нашего сервиса', status: 'accepted', color: 'main_sky' },
  { id: 't3', day: 1, s: 13, e: 13.5, title: 'Заметки. Возвращение', status: 'accepted', color: 'main_sky' },

  { id: 'w1', day: 2, s: 11, e: 11.25, title: 'Обсудить аттачи и ссылки', status: 'accepted', color: 'main_sky' },
  { id: 'w2', day: 2, s: 12, e: 14, title: 'Design & Product review Productivity', status: 'accepted', color: 'main_sky', call: true },
  { id: 'w3', day: 2, s: 14, e: 15, title: 'Подготовить воркшоп', status: 'accepted', color: 'mint', call: true },
  { id: 'w4', day: 2, s: 15, e: 15.5, title: 'Обсуждение поиска', status: 'accepted', color: 'main_sky' },

  { id: 'h1', day: 3, s: 11, e: 12, title: 'Воркшоп Lottie', status: 'accepted', color: 'mint' },
  { id: 'h2', day: 3, s: 12, e: 13, title: 'Задачи', status: 'invite', color: 'main_sky', call: true },

  { id: 'f1', day: 4, s: 11, e: 12, title: 'Улучшаем NPS нашего сервиса', status: 'maybe', color: 'main_sky', call: true },
  { id: 'f2', day: 4, s: 12, e: 12.5, title: 'Планирование квартала', status: 'accepted', color: 'main_sky' },
  { id: 'f3', day: 4, s: 13, e: 14, title: 'Демо Почты', status: 'accepted', color: 'main_sky' },
  { id: 'f4', day: 4, s: 14, e: 15, title: 'Демо Облака', status: 'accepted', color: 'main_sky' },
];

/** Мини-календарь: как в макете, апрель начинается со среды */
export const MONTH = { title: 'Апрель 2023', firstWeekday: 2, days: 30, prevDays: 31, today: 7 };

export const fmt = (h: number) => {
  const m = Math.round((h % 1) * 60);
  return `${String(Math.floor(h)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const plural = (n: number, one: string, few: string, many: string) => {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
};

/** «45 минут», «1 час», «1 час 15 минут» */
export const durationText = (hours: number) => {
  const total = Math.round(hours * 60), h = Math.floor(total / 60), m = total % 60;
  const hh = h ? `${h} ${plural(h, 'час', 'часа', 'часов')}` : '';
  const mm = m ? `${m} ${plural(m, 'минута', 'минуты', 'минут')}` : '';
  return [hh, mm].filter(Boolean).join(' ');
};
