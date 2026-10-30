import { useEffect, useRef, useState } from 'react';
import {
  Avatar, Button, Checkbox, CustomSelect, IconButton, Input, SimpleCell,
  Tappable, Text, Textarea,
} from '@vkontakte/vkui';
import {
  Icon16Dropdown, Icon20ArticleBoxOutline, Icon20Attach, Icon20BuildingOutline,
  Icon20CalendarOutline, Icon20Cancel, Icon16Add, Icon20CheckCircleOn, Icon20ChevronLeftOutline,
  Icon20ChevronRightOutline, Icon20ClockOutline, Icon20NotificationOutline,
  Icon20RefreshOutline, Icon20SmileOutline, Icon20Stars, Icon20UsersOutline,
  Icon20VideocamOutline, Icon20PollOutline, Icon20PlaceOutline,
  Icon20MailOutline, Icon20MoreHorizontal, Icon20CopyOutline,
  Icon20ArrowUturnLeftOutline, Icon20CheckCircleOutline,
} from '@vkontakte/icons';
import './figma-calendar.css';

type Screen = 'event' | 'ai-compose' | 'ai-wait' | 'ai-done';
type Person = { name: string; initials: string; role?: string };
type CalendarEvent = { id: number; d: number; start: number; end: number; title: string; color?: 'mint' | 'lilac'; call?: boolean };
const COLORS = ['#e95991', '#0077ff', '#96e9cd', '#c9baff', '#ffdc80', '#ffc4a0'];
const DAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const EVENTS: CalendarEvent[] = [
  { id: 1, d: 0, start: 600, end: 660, title: 'Планёрка' },
  { id: 2, d: 1, start: 570, end: 600, title: 'Стендап' },
  { id: 3, d: 2, start: 570, end: 600, title: 'Стендап' },
  { id: 4, d: 2, start: 720, end: 840, title: 'Design & Product review Productivity', call: true },
  { id: 5, d: 2, start: 840, end: 900, title: 'Подготовить воркшоп', color: 'mint' },
  { id: 6, d: 3, start: 660, end: 720, title: 'Воркшоп Lottie', color: 'mint' },
  { id: 7, d: 3, start: 900, end: 960, title: 'Ревью дизайна' },
  { id: 8, d: 4, start: 660, end: 720, title: 'Планирование квартала' },
  { id: 9, d: 4, start: 780, end: 840, title: 'Демо Почты' },
  { id: 10, d: 4, start: 840, end: 900, title: 'Демо Облака' },
  { id: 11, d: 1, start: 720, end: 840, title: 'Бюджет 2027: защита у CEO', color: 'mint' },
  { id: 12, d: 2, start: 900, end: 990, title: 'Совет директоров', color: 'mint' },
  { id: 13, d: 3, start: 600, end: 660, title: '1:1 с CEO', color: 'mint' },
];
const FAKE_PEOPLE: Person[] = [
  { name: 'Вы', initials: 'В', role: 'организатор' },
  { name: 'Елисей Среда', initials: 'ЕС' },
  { name: 'Алиса Лобачевская', initials: 'АЛ' },
  { name: 'Алиса Лобачевская', initials: 'АЛ' },
  { name: 'Алиса Лобачевская', initials: 'АЛ' },
  { name: 'Алиса Лобачевская', initials: 'АЛ' },
];
const AI_DEFAULT = '1:1 с дизайнером';
const AI_JIRA_REQUEST = 'Синк с разработкой и продуктом по jira.vk.team/browse/SP-30329';
const AI_EXAMPLES = [AI_DEFAULT, 'Синк с командой', 'Квартальная встреча', AI_JIRA_REQUEST] as const;

const AI_RESULT_TITLE = 'Синк по задаче БАЗ файлы в блоке квоты';
const AI_RESULT_DESCRIPTION = 'Привет, хочу обсудить:\n1. Дизайн и изменения\n2. Эксперимент и ресурс разработки';
const dateOptions = ['Пн, 6 окт.', 'Вт, 7 окт.', 'Ср, 8 окт.', 'Чт, 9 окт.', 'Пт, 10 окт.', 'Сб, 11 окт.', 'Вс, 12 окт.'];
const toTime = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const toMins = (s: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(s); return m ? +m[1] * 60 + +m[2] : NaN; };

export default function FigmaCalendar({ onLegacy }: { onLegacy: () => void }) {
  const [screen, setScreen] = useState<Screen>('event');
  const [day, setDay] = useState(1);
  const [from, setFrom] = useState(600);
  const [to, setTo] = useState(630);
  const [title, setTitle] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [submittedPrompt, setSubmittedPrompt] = useState('');
  const [thinkingLabel, setThinkingLabel] = useState<'Думаю...' | 'Верчу извилинами...'>('Думаю...');
  const [timeStartDraft, setTimeStartDraft] = useState<string | null>(null);
  const [timeEndDraft, setTimeEndDraft] = useState<string | null>(null);

  const [colour, setColour] = useState(COLORS[0]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [participantsExpanded, setParticipantsExpanded] = useState(false);
  const [peopleQuery, setPeopleQuery] = useState('');
  const [callLink, setCallLink] = useState('');
  const [description, setDescription] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [place, setPlace] = useState(false);
  const [files, setFiles] = useState(false);
  const [notify, setNotify] = useState(false);
  const [calendar, setCalendar] = useState('me');
  const [calOpen, setCalOpen] = useState(false);
  const [savedEvents, setSavedEvents] = useState<CalendarEvent[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [toast, setToast] = useState('');
  const weekScroll = useRef<HTMLDivElement>(null);
  const aiTimer = useRef<number | undefined>(undefined);
  const thinkingTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (weekScroll.current) weekScroll.current.scrollTop = 168; // 9:00 at top: matches original calendar prototype
    return () => {
      window.clearTimeout(aiTimer.current);
      window.clearTimeout(thinkingTimer.current);
    };
  }, []);
  const alert = (s: string) => { setToast(s); window.setTimeout(() => setToast(''), 3200); };
  const resetForm = (d = 1, start = 600) => {
    window.clearTimeout(aiTimer.current);
    window.clearTimeout(thinkingTimer.current);
    setTimeStartDraft(null); setTimeEndDraft(null);
    setAiPrompt(''); setSubmittedPrompt(''); setThinkingLabel('Думаю...');
    setDay(d); setFrom(start); setTo(start + 30); setTitle(''); setPeople([]);
    setDescription(''); setCallLink(''); setScreen('event'); setShowForm(true);
    setRepeat(false); setPlace(false); setFiles(false); setNotify(false); setParticipantsExpanded(false);
  };
  const startAI = (example = AI_DEFAULT) => {
    window.clearTimeout(aiTimer.current);
    window.clearTimeout(thinkingTimer.current);
    setScreen('ai-compose'); setShowForm(true); setAiPrompt(example);
    setSubmittedPrompt(''); setThinkingLabel('Думаю...');
  };
  const fillAI = () => {
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    setSubmittedPrompt(prompt);
    setThinkingLabel('Думаю...');
    setScreen('ai-wait');
    window.clearTimeout(aiTimer.current);
    window.clearTimeout(thinkingTimer.current);
    thinkingTimer.current = window.setTimeout(() => setThinkingLabel('Верчу извилинами...'), 850);
    aiTimer.current = window.setTimeout(() => {
      const jira = /jira\.vk\.team|SP-30329/i.test(prompt);
      const title = jira ? AI_RESULT_TITLE : /1:1/i.test(prompt) ? '1:1 с дизайнером' : /квартальн/i.test(prompt) ? 'Квартальная встреча' : /синк/i.test(prompt) ? 'Синк с командой' : prompt;
      setTitle(title);
      setDay(1); setFrom(720); setTo(750);
      setTimeStartDraft(null); setTimeEndDraft(null);
      setPeople(FAKE_PEOPLE); setParticipantsExpanded(false);
      setCallLink('https://calls.mail.ru/room/36894w9a');
      setDescription(AI_RESULT_DESCRIPTION);
      setScreen('ai-done');
    }, 2100);
  };
  const undoAI = () => {
    window.clearTimeout(aiTimer.current);
    window.clearTimeout(thinkingTimer.current);
    setTitle(''); setPeople([]); setParticipantsExpanded(false);
    setCallLink(''); setDescription('');
    setScreen('ai-compose');
  };
  const leaveAI = () => {
    window.clearTimeout(aiTimer.current);
    window.clearTimeout(thinkingTimer.current);
    setScreen('event'); setSubmittedPrompt('');
  };
  const commitTime = (value: string | null, which: 'start' | 'end') => {
    if (value == null) return;
    const minutes = toMins(value.trim());
    if (Number.isFinite(minutes) && minutes >= 0 && minutes < 24 * 60) {
      if (which === 'start') setFrom(minutes);
      else setTo(minutes);
    }
    if (which === 'start') setTimeStartDraft(null);
    else setTimeEndDraft(null);
  };
  const save = () => {
    if (!title.trim()) { alert('Добавьте название события'); return; }
    setSavedEvents(e => [...e, { id: Date.now(), d: day, start: from, end: to, title }]);
    setShowForm(false); alert(`Событие «${title}» сохранено`);
  };
  const compact = screen === 'event';
  const isAI = screen !== 'event';
  const aiDone = screen === 'ai-done';
  const aiBlocked = screen === 'ai-compose';
  const rows = [
    { k: 'repeat', label: 'Повтор', icon: <Icon20RefreshOutline />, enabled: repeat, set: setRepeat },
    { k: 'place', label: 'Место', icon: <Icon20BuildingOutline />, enabled: place, set: setPlace },
    { k: 'description', label: 'Описание', icon: <Icon20ArticleBoxOutline />, enabled: !!description, set: (v: boolean) => setDescription(v ? 'Введите описание' : '') },
    { k: 'files', label: 'Файлы', icon: <Icon20Attach />, enabled: files, set: setFiles },
    { k: 'notify', label: 'Уведомления', icon: <Icon20NotificationOutline />, enabled: notify, set: setNotify },
  ];
  const pills = rows.filter((r) => !r.enabled || (aiDone && r.k !== 'description' && r.k !== 'files'));

  const formBody = (disabled = false) => (
    <div className={'fg-event-content' + (disabled ? ' fg-waiting' : '')}>
      <div className="fg-form-heading">
        <IconButton label="Выбрать эмодзи события" className="fg-form-smile" onClick={() => alert('Эмодзи события')} disabled={disabled}><Icon20SmileOutline /></IconButton>
        {aiDone ? <Textarea className="fg-form-title fg-title-multiline" aria-label="Название события" placeholder="Добавьте название"
          rows={2} value={title} onChange={e => setTitle(e.target.value)} />
        : <Input mode="plain" className="fg-form-title" aria-label="Название события" placeholder="Добавьте название"
          value={title} disabled={disabled} onChange={e => setTitle(e.target.value)} />}
        <div className="fg-palette-anchor">
          <Tappable className="fg-color-trigger" onClick={() => setPaletteOpen(v => !v)} disabled={disabled}
            aria-label="Цвет события" aria-expanded={paletteOpen}>
            <span className="fg-event-dot" style={{ backgroundColor: colour }} /><Icon16Dropdown />
          </Tappable>
          {paletteOpen && !disabled && <div className="fg-palette" role="group" aria-label="Выбрать цвет">
            {COLORS.map(c => <Tappable key={c} aria-label={`Цвет ${c}`} aria-pressed={c === colour}
              onClick={() => { setColour(c); setPaletteOpen(false); }}><span style={{ backgroundColor: c }} /></Tappable>)}
          </div>}
        </div>
      </div>
      <div className="fg-form-fields">
        <div className="fg-form-row fg-time-row"><Icon20ClockOutline className="fg-row-icon" />
          <div className="fg-time-controls">
            <CustomSelect className="fg-day-select" aria-label="Дата события" disabled={disabled} value={String(day)} mode="plain" icon={null}
              options={dateOptions.map((s, i) => ({ value: String(i), label: s }))} onChange={(_e, v) => setDay(Number(v))} />
            <Input mode="plain" aria-label="Начало события" className="fg-time-input" disabled={disabled}
              value={timeStartDraft ?? toTime(from)} onChange={e => setTimeStartDraft(e.target.value)}
              onBlur={() => commitTime(timeStartDraft, 'start')}
              onKeyDown={e => { if (e.key === 'Enter') (e.currentTarget as HTMLElement).blur(); }} />
            <span className="fg-time-dash">—</span>
            <Input mode="plain" aria-label="Конец события" className="fg-time-input" disabled={disabled}
              value={timeEndDraft ?? toTime(to)} onChange={e => setTimeEndDraft(e.target.value)}
              onBlur={() => commitTime(timeEndDraft, 'end')}
              onKeyDown={e => { if (e.key === 'Enter') (e.currentTarget as HTMLElement).blur(); }} />
            <Checkbox className="fg-day-checkbox" disabled={disabled} checked={allDay} onChange={e => setAllDay(e.target.checked)}>Весь день</Checkbox>
          </div>
        </div>
        {people.length ? (
          <div className="fg-member-section">
            <div className="fg-member-header">
              <Text weight="2">Участники {people.length}</Text>
              <div className="fg-member-tools"><IconButton label="Написать участникам" onClick={() => alert('Письмо участникам — демо')}><Icon20MailOutline /></IconButton>
                <IconButton label="Дополнительные действия" onClick={() => alert('Параметры участников')}><Icon20MoreHorizontal /></IconButton></div>
            </div>
            <div className="fg-member-row"><Icon20UsersOutline className="fg-row-icon" />
              <div className="fg-member-content">
                {participantsExpanded ? <>
                  <Button mode="tertiary" className="fg-member-collapse" onClick={() => setParticipantsExpanded(false)}>Свернуть</Button>
                  <div className="fg-member-list">{people.map((p, i) => <div key={i} className="fg-member-item">
                    <Avatar size={24} initials={p.initials} gradientColor={(i % 6 + 1) as 1 | 2 | 3 | 4 | 5 | 6}/>
                    <span>{p.name}{p.role && <span className="fg-muted"> {p.role}</span>}</span>
                  </div>)}</div>
                  <Button mode="tertiary" className="fg-member-add" before={<Icon20AddFallback />} onClick={() => setPeopleQuery(' ')}>Добавить</Button>
                </> : <>
                  <div className="fg-member-preview"><div className="fg-avatar-stack">
                    {people.slice(0, 3).map((p, i) => <Avatar key={i} size={24} initials={p.initials} gradientColor={(i % 6 + 1) as 1 | 2 | 3 | 4 | 5 | 6} />)}
                  </div><span>Вы, Елисей, Алиса</span><Button mode="tertiary" onClick={() => setParticipantsExpanded(true)}>Ещё {people.length - 3}</Button></div>
                  <Button mode="tertiary" className="fg-member-add" before={<Icon20AddFallback />} onClick={() => setPeopleQuery(' ')}>Добавить</Button>
                </>}
                {!!peopleQuery && <Input mode="plain" placeholder="Имя или почта" aria-label="Добавить участника" value={peopleQuery}
                  onChange={e => setPeopleQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && peopleQuery.trim()) {setPeople(v => [...v, {name:peopleQuery.trim(),initials:peopleQuery.trim().slice(0,2)}]);setPeopleQuery('');} }} />}
              </div>
            </div>
          </div>
        ) : <div className="fg-form-row fg-people-empty"><Icon20UsersOutline className="fg-row-icon" />
            <Input mode="plain" className="fg-simple-input" value={peopleQuery} disabled={disabled} placeholder="Пригласить участников" aria-label="Пригласить участников"
              onChange={e => setPeopleQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && peopleQuery.trim()) { setPeople([{name:peopleQuery.trim(), initials:peopleQuery.slice(0, 2)}]);setPeopleQuery(''); } }} />
          </div>}
        <div className="fg-form-row fg-video-row"><Icon20VideocamOutline className="fg-row-icon" />
          {callLink ? <div className="fg-call-filled"><a href={callLink} target="_blank" rel="noreferrer">{callLink}</a>
            <IconButton label="Копировать ссылку" onClick={() => { navigator.clipboard?.writeText(callLink); alert('Ссылка скопирована'); }}><Icon20CopyOutline /></IconButton>
            <IconButton label="Удалить видеовстречу" onClick={() => setCallLink('')}><Icon20Cancel /></IconButton></div>
          : <Input mode="plain" className="fg-simple-input" disabled={disabled} value={callLink}
            onChange={e => setCallLink(e.target.value)} placeholder="Ссылка на звонок" aria-label="Ссылка на звонок"/>}
        </div>
        {description && <div className="fg-form-row fg-description-row"><Icon20ArticleBoxOutline className="fg-row-icon" />
          <Textarea className="fg-description" aria-label="Описание" value={description} onChange={e => setDescription(e.target.value)} rows={3}/></div>}
        {place && <div className="fg-form-row"><Icon20PlaceOutline className="fg-row-icon" /><Input mode="plain" className="fg-simple-input" placeholder="Введите место" aria-label="Место" /></div>}
        {repeat && <SimpleCell className="fg-extra-line" before={<Icon20RefreshOutline />} onClick={() => setRepeat(false)}>Каждую неделю · убрать</SimpleCell>}
        {files && <SimpleCell className="fg-extra-line" before={<Icon20Attach />} onClick={() => alert('Файлы прикрепляются в демоверсии')}>Прикрепить файл</SimpleCell>}
        {notify && <SimpleCell className="fg-extra-line" before={<Icon20NotificationOutline />} onClick={() => setNotify(false)}>За 15 минут · убрать</SimpleCell>}
        <div className="fg-form-pills">
          {pills.map(r => <Button key={r.k} mode="secondary" size="m" className={'fg-pill fg-pill-'+r.k} before={r.icon}
            disabled={disabled} onClick={() => { if(r.k==='description'){setDescription('Введите описание');} else r.set(!r.enabled); }}>{r.label}</Button>)}
        </div>
      </div>
      {!disabled && <div className="fg-form-footer"><Button className="fg-save" mode="primary" size="m" onClick={save}>Сохранить</Button>
        <div className="fg-cal-anchor"><Button size="m" className="fg-cal-button" mode="tertiary"
            before={<Icon20CalendarOutline />} after={<Icon16Dropdown />} onClick={() => setCalOpen(v => !v)}>
              {calendar === 'me' ? 'Основной' : calendar === 'work' ? 'Рабочий' : 'Иван Петров'}
          </Button>
          {calOpen && <div className="fg-cal-menu">{[['me','Основной'],['work','Рабочий'],['ivan','Иван Петров']].map(([v,t])=><SimpleCell key={v} onClick={()=>{setCalendar(v);setCalOpen(false);}}>{t}</SimpleCell>)}</div>}
        </div>
      </div>}
    </div>
  );

  const waitBody = (
    <div className="fg-wait-skeleton" aria-live="polite" aria-busy="true">
      <div className="fg-form-heading fg-wait-title">
        <Icon20SmileOutline className="fg-row-icon" />
        <Text>{thinkingLabel}</Text>
        <div className="fg-wait-palette"><span className="fg-event-dot" style={{ backgroundColor: colour }} /><Icon16Dropdown /></div>
      </div>
      <div className="fg-form-fields fg-wait-lines">
        {[
          <Icon20ClockOutline />, <Icon20UsersOutline />, <Icon20VideocamOutline />,
        ].map((icon, index) => <div className="fg-form-row fg-wait-row" key={index}>
          <span className="fg-row-icon">{icon}</span><span className="fg-skeleton-bar" />
        </div>)}
        <div className="fg-form-pills fg-wait-pills">
          {rows.map(r => <Button key={r.k} className={'fg-pill fg-pill-'+r.k} size="m" mode="secondary" disabled before={r.icon}>{r.label}</Button>)}
        </div>
      </div>
    </div>
  );
  const submittedContent = submittedPrompt.split(/(https?:\/\/[^\s]+|jira\.vk\.team\/browse\/[\w-]+)/gi).map((piece, index) =>
    /^https?:\/\/|^jira\.vk\.team\//i.test(piece)
      ? <a key={index} href={piece.startsWith('http') ? piece : `https://${piece}`} target="_blank" rel="noreferrer">{piece}</a>
      : <span key={index}>{piece}</span>
  );
  return <div className="fg-page">
    <div className="fg-demo-tools"><Text weight="2">Календарь · Figma</Text>
      <div className="fg-demo-buttons"><Button mode="secondary" size="s" onClick={() => resetForm()}>Новая форма</Button>
      <Button mode="secondary" size="s" onClick={() => {resetForm();startAI();}}>Нейропомощник</Button>
      <Button mode="secondary" size="s" onClick={() => { resetForm();setTitle(AI_RESULT_TITLE);setFrom(720);setTo(750);setPeople(FAKE_PEOPLE);setCallLink('https://calls.mail.ru/room/36894w9a');setDescription(AI_RESULT_DESCRIPTION);setScreen('ai-done'); }}>После заполнения</Button>
      <Button mode="tertiary" size="s" onClick={onLegacy}>Предыдущие сценарии</Button>
      <div className="fg-example-prompts" role="group" aria-label="Примеры запросов нейропомощнику">
        {AI_EXAMPLES.map((ex, i) => <Button size="s" mode="tertiary" key={ex} onClick={() => startAI(ex)}>{['1:1', 'Синк', 'Квартальная встреча', 'Jira SP-30329'][i]}</Button>)}
      </div></div>
    </div>
    <div className="fg-frame-scroll"><div className="fg-frame" data-testid="calendar-frame">
      <nav className="fg-nav" aria-label="Сервисы">
        <div className="fg-nav-logo"><span className="fg-workspace-symbol"><Icon20CalendarOutline /></span></div>
        {[
          ['Главная', <Icon20ClockOutline />], ['Чаты', <Icon20NotificationOutline />],
          ['Почта', <Icon20ArticleBoxOutline />], ['Календарь', <Icon20CalendarOutline />],
          ['Облако', <Icon20Attach />], ['Документы', <Icon20ArticleBoxOutline />],
          ['Задачи', <Icon20PollOutline />], ['Звонки', <Icon20VideocamOutline />],
          ['Сотрудники', <Icon20UsersOutline />], ['Приложения', <Icon20BuildingOutline />],
        ].map(([name, ico]) => <IconButton key={String(name)} label={String(name)} className={'fg-nav-button'+(name==='Календарь'?' fg-active':'')}>{ico}</IconButton>)}
        <div className="fg-nav-spacer"/><Avatar size={32} initials="НК" gradientColor={3}/>
      </nav>
      <div className="fg-layout">
        <aside className="fg-side">
          <Button mode="secondary" size="m" className="fg-new-event" onClick={() => resetForm()}>Новое событие</Button>
          <div className="fg-mini-cal"><div className="fg-mini-head"><IconButton label="Предыдущий месяц"><Icon20ChevronLeftOutline /></IconButton><b>Апрель 2025</b><IconButton label="Следующий месяц"><Icon20ChevronRightOutline /></IconButton></div>
            <div className="fg-mini-grid">{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x=><span key={x}>{x}</span>)}
              {[31,...Array.from({length:30},(_,i)=>i+1),1,2,3,4].map((n,i)=><Tappable key={i} className={'fg-mini-day'+(i===8?' fg-today':'')+(i>6 && i<14?' fg-inweek':'')+(i===0||i>30?' fg-out':'')}
                onClick={()=> {if(i>=7&&i<14)resetForm(i-7,600);}}>{n}</Tappable>)}
            </div>
          </div>
          <div className="fg-cal-groups"><div className="fg-cal-group"><Icon16Dropdown />Личные</div>
            <Checkbox defaultChecked className="fg-cal-check">Основной</Checkbox>
            <div className="fg-cal-group"><Icon16Dropdown />Календари коллег</div>
            <Checkbox className="fg-cal-check">Ирина Петрова</Checkbox><Checkbox className="fg-cal-check">Олег Соколов</Checkbox>
          </div>
          <div className="fg-side-spacer"/>
          <SimpleCell before={<Icon20ArticleBoxOutline />}>Распечатать неделю</SimpleCell>
          <SimpleCell before={<Icon20BuildingOutline />}>Настройки</SimpleCell>
        </aside>
        <main className="fg-calendar-area">
          <div className="fg-week-toolbar"><Button size="m" mode="secondary" onClick={() => resetForm()}>Сегодня</Button>
            <IconButton label="Предыдущая неделя"><Icon20ChevronLeftOutline /></IconButton>
            <IconButton label="Следующая неделя"><Icon20ChevronRightOutline /></IconButton>
            <Text weight="2" className="fg-week-range">7 апреля – 13 апреля</Text>
            {['День','Неделя','Месяц','Год','Расписание','Фильтр'].map((n,i)=><Button key={n} size="s" mode="tertiary" className={'fg-week-nav'+(i===1?' fg-selected':'')} onClick={()=>i!==1&&alert(`Режим «${n}» в текущем превью не реализован`)}>{n}</Button>)}
          </div>
          <div className="fg-week-board">
            <div className="fg-week-head"><div />{DAYS.map((d,i)=><div key={i} className={(i===1?'fg-now ':'')+(i===0?'fg-past':'')}><b>{i+7}</b><small>{d}</small></div>)}</div>
            <div className="fg-week-scroll" ref={weekScroll}>
              <div className="fg-week-body">
                <div className="fg-hours">{Array.from({length:18},(_,i)=><div key={i}>{i===0?'':`${String(i+6).padStart(2,'0')}:00`}</div>)}</div>
                {DAYS.map((name,d)=><div key={name} className={'fg-week-column'+(d>=5?' fg-weekend':'')}
                  onClick={e=> { if((e.target as HTMLElement).closest('button'))return;
                    const r=e.currentTarget.getBoundingClientRect();const n=Math.max(360,Math.min(1380,360+Math.round((e.clientY-r.top)/28)*30));resetForm(d,n); }}>
                  {[...EVENTS,...savedEvents].filter(e=>e.d===d).map(e=>{const top=(e.start-360)/60*56+2,height=Math.max(22,(e.end-e.start)/60*56-3);
                    return <Tappable key={e.id} className={'fg-week-event '+(e.color||'sky')} style={{top,height}} onClick={()=> {setDay(e.d);setFrom(e.start);setTo(e.end);setTitle(e.title);setShowForm(true);setScreen('event');}}>
                      <b>{e.title}</b>{height>44&&<span>{toTime(e.start)} – {toTime(e.end)}</span>}
                    </Tappable>;})}
                  {showForm && !aiDone && day===d && <div className="fg-draft-event" style={{top:(from-360)/60*56+2,height:Math.max(22,(to-from)/60*56-3)}}>{title||'Новое событие'}</div>}
                </div>)}
              </div>
            </div>
          </div>
          {showForm && <div className={'fg-event-form fg-mode-'+screen+(participantsExpanded && aiDone ? ' fg-participants-expanded' : '')} data-testid="event-form">
            <div className="fg-event-head">
              {compact ? <Tappable className="fg-ai-entry" onClick={startAI}><Icon20Stars /><span>Заполнить с нейропомощником</span></Tappable>
              : <Tappable className="fg-ai-entry fg-ai-back" onClick={leaveAI}><Icon20ChevronLeftOutline /><span>Нейропомощник</span></Tappable>}
              <IconButton label="Закрыть форму" className="fg-form-close" onClick={()=>setShowForm(false)}><Icon20Cancel /></IconButton>
            </div>
            {isAI && <div className={'fg-ai-panel'+(aiDone?' fg-ai-completed':'')}>
              {aiDone ? <div className="fg-ai-success"><Icon20CheckCircleOutline /><span>Заполнил 4 поля</span><Button mode="tertiary" onClick={undoAI} before={<Icon20ArrowUturnLeftOutline />}>Отменить</Button></div>
                : screen==='ai-compose' ? <><Textarea aria-label="Запрос нейропомощнику" className="fg-ai-text" placeholder="1:1 с дизайнером" value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} />
                   <div className="fg-ai-bottom"><IconButton label="Прикрепить файл" onClick={()=>alert('Вложения в демонстрации')}><Icon20Attach /></IconButton><Button mode="primary" disabled={!aiPrompt.trim()} onClick={fillAI}>Заполнить</Button></div></>
                : <div className="fg-ai-message">{submittedContent}</div>}
            </div>}
            <div className={'fg-card-inner'+(screen==='ai-wait' ? ' fg-loading-card' : '')}>{screen === 'ai-wait' ? waitBody : formBody(aiBlocked)}</div>
          </div>}
        </main>
      </div>
    </div></div>
    {toast && <div className="fg-toast" role="status">{toast}</div>}
  </div>;
}

// The library does not expose an event-create icon with consistent small geometry in every package version.
// Reuse the VK Icons plus icon (never custom SVG).
const Icon20AddFallback = Icon16Add;