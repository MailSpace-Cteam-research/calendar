import { useState } from 'react';
import {
  Accordion, Avatar, Button, Card, ChipsSelect, CustomSelect, CustomSelectOption, Footnote, IconButton, SimpleCell,
  Input, Link, MiniInfoCell, Radio, SegmentedControl, Tappable, Text,
} from '@vkontakte/vkui';
import { Chip } from '@vkontakte/vkui';
import {
  Icon16Add, Icon20ArticleBoxOutline, Icon20Attach, Icon20BuildingOutline, Icon20Cancel,
  Icon20CheckCircleOn, Icon20ClockOutline, Icon20FullscreenExitOutline, Icon20FullscreenOutline,
  Icon20NotificationOutline, Icon20PlaceOutline, Icon20PollOutline, Icon20RefreshOutline,
  Icon20Users3Outline, Icon20UsersOutline, Icon20VideocamOutline, Icon20WarningTriangleOutline,
  Icon20SmileOutline, Icon20Stars, Icon16Dropdown, Icon20CalendarOutline, Icon20DropdownOutline,
} from '@vkontakte/icons';
import {
  DAYF, DAYS, FREQUENT, H1, POOL, ROOMS, busyNames, durT, fmt, gender, grad, ownerBusy, personStatus,
  plural, roomBy, roomFree, type Ev, type Form, type Slot,
} from './data';

export type FormActions = {
  set: (fn: (f: Form) => void) => void;
  setPeople: (names: string[]) => void;
  addBlock: (k: string) => void;
  grow: () => void; shrink: () => void; close: () => void; send: () => void; poll: () => void;
  pickSlot: (i: number) => void; hover: (i: number | null) => void;
};

const Dot = ({ k }: { k: 'ok' | 'warn' | 'mut' }) => <span className={'dot ' + k} aria-hidden />;

function TimeBlock({ f, cal, sl, A }: { f: Form; cal: Ev[]; sl: Slot[]; A: FormActions }) {
  const e = f.s + f.len, bn = busyNames(f, f.d, f.s, e), ob = ownerBusy(cal, f.d, f.s, e);
  const room = roomBy(f.room);
  const st: React.ReactNode[] = [];
  if (ob) st.push(<span key="o" className="warn"><Dot k="warn" />{f.owner === 'anna' ? 'У Анны' : 'У вас'} в это время «{ob.t}»</span>);
  if (f.people.length) st.push(bn.length
    ? <span key="b" className="warn"><Dot k="warn" />{bn.map((n) => `${n} ${gender(n, 'занят', 'занята')}`).join(', ')}</span>
    : !ob ? <span key="b" className="ok"><Dot k="ok" />Все свободны</span> : null);
  if (f.ext.length) st.push(<span key="x" className="mut"><Dot k="mut" />у {f.ext.length} внешних нет данных о занятости</span>);
  if (room && !f.roomAuto && !roomFree(room, f.d, f.s, e)) st.push(<span key="r" className="warn"><Dot k="warn" />{room.n} занята</span>);
  return (
    <div className="row">
      <Icon20ClockOutline className="ric" />
      <div className="c">
        <div className="time">
          <Text>{DAYF[f.d]}</Text><Text>{fmt(f.s)} — {fmt(e)}</Text>
          <Button size="s" mode="secondary" onClick={() => A.set((x) => { x.len = x.len === 0.5 ? 1 : x.len === 1 ? 1.5 : 0.5; if (x.s + x.len > H1) x.s = H1 - x.len; })}>{durT(f.len)}</Button>
        </div>
        {st.length > 0 && <Footnote className="st">{st}</Footnote>}
        {sl.length > 0 && (<>
          <Footnote className="muted">{f.people.length ? 'Когда все свободны' : 'Свободное время'}{f.room ? ' и есть переговорка' : ''}:</Footnote>
          <div className="slots" onMouseLeave={() => A.hover(null)}>
            {sl.map((c, i) => {
              const sel = c.d === f.d && c.s === f.s;
              const label = (!c.miss.length ? (f.ext.length && !f.people.length ? (f.owner === 'anna' ? 'Анна свободна' : 'вы свободны') : 'все свободны') : `нет: ${c.miss.join(', ')}`) + (c.room && f.room ? ` · ${c.room.n}` : '');
              return (
                <Tappable key={i} className={'slot' + (sel ? ' sel' : '') + (c.miss.length ? ' w' : '')} aria-pressed={sel}
                  onClick={() => A.pickSlot(i)} onMouseEnter={() => A.hover(i)} onFocus={() => A.hover(i)} onBlur={() => A.hover(null)}>
                  <Text weight="2">{DAYS[c.d]} {fmt(c.s)}</Text>
                  <Footnote className="muted"><Dot k={c.miss.length ? 'warn' : 'ok'} />{label}</Footnote>
                </Tappable>
              );
            })}
          </div>
        </>)}
        {f.ext.length > 0 && <Button mode="tertiary" size="m" before={<Icon20PollOutline />} onClick={A.poll} className="left">Опрос для внешних: 3 слота</Button>}
      </div>
    </div>
  );
}

function People({ f, A }: { f: Form; A: FormActions }) {
  const chosen = [...f.people, ...f.ext];
  const options = [
    ...[...FREQUENT, ...POOL.filter((n) => !FREQUENT.includes(n))].filter((n) => !chosen.includes(n)).map((n) => ({ value: n, label: n })),
    ...(f.people.length < POOL.length ? [{ value: '__team', label: 'Команда дизайна · 12' }] : []),
  ];
  return (
    <ChipsSelect
      placeholder="Имя, почта или группа"
      value={chosen.map((n) => ({ value: n, label: n }))}
      options={options}
      creatable="Пригласить по почте"
      emptyText="Никого не нашли — введите почту"
      forceDropdownPortal
      closeAfterSelect
      onChange={(v) => {
        const names = v.map((o) => String(o.value));
        A.setPeople(names.includes('__team') ? [...new Set([...names.filter((n) => n !== '__team'), ...POOL])] : names);
      }}
      renderOption={(props, option) => (
        <CustomSelectOption {...props}
          before={option.value === '__team' ? <Icon20Users3Outline /> : <Avatar size={24} initials={String(option.label)[0]} gradientColor={grad(String(option.label))} />}
          description={option.value === '__team' ? 'добавить всех' : FREQUENT.includes(String(option.value)) ? 'часто с вами' : undefined} />
      )}
      renderChip={(props, option) => {
        const n = String(option.value), s = personStatus(f, n);
        return (
          <Chip {...props} before={<Avatar size={20} initials={n[0].toUpperCase()} gradientColor={grad(n)} />}>
            {n} <span className={'chipst ' + s.k}>{s.t}</span>
          </Chip>
        );
      }}
    />
  );
}

type Blk = { k: string; icon: React.ReactNode; name: string; me?: boolean; on: (f: Form) => boolean; sum: (f: Form) => string; body: (f: Form, A: FormActions) => React.ReactNode };
const BLOCKS: Blk[] = [
  { k: 'people', icon: <Icon20UsersOutline />, name: 'Участники', on: (f) => f.people.length + f.ext.length > 0 || !!f.peopleOpen,
    sum: (f) => { const n = f.people.length + f.ext.length; if (!n) return 'Пока никого'; const bn = busyNames(f, f.d, f.s, f.s + f.len); return `${n} ${plural(n)} · ${bn.length ? `заняты: ${bn.join(', ')}` : f.people.length ? 'все свободны' : 'нет данных о занятости'}`; },
    body: (f, A) => (<>
      <People f={f} A={A} />
      <Footnote className="links"><Link>Права участников</Link><Link>Написать всем</Link><Link>Копировать список</Link></Footnote>
    </>) },
  { k: 'room', icon: <Icon20BuildingOutline />, name: 'Переговорка', on: (f) => !!f.room,
    sum: (f) => { const r = roomBy(f.room)!; return `${r.n}, ${r.fl} · ${r.cap} мест${f.roomAuto ? ' · подобрана' : ''}`; },
    body: (f, A) => (<>
      {ROOMS.map((r) => {
        const fr = roomFree(r, f.d, f.s, f.s + f.len), fit = r.cap >= f.people.length + 1;
        return <Radio key={r.n} name="room" checked={f.room === r.n} disabled={!fit} onChange={() => A.set((x) => { x.room = r.n; x.roomAuto = false; })}
          description={!fit ? 'мала для встречи' : fr ? 'свободна' : 'занята в это время'}>{r.n} · {r.cap} мест</Radio>;
      })}
      <Footnote className="muted">Офис: Ленинградский пр-т, 39 · любой этаж</Footnote>
    </>) },
  { k: 'repeat', icon: <Icon20RefreshOutline />, name: 'Повтор', on: (f) => f.repeat,
    sum: (f) => `По ${['понедельникам', 'вторникам', 'средам', 'четвергам', 'пятницам'][f.d]} · проверены 4 ближайших`,
    body: (f) => (<>
      {[15, 22, 29].map((x) => <MiniInfoCell key={x} before={<Icon20CheckCircleOn className="okc" />}>{x + f.d - 2} апреля — все свободны</MiniInfoCell>)}
      <MiniInfoCell before={<Icon20WarningTriangleOutline className="warnc" />}>{6 + f.d - 2} мая — {f.room ? `${f.room} занята, предложим Сатурн` : 'у Пети отпуск'}</MiniInfoCell>
    </>) },
  { k: 'call', icon: <Icon20VideocamOutline />, name: 'Звонок', on: (f) => f.call, sum: () => 'VK Звонки · ссылка создана сама',
    body: () => (<><Link>calls.mail.ru/room/7a3f-91c2</Link><Footnote className="links"><Link>Копировать</Link><Link>Другой сервис</Link><Link>Убрать</Link></Footnote></>) },
  { k: 'desc', icon: <Icon20ArticleBoxOutline />, name: 'Описание', on: (f) => f.desc, sum: () => 'Повестка: итоги квартала, планы на май',
    body: () => <Text>Повестка: итоги квартала по Почте, Облаку и Календарю. Планы на май.</Text> },
  { k: 'files', icon: <Icon20Attach />, name: 'Файлы', on: (f) => f.files, sum: (f) => `3 файла · доступ: ${f.filesAccess === 'link' ? 'всем по ссылке' : 'только участникам'}`,
    body: (f, A) => (<>
      <Text>Отчёт_Q1.pdf · Метрики.xlsx · Дорожная карта.pdf</Text>
      <SegmentedControl size="m" value={f.filesAccess} onChange={(v) => A.set((x) => { x.filesAccess = String(v); })}
        options={[{ value: 'members', label: 'Только участникам' }, { value: 'link', label: 'Всем по ссылке' }]} />
    </>) },
  { k: 'place', icon: <Icon20PlaceOutline />, name: 'Место', on: (f) => f.place, sum: () => 'Ленинградский пр-т, 39, стр. 79', body: () => <Text>Ленинградский пр-т, 39, стр. 79</Text> },
  { k: 'mine', icon: <Icon20NotificationOutline />, name: 'Мои настройки', me: true, on: () => true,
    sum: (f) => `${f.owner === 'anna' ? 'Календарь Анны' : 'Календарь «Основной»'} · цвет по календарю · за 15 мин`,
    body: (f) => (<><Text>Календарь: {f.owner === 'anna' ? 'Анна Смирнова' : 'Основной'}</Text><Text>Цвет: по календарю</Text><Text>Напоминание: в приложении за 15 мин · <Link>добавить</Link></Text></>) },
];
const ADDS: [string, string][] = [['people', 'Участники'], ['call', 'Звонок'], ['room', 'Переговорка'], ['repeat', 'Повтор'], ['desc', 'Описание'], ['files', 'Файлы'], ['place', 'Место']];


/**
 * Figma 96:39656 — компактная форма события. Только VKUI и @vkontakte/icons.
 * Содержимое привязано к общей модели Form, поэтому изменения переживают переключение pop/side.
 */
const EVENT_COLORS = [
  '#ed5795', '#0077ff', '#24b8b2', '#8f62d5', '#ffb84d', '#6d95e8',
  '#d86776', '#48bb78', '#9f7add', '#f1a94e', '#667c93', '#c26fbb',
];

export function EventForm({ f, cal: _cal, sl: _sl, delegated, A }: { f: Form; cal: Ev[]; sl: Slot[]; delegated: boolean; A: FormActions }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [callUrl, setCallUrl] = useState('');
  const [timeText, setTimeText] = useState<string | null>(null);
  const [endText, setEndText] = useState<string | null>(null);
  const pop = f.mode === 'pop';
  const peopleCount = f.people.length + f.ext.length;
  const color = f.eventColor || '#ed5795';
  const startTime = fmt(f.s), endTime = fmt(f.s + f.len);
  const inactiveExtras = [
    { k: 'repeat', label: 'Повтор', icon: <Icon20RefreshOutline />, visible: !f.repeat },
    { k: 'place', label: 'Место', icon: <Icon20BuildingOutline />, visible: !f.place },
    { k: 'desc', label: 'Описание', icon: <Icon20ArticleBoxOutline />, visible: !f.desc },
    { k: 'files', label: 'Файлы', icon: <Icon20Attach />, visible: !f.files },
    { k: 'notifications', label: 'Уведомления', icon: <Icon20NotificationOutline />, visible: !notifyOpen },
    { k: 'room', label: 'Переговорка', icon: <Icon20BuildingOutline />, visible: !f.room },
  ].filter((item) => item.visible);
  const setHour = (text: string, target: 'start' | 'end') => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
    if (!match) return;
    const h = Number(match[1]) + Number(match[2]) / 60;
    if (!Number.isFinite(h) || h < 10 || h > 18) return;
    A.set((x) => {
      if (target === 'start') { x.s = Math.min(h, 18 - x.len); }
      else if (h > x.s) { x.len = Math.min(h - x.s, 18 - x.s); }
    });
    if (target === 'start') setTimeText(null);
    else setEndText(null);
  };
  const extra = (k: string) => {
    if (k === 'notifications') { setNotifyOpen(true); return; }
    A.addBlock(k);
  };
  return (
    <Card mode="shadow" className={'form ' + f.mode + ' figma-event-form'} id="form" role="dialog" aria-label="Создание события">
      <div className="figma-ai-head">
        <Tappable className="figma-ai-action" onClick={() => setAiOpen((v) => !v)}>
          <Icon20Stars className="figma-ai-star" />
          <Text>Заполнить с нейропомощником</Text>
        </Tappable>
        <IconButton label="Закрыть форму" onClick={A.close}><Icon20Cancel /></IconButton>
      </div>
      {aiOpen && (
        <div className="figma-ai-editor">
          <Input mode="plain" value={aiPrompt} placeholder="Например: встреча с Машей завтра в 15:00"
            onChange={(e) => setAiPrompt(e.target.value)} aria-label="Запрос нейропомощнику" />
          <Button mode="primary" size="s" disabled={!aiPrompt.trim()} onClick={() => {
            const title = aiPrompt.replace(/\s*(завтра|сегодня|в\s+\d{1,2}:\d{2}).*$/i, '').trim() || aiPrompt;
            A.set((x) => { x.title = title; });
            setAiOpen(false);
          }}>Заполнить</Button>
        </div>
      )}
      <div className="figma-panel">
        {delegated && <div className="figma-owner">
          <CustomSelect value={f.owner} mode="plain" options={[{value:'me',label:'Мой календарь'},{value:'anna',label:'Анна Смирнова'}]}
            onChange={(_e: any, v: any) => A.set((x) => { x.owner = v === 'anna' ? 'anna' : 'me'; })} />
        </div>}
        <div className="figma-form-head">
          <IconButton label="Иконка события" className="figma-smile" onClick={() => setPaletteOpen((v) => !v)}>
            <Icon20SmileOutline />
          </IconButton>
          <Input className="figma-title" mode="plain" value={f.title}
            placeholder="Добавьте название" aria-label="Название события"
            onChange={(e) => { const title = e.target.value; A.set((x) => { x.title = title; }); }} />
          <Tappable className="figma-color-control" aria-label="Выбрать цвет события"
            aria-expanded={paletteOpen} onClick={() => setPaletteOpen((v) => !v)}>
            <span className="figma-event-color" style={{ backgroundColor: color }} />
            <Icon16Dropdown />
          </Tappable>
          {paletteOpen && <div className="figma-palette" role="group" aria-label="Цвет события">
            <Footnote>Цвет события</Footnote>
            <div className="figma-colors">
              {EVENT_COLORS.map((c) => <Tappable key={c} className="figma-color-item"
                aria-label={'Выбрать ' + c} aria-pressed={c === color}
                onClick={() => { A.set((x) => { x.eventColor = c; }); setPaletteOpen(false); }}>
                <span style={{ backgroundColor: c }} />
              </Tappable>)}
            </div>
          </div>}
        </div>
        <div className="figma-form-body">
          <div className="figma-field-row figma-date-row">
            <Icon20ClockOutline className="figma-field-icon" />
            <div className="figma-date-main">
              <CustomSelect className="figma-date-choice" mode="plain" value={String(f.d)} aria-label="Дата события"
                options={DAYF.map((label, i) => ({ value: String(i), label }))}
                onChange={(_e: any, v: any) => A.set((x) => { x.d = Number(v); })} />
              <Input className="figma-clock-input" mode="plain" aria-label="Начало" value={timeText ?? startTime}
                onChange={(e) => setTimeText(e.target.value)}
                onBlur={() => { if (timeText !== null) setHour(timeText, 'start'); setTimeText(null); }} />
              <Text className="figma-dash">—</Text>
              <Input className="figma-clock-input" mode="plain" aria-label="Окончание" value={endText ?? endTime}
                onChange={(e) => setEndText(e.target.value)}
                onBlur={() => { if (endText !== null) setHour(endText, 'end'); setEndText(null); }} />
            </div>
            <Checkbox className="figma-all-day" checked={allDay} onChange={(e) => setAllDay(e.target.checked)}>Весь день</Checkbox>
          </div>
          <div className="figma-field-row">
            <Icon20UsersOutline className="figma-field-icon" />
            <div className="figma-people-wrap">
              <People f={f} A={A} />
            </div>
          </div>
          <div className="figma-field-row figma-call-row">
            <Icon20VideocamOutline className="figma-field-icon" />
            {f.call ? (
              <div className="figma-call-active">
                <Input mode="plain" value={callUrl || 'calls.mail.ru/room/7a3f-91c2'}
                  onChange={(e) => setCallUrl(e.target.value)} aria-label="Ссылка на звонок" />
                <IconButton label="Удалить видеовстречу" onClick={() => A.set((x) => { x.call = false; })}><Icon20Cancel /></IconButton>
              </div>
            ) : <Tappable className="figma-call-placeholder" onClick={() => A.addBlock('call')}>Ссылка на звонок</Tappable>}
          </div>
          {(f.repeat || f.place || f.desc || f.files || f.room || notifyOpen) && (
            <div className="figma-expanded">
              {f.repeat && <SimpleCell before={<Icon20RefreshOutline />} onClick={() => A.set((x) => { x.repeat = false; })}>Повтор: каждую неделю · убрать</SimpleCell>}
              {f.place && <Input mode="plain" before={<Icon20BuildingOutline />} defaultValue="Ленинградский пр-т, 39" aria-label="Место встречи" />}
              {f.desc && <Input mode="plain" before={<Icon20ArticleBoxOutline />} defaultValue="Повестка встречи" aria-label="Описание встречи" />}
              {f.files && <SimpleCell before={<Icon20Attach />} onClick={() => A.set((x) => { x.files = false; })}>Файлы · добавить или убрать</SimpleCell>}
              {f.room && <SimpleCell before={<Icon20BuildingOutline />} onClick={() => A.set((x) => { x.room = null; })}>Переговорка: {f.room} · убрать</SimpleCell>}
              {notifyOpen && <SimpleCell before={<Icon20NotificationOutline />} onClick={() => setNotifyOpen(false)}>За 15 минут до события · убрать</SimpleCell>}
            </div>
          )}
          <div className="figma-extra-pills">
            {inactiveExtras.map(({ k, label, icon }) => (
              <Button key={k} className="figma-pill" mode="secondary" size="m" before={icon}
                onClick={() => extra(k)}>{label}</Button>
            ))}
          </div>
        </div>
        <div className="figma-form-footer">
          <Button className="figma-save" size="m" mode="primary" onClick={A.send}>Сохранить</Button>
          <CustomSelect className="figma-calendar-select" mode="plain" value={f.owner}
            before={<Icon20CalendarOutline />} icon={<Icon20DropdownOutline />}
            options={[{ value: 'me', label: 'Основной' }, { value: 'anna', label: 'Рабочий' }]}
            onChange={(_e: any, v: any) => A.set((x) => { x.owner = v === 'anna' ? 'anna' : 'me'; })} />
          {!pop && <IconButton className="figma-collapse" label="Свернуть в поповер" onClick={A.shrink}><Icon20FullscreenExitOutline /></IconButton>}
        </div>
      </div>
    </Card>
  );
}

export function ParticipantCard({ p, own, ans, onAns, onPropose, onClose }: { p: Ev; own: Ev[]; ans: string | null; onAns: (a: string) => void; onPropose: () => void; onClose: () => void }) {
  const conflict = own.find((x) => x.d === p.d && x.s < p.e && p.s < x.e && x.t !== p.t);
  const rows: [React.ReactNode, string, string][] = [
    [<Icon20UsersOutline key="u" />, 'Участники', '12 участников · 9 идут'],
    [<Icon20BuildingOutline key="b" />, 'Переговорка', 'Юпитер, 5 эт.'],
    [<Icon20ArticleBoxOutline key="a" />, 'Описание и файлы', 'Повестка + 3 файла'],
    [<Icon20NotificationOutline key="n" />, 'Мои настройки', 'Цвет · за 15 мин'],
  ];
  return (
    <div className="form side" id="form">
      <div className="org"><Avatar size={28} initials="К" gradientColor={4} /><div><Text weight="2">Катя Никулина</Text><Footnote className="muted">организатор</Footnote></div></div>
      <div className="fh"><Input mode="plain" className="ttl" value={p.t} readOnly aria-label="Название" /><IconButton label="Закрыть" onClick={onClose}><Icon20Cancel /></IconButton></div>
      <div className="row"><Icon20ClockOutline className="ric" /><div className="c">
        <div className="time"><Text>{DAYF[p.d]}</Text><Text>{fmt(p.s)} — {fmt(p.e)}</Text><Footnote className="muted">по средам</Footnote></div>
        <Footnote className="st">{conflict ? <span className="warn"><Dot k="warn" />У вас в это время «{conflict.t}»</span> : <span className="ok"><Dot k="ok" />Вы свободны</span>}</Footnote>
        <div className="answers">
          {['Иду', 'Может быть', 'Не иду'].map((a) => <Button key={a} size="m" mode={ans === a ? 'primary' : 'secondary'} onClick={() => onAns(a)}>{a}</Button>)}
          <Button size="m" mode="tertiary" onClick={onPropose}>Предложить время</Button>
        </div>
      </div></div>
      <div className="row"><Icon20VideocamOutline className="ric" /><div className="c"><Button size="l" mode="primary" className="left">Подключиться к звонку</Button></div></div>
      <div className="blocks">
        {rows.map(([icon, name, sum]) => (
          <Accordion key={name}>
            <Accordion.Summary before={icon} iconPosition="after" overTitle={<>{name}{name === 'Мои настройки' && <span className="tag">видите только вы</span>}</>}>{sum}</Accordion.Summary>
            <Accordion.Content><div className="blkbody"><Footnote className="muted">Подробности раскрываются по клику</Footnote></div></Accordion.Content>
          </Accordion>
        ))}
      </div>
    </div>
  );
}
