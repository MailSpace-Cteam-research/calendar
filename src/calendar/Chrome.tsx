// Обвязка Календаря из макета: навбар сервисов, левая панель, шапка сетки.
// Свои компоненты на Tappable — ради pixel perfect к макету Figma; иконки — @vkontakte/icons.
import { Avatar, Tappable } from '@vkontakte/vkui';
import {
  Icon16Chevron, Icon16ChevronLeft, Icon20Add, Icon20CheckBoxOn, Icon20ChevronLeftOutline, Icon20ChevronRight2,
  Icon20ChevronRightOutline, Icon20Dropdown, Icon20GearOutline, Icon20LogoVkWorkspaceOutline, Icon20PrinterOutline,
  Icon24CalendarOutline, Icon24CheckSquareOutline, Icon24CloudOutline, Icon24DocumentOutline, Icon24HomeOutline,
  Icon24ListBulletSquareOutline, Icon24MailOutline, Icon24MessageOutline, Icon24PhoneOutline, Icon24PollOutline,
  Icon24ScribblePencilRectangleOutline, Icon24SearchStarsOutline, Icon24ServicesOutline, Icon24StarsOutline,
  Icon24UsersOutline,
} from '@vkontakte/icons';
import { MONTH, WEEK } from './weekData';

const SERVICES = [
  ['Главная', Icon24HomeOutline], ['Мессенджер', Icon24MessageOutline], ['Почта', Icon24MailOutline],
  ['Календарь', Icon24CalendarOutline], ['Диск', Icon24CloudOutline], ['Документы', Icon24DocumentOutline],
  ['Заметки', Icon24ScribblePencilRectangleOutline], ['Задачи', Icon24CheckSquareOutline], ['Звонки', Icon24PhoneOutline],
  ['Опросы', Icon24PollOutline], ['Контакты', Icon24UsersOutline], ['Списки', Icon24ListBulletSquareOutline],
  ['Ассистент', Icon24StarsOutline], ['Поиск', Icon24SearchStarsOutline], ['Все сервисы', Icon24ServicesOutline],
] as const;

export function NavBar() {
  return (
    <nav className="cal-nav">
      <div className="cal-nav__logo"><Icon20LogoVkWorkspaceOutline /></div>
      <div className="cal-nav__list">
        {SERVICES.map(([name, Icon]) => (
          <Tappable key={name} className={'cal-nav__item' + (name === 'Календарь' ? ' is-active' : '')} aria-label={name}>
            <Icon />
          </Tappable>
        ))}
      </div>
      <div className="cal-nav__bottom">
        <div className="cal-nav__profile"><Avatar size={32} initials="СЗ" gradientColor="blue" /></div>
        <Tappable className="cal-nav__item" aria-label="Развернуть"><Icon20ChevronRight2 /></Tappable>
      </div>
    </nav>
  );
}

function MiniMonth() {
  const cells: { n: number; muted: boolean; today?: boolean }[] = [];
  for (let i = MONTH.firstWeekday - 1; i >= 0; i--) cells.push({ n: MONTH.prevDays - i, muted: true });
  for (let n = 1; n <= MONTH.days; n++) {
    const wd = (MONTH.firstWeekday + n - 1) % 7;
    cells.push({ n, muted: wd >= 5, today: n === MONTH.today });
  }
  for (let n = 1; cells.length % 7; n++) cells.push({ n, muted: true });
  return (
    <div className="cal-month">
      <div className="cal-month__head">
        <Tappable className="cal-icon-btn" aria-label="Предыдущий месяц"><Icon20ChevronLeftOutline /></Tappable>
        <div className="cal-month__title">{MONTH.title}</div>
        <Tappable className="cal-icon-btn" aria-label="Следующий месяц"><Icon20ChevronRightOutline /></Tappable>
      </div>
      <div className="cal-month__row">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => <div key={d} className="cal-month__cell">{d}</div>)}
      </div>
      <div className="cal-month__grid">
        {cells.map((c, i) => (
          <Tappable key={i} className={'cal-month__cell' + (c.muted ? ' is-muted' : '') + (c.today ? ' is-today' : '')}>
            {c.n}
          </Tappable>
        ))}
      </div>
    </div>
  );
}

function Group({ title, items }: { title: string; items?: { t: string; color: string }[] }) {
  return (
    <div className="cal-group">
      <div className="cal-group__row">
        <Icon20Dropdown className="cal-group__chevron" />
        <div className="cal-group__title">{title}</div>
        <Tappable className="cal-icon-btn" aria-label={`Добавить: ${title}`}><Icon20Add /></Tappable>
      </div>
      {items?.map((it) => (
        <Tappable key={it.t} className="cal-group__item">
          <Icon20CheckBoxOn style={{ color: it.color }} />
          <span>{it.t}</span>
        </Tappable>
      ))}
    </div>
  );
}

export function Sidebar({ onCreate }: { onCreate?: () => void }) {
  return (
    <aside className="cal-side">
      <div className="cal-side__compose">
        <Tappable className="cal-compose" onClick={onCreate}>Новое событие</Tappable>
      </div>
      <MiniMonth />
      <div className="cal-side__list">
        <Group title="Личные" items={[
          { t: 'Основной', color: 'var(--vkui--calendar_color_event_main_sky)' },
          { t: 'Команда', color: 'var(--vkui--calendar_color_event_mint)' },
        ]} />
        <Group title="Из других сервисов" />
        <Group title="События" />
      </div>
      <div className="cal-side__bottom">
        <Tappable className="cal-side__btn"><Icon20PrinterOutline />Распечатать неделю</Tappable>
        <Tappable className="cal-side__btn"><Icon20GearOutline />Настройки</Tappable>
      </div>
    </aside>
  );
}

export function GridNav() {
  return (
    <div className="cal-gridnav">
      <Tappable className="cal-btn cal-btn--secondary">Сегодня</Tappable>
      <Tappable className="cal-btn cal-btn--icon" aria-label="Предыдущая неделя"><Icon16ChevronLeft /></Tappable>
      <Tappable className="cal-btn cal-btn--icon" aria-label="Следующая неделя"><Icon16Chevron /></Tappable>
      <div className="cal-gridnav__title">{WEEK.title}</div>
      {['День', 'Неделя', 'Месяц', 'Год', 'Расписание'].map((t) => (
        <Tappable key={t} className={'cal-btn cal-btn--tab' + (t === 'Неделя' ? ' is-active' : '')}>{t}</Tappable>
      ))}
      <Tappable className="cal-btn cal-btn--filter">Фильтр</Tappable>
    </div>
  );
}
