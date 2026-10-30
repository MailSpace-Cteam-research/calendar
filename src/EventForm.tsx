import {
  Accordion, Avatar, Button, Card, ChipsSelect, CustomSelect, CustomSelectOption, Footnote, IconButton,
  Input, Link, MiniInfoCell, Radio, SegmentedControl, Tappable, Text,
} from '@vkontakte/vkui';
import { Chip } from '@vkontakte/vkui';
import {
  Icon16Add, Icon20ArticleBoxOutline, Icon20Attach, Icon20BuildingOutline, Icon20Cancel,
  Icon20CheckCircleOn, Icon20ClockOutline, Icon20FullscreenExitOutline, Icon20FullscreenOutline,
  Icon20NotificationOutline, Icon20PlaceOutline, Icon20PollOutline, Icon20RefreshOutline,
  Icon20Users3Outline, Icon20UsersOutline, Icon20VideocamOutline, Icon20WarningTriangleOutline, Icon20SmileOutline,
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

function ParticipantList({ f, A }: { f: Form; A: FormActions }) {
  const people = [...f.people, ...f.ext];
  const visible = f.participantsExpanded ? people : people.slice(0, 3);
  const remaining = Math.max(0, people.length - visible.length);
  return (
    <div className="participant-list">
      <div className="participant-row organizer-row">
        <Avatar size={24} initials="Я" gradientColor={1} />
        <div className="participant-copy">
          <Text>Вы</Text>
          <Footnote className="muted">организатор</Footnote>
        </div>
      </div>
      {visible.map((name) => (
        <div className="participant-row" key={name}>
          <Avatar size={24} initials={name.slice(0, 1).toUpperCase()} gradientColor={grad(name)} />
          <Text className="participant-name">{name}</Text>
        </div>
      ))}
      {remaining > 0 && (
        <Button size="s" mode="tertiary" className="participant-toggle"
          onClick={() => A.set((x) => { x.participantsExpanded = true; })}>
          Ещё {remaining} {plural(remaining)}
        </Button>
      )}
      {f.participantsExpanded && people.length > 3 && (
        <Button size="s" mode="tertiary" className="participant-toggle"
          onClick={() => A.set((x) => { x.participantsExpanded = false; })}>
          Свернуть
        </Button>
      )}
      <Button size="s" mode="secondary" before={<Icon16Add />}
        onClick={() => A.set((x) => { x.peopleOpen = !x.peopleOpen; })}>
        {f.peopleOpen ? 'Скрыть добавление' : 'Добавить участников'}
      </Button>
      {f.peopleOpen && <People f={f} A={A} />}
      {people.length > 0 && <Footnote className="links"><Link>Права участников</Link><Link>Написать всем</Link><Link>Копировать список</Link></Footnote>}
    </div>
  );
}

type Blk = { k: string; icon: React.ReactNode; name: string; me?: boolean; on: (f: Form) => boolean; sum: (f: Form) => string; body: (f: Form, A: FormActions) => React.ReactNode };
const BLOCKS: Blk[] = [
  { k: 'people', icon: <Icon20UsersOutline />, name: 'Участники', on: (f) => f.people.length + f.ext.length > 0 || !!f.peopleOpen,
    sum: (f) => { const n = f.people.length + f.ext.length; if (!n) return 'Пока никого'; const bn = busyNames(f, f.d, f.s, f.s + f.len); return `${n} ${plural(n)} · ${bn.length ? `заняты: ${bn.join(', ')}` : f.people.length ? 'все свободны' : 'нет данных о занятости'}`; },
    body: (f, A) => <ParticipantList f={f} A={A} /> },
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

export function EventForm({ f, cal, sl, delegated, A }: { f: Form; cal: Ev[]; sl: Slot[]; delegated: boolean; A: FormActions }) {
  const pop = f.mode === 'pop', anna = f.owner === 'anna';
  const n = f.people.length + f.ext.length;
  const avail = ADDS.filter(([k]) => !BLOCKS.find((b) => b.k === k)!.on(f));
  const body = pop ? (
    <>
      <div className="design-date-row">
        <Icon20ClockOutline className="design-row-icon" />
        <div className="design-date-controls">
          <button type="button" className="design-field" onClick={() => A.set((x) => { x.d = (x.d + 1) % 5; })}>{DAYF[f.d]}</button>
          <button type="button" className="design-field" onClick={() => A.set((x) => { x.s = x.s >= 17.5 ? 10 : x.s + 0.5; })}>{fmt(f.s)}</button>
          <span className="design-dash">—</span>
          <button type="button" className="design-field" onClick={() => A.set((x) => { x.len = x.len === 0.5 ? 1 : x.len === 1 ? 1.5 : 0.5; })}>{fmt(f.s + f.len)}</button>
          <button type="button" className="design-all-day" onClick={() => A.set((x) => { x.len = x.len === 8 ? 1 : 8; })}><span className={'design-checkbox' + (f.len === 8 ? ' checked' : '')}>{f.len === 8 ? '✓' : ''}</span>Весь день</button>
        </div>
      </div>
      <div className="design-row">
        <Icon20UsersOutline className="design-row-icon" />
        <div className="design-input" onClick={() => A.set((x) => { x.peopleOpen = !x.peopleOpen; })}>
          {n ? <span className="design-selected">{f.people.concat(f.ext).join(', ')}</span> : <span className="design-placeholder">Пригласить участников</span>}
        </div>
      </div>
      {(f.peopleOpen || n > 0) && <div className="design-people-editor"><People f={f} A={A} /></div>}
      <div className="design-row design-video" onClick={() => A.set((x) => { x.call = !x.call; })}>
        <Icon20VideocamOutline className="design-row-icon" />
        {f.call ? <Link>calls.mail.ru/room/7a3f-91c2</Link> : <span className="design-placeholder">Ссылка на звонок</span>}
      </div>
      <div className="design-pills">
        {([
          ['repeat', 'Повтор', <Icon20RefreshOutline key="repeat" />],
          ['place', 'Место', <Icon20BuildingOutline key="place" />],
          ['desc', 'Описание', <Icon20ArticleBoxOutline key="desc" />],
          ['files', 'Файлы', <Icon20Attach key="files" />],
          ['mine', 'Уведомления', <Icon20NotificationOutline key="mine" />],
        ] as [string, string, React.ReactNode][]).map(([key, label, icon]) => (
          <button key={key} type="button" className="design-pill" onClick={() => A.addBlock(key)}>
            {icon}<span>{label}</span>
          </button>
        ))}
      </div>
      {(f.repeat || f.room || f.desc || f.files || f.place) && (
        <div className="design-expanded-options">
          {BLOCKS.filter((b) => ['repeat','room','desc','files','place'].includes(b.k) && b.on(f)).map((b) => (
            <div className="design-option" key={b.k}>
              <div className="design-option-title">{b.name}<button type="button" onClick={() => A.set((x) => { if (b.k === 'repeat') x.repeat = false; if (b.k === 'room') x.room = null; if (b.k === 'desc') x.desc = false; if (b.k === 'files') x.files = false; if (b.k === 'place') x.place = false; })}>×</button></div>
              <div className="design-option-content">{b.body(f, A)}</div>
            </div>
          ))}
        </div>
      )}
    </>
  ) : (
    <div className="blocks">
      {BLOCKS.filter((b) => b.on(f)).map((b) => (
        <Accordion key={b.k} expanded={f.open === b.k} onChange={(v) => A.set((x) => { x.open = v ? b.k : null; })}>
          <Accordion.Summary before={b.icon} iconPosition="after"
            overTitle={<>{b.name}{b.me && <span className="tag">видите только вы</span>}</>}>{b.sum(f)}</Accordion.Summary>
          <Accordion.Content><div className="blkbody">{b.body(f, A)}</div></Accordion.Content>
        </Accordion>
      ))}
    </div>
  );
  const Root: any = pop ? Card : 'div';
  return (
    <Root {...(pop ? { mode: 'shadow' } : {})} className={'form ' + f.mode} id="form" role="dialog" aria-label="Событие">
      {delegated && (
        <CustomSelect className={'ownersel' + (anna ? ' anna' : '')} value={f.owner}
          before={<Avatar size={24} initials={anna ? 'А' : 'Я'} gradientColor={anna ? 5 : 1} />}
          options={[{ value: 'me', label: 'Мой календарь', description: '' }, { value: 'anna', label: 'Анна Смирнова', description: 'вы — ассистент' }]}
          renderOption={({ option, ...rest }: any) => <CustomSelectOption {...rest} before={<Avatar size={24} initials={option.value === 'anna' ? 'А' : 'Я'} gradientColor={option.value === 'anna' ? 5 : 1} />} description={option.description} />}
          onChange={(e: any, v: any) => { const val = v ?? e?.target?.value; A.set((x) => { x.owner = val === 'anna' ? 'anna' : 'me'; }); }} />
      )}
      <div className="design-ai-row">
        <button type="button" className="design-ai-trigger" onClick={() => A.set((x) => { x.open = x.open === 'ai' ? null : 'ai'; })}>
          <span className="design-stars">✦</span><span>Заполнить с нейропомощником</span>
        </button>
        <IconButton label="Закрыть" onClick={A.close}><Icon20Cancel /></IconButton>
      </div>
      {f.open === 'ai' && <div className="design-ai-input"><Input placeholder="Опишите событие своими словами" value={f.title} onChange={(e) => A.set((x) => { x.title = e.target.value; })} /><Button size="s" mode="primary" onClick={() => A.set((x) => { x.open = null; })}>Заполнить</Button></div>}
      <div className="design-form-card">
        <div className="design-header">
          <button type="button" className="design-emoji" aria-label="Эмодзи события">☺</button>
          <Input mode="plain" className="ttl" id="ttl" value={f.title} placeholder="Добавьте название" aria-label="Название" onChange={(e) => { const v = e.target.value; A.set((x) => { x.title = v; }); }} />
          <button type="button" className="design-color" onClick={() => A.set((x) => { x.open = x.open === 'color' ? null : 'color'; })}><span />⌄</button>
        </div>
        {f.open === 'color' && <div className="design-color-menu">{['#07f','#8e55ea','#e64646','#ff9500','#18a058','#00a1a6','#ffcf33','#f06292'].map((color) => <button key={color} aria-label={'Цвет '+color} style={{background:color}} onClick={() => A.set((x) => { x.open = null; })} />)}</div>}
        <div className="design-content">{body}</div>
        <div className="design-footer">
          <Button size="m" mode="primary" className={anna ? 'annabtn' : ''} onClick={A.send}>{n ? `Отправить приглашения (${n})` : 'Сохранить'}</Button>
          <button type="button" className="design-calendar"><span className="design-calendar-dot" />Основной <span>⌄</span></button>
        </div>
      </div>
    </Root>
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
