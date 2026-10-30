// Выдуманные данные и чистая логика подбора времени. «Сейчас» — среда, 15 апреля, 13:20.
export const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
export const DATES = [13, 14, 15, 16, 17];
export const DAYF = ['Пн, 13 апр', 'Вт, 14 апр', 'Ср, 15 апр', 'Чт, 16 апр', 'Пт, 17 апр'];
export const H0 = 10, H1 = 18, RH = 42;
export const NOW = { d: 2, h: 13.5 };

export type Ev = { d: number; s: number; e: number; t: string; c?: string };
export type Room = { n: string; cap: number; fl: string; busy: number[][] };
export type Form = {
  mode: 'pop' | 'side'; title: string; d: number; s: number; len: number;
  people: string[]; ext: string[]; room: string | null; roomAuto: boolean;
  repeat: boolean; call: boolean; desc: boolean; files: boolean; place: boolean;
  open: string | null; owner: 'me' | 'anna'; peopleOpen?: boolean; filesAccess?: string; eventColor?: string;
};

export const fmt = (h: number) => { const m = Math.round((h % 1) * 60); return `${Math.floor(h)}:${m < 10 ? '0' + m : m}`; };
export const durT = (l: number) => (l === 0.5 ? '30 мин' : l === 1 ? '1 ч' : l === 1.5 ? '1,5 ч' : `${l} ч`);
export const ov = (a: number, b: number, c: number, d: number) => a < d && c < b;

const FEM = new Set(['Маша', 'Алиса', 'Катя', 'Лена', 'Юля', 'Вера', 'Анна']);
export const gender = (n: string, m: string, f: string) => (FEM.has(n) ? f : m);

/** Индекс градиента VKUI Avatar (1–6) — стабильный для имени */
export const grad = (n: string) => ((n.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;

export const OWN0: Ev[] = [
  { d: 0, s: 10, e: 11, t: 'Планёрка команды' }, { d: 1, s: 12, e: 13, t: 'Демо Почты', c: 'g' },
  { d: 2, s: 11, e: 12, t: 'Воркшоп Lottie', c: 'g' }, { d: 3, s: 14, e: 15, t: '1:1 с лидом' },
  { d: 4, s: 10, e: 11, t: 'Ревью макетов' }, { d: 4, s: 14, e: 15.5, t: 'Груминг' },
];
export const ANNA0: Ev[] = [
  { d: 0, s: 12, e: 13, t: 'Совет директоров' }, { d: 1, s: 10, e: 12, t: 'Стратсессия' },
  { d: 2, s: 14, e: 15, t: 'Интервью' }, { d: 3, s: 11, e: 12, t: 'Клиент «Бета»' }, { d: 4, s: 13, e: 14, t: 'Обед с партнёром' },
];
export const OLEG: Ev[] = [{ d: 1, s: 15, e: 16, t: 'Бюджет' }, { d: 3, s: 16, e: 17, t: 'Найм' }];
export const BUSY: Record<string, number[][]> = {
  'Маша': [[1, 14, 16], [2, 12, 14]], 'Петя': [[2, 15, 16.5], [3, 11, 12.5]], 'Алиса': [[2, 10, 11], [4, 13, 15]],
  'Иван': [[0, 15, 17], [2, 16.5, 17.5]], 'Олег': [[1, 10, 11], [3, 15, 16]], 'Катя': [[0, 12, 13], [2, 10.5, 11.5]],
  'Дима': [[1, 16, 17.5], [4, 11, 12]], 'Лена': [[0, 10, 11.5], [3, 16, 17]], 'Саша': [[2, 17, 18], [4, 15, 16]],
  'Юля': [[1, 11, 12], [3, 13, 14]], 'Рома': [[0, 14, 15], [3, 10, 11]], 'Вера': [[3, 10, 10.5], [4, 16.5, 17.5]],
};
export const POOL = Object.keys(BUSY);
export const FREQUENT = ['Маша', 'Петя', 'Алиса'];
export const EXT = ['ivanov@alfa.ru', 'petrova@alfa.ru'];
export const ROOMS: Room[] = [
  { n: 'Марс', cap: 4, fl: '3 эт.', busy: [[2, 14, 15]] },
  { n: 'Сатурн', cap: 8, fl: '5 эт.', busy: [[3, 10, 11]] },
  { n: 'Юпитер', cap: 14, fl: '5 эт.', busy: [[2, 15, 15.5]] },
];
export const roomBy = (n: string | null) => ROOMS.find((r) => r.n === n) || null;

export const newForm = (d: number, s: number, o: Partial<Form> = {}): Form => ({
  mode: 'pop', title: '', d, s, len: 1, people: [], ext: [], room: null, roomAuto: true,
  repeat: false, call: false, desc: false, files: false, place: false, open: 'people', owner: 'me', filesAccess: 'members', ...o,
});

export function busyNames(f: Form, d: number, s: number, e: number) {
  return f.people.filter((p) => (BUSY[p] || []).some((b) => b[0] === d && ov(s, e, b[1], b[2])));
}
export const ownerBusy = (cal: Ev[], d: number, s: number, e: number) => cal.find((x) => x.d === d && ov(s, e, x.s, x.e));
export const roomFree = (r: Room, d: number, s: number, e: number) => !r.busy.some((b) => b[0] === d && ov(s, e, b[1], b[2]));
export const pickRoom = (f: Form, d: number, s: number, e: number) =>
  ROOMS.filter((r) => r.cap >= f.people.length + 1).find((r) => roomFree(r, d, s, e)) || null;

export type Slot = { d: number; s: number; miss: string[]; room: Room | null };
export function slots(f: Form, cal: Ev[]): Slot[] {
  if (!f.people.length && !f.ext.length) return [];
  const res: Slot[] = [], cands: Slot[] = [];
  for (let d = NOW.d; d < 5; d++)
    for (let h = d === NOW.d ? Math.max(NOW.h, H0) : H0; h + f.len <= H1; h += 0.5) {
      if (ownerBusy(cal, d, h, h + f.len)) continue;
      const miss = busyNames(f, d, h, h + f.len);
      let room: Room | null = null;
      if (f.room) { room = pickRoom(f, d, h, h + f.len); if (!room) continue; }
      cands.push({ d, s: h, miss, room });
    }
  const pick = (max: number) => {
    for (const c of cands) {
      if (res.length >= 3) break;
      if (c.miss.length > max) continue;
      if (res.some((r) => r.d === c.d && Math.abs(r.s - c.s) < 1)) continue;
      res.push(c);
    }
  };
  pick(0); if (res.length < 3) pick(1); if (res.length < 3) pick(2);
  return res.sort((a, b) => a.d - b.d || a.s - b.s);
}
export function personStatus(f: Form, n: string) {
  const e = f.s + f.len;
  if (!BUSY[n]) return { t: 'нет данных', k: '' };
  const b = BUSY[n].filter((x) => x[0] === f.d && ov(f.s, e, x[1], x[2]));
  if (b.length) return { t: `${gender(n, 'занят', 'занята')} ${b.map((x) => fmt(x[1]) + '–' + fmt(x[2])).join(', ')}`, k: 'warn' };
  return { t: gender(n, 'свободен', 'свободна'), k: 'ok' };
}
export const shouldGrow = (f: Form, rule: string) =>
  f.people.length + f.ext.length >= (rule === 'people3' ? 3 : 6) || !!f.room || f.repeat || f.desc || f.files;
export const plural = (n: number) => (n === 1 ? 'участник' : n < 5 ? 'участника' : 'участников');
